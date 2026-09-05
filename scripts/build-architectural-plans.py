"""Rebuild orthographic plans from reviewed, pinned PDF vector features.

No floor/room outlines are read from the legacy hand-drawn maps. Source drawing
IDs refer to PyMuPDF get_drawings(), with clipping applied before classification.
Only reviewed structural lines become walls. Labels and furnishings never do.
"""
import argparse
import hashlib
import json
import math
import re
from pathlib import Path

import fitz
import cv2
import numpy as np
from shapely.affinity import affine_transform
from shapely.geometry import GeometryCollection, LineString, Polygon, box
from shapely.ops import polygonize, unary_union
from shapely import make_valid, set_precision

ROOT = Path(__file__).resolve().parents[1]


def validate_projection(config):
    review = config.get("sourceProjection", {})
    if review.get("kind") != "orthographic":
        raise ValueError("Unreviewed or oblique source: rectify and visually verify a plan view before extraction")
    if len(review.get("basis", "").strip()) < 30:
        raise ValueError("Projection review needs a specific visual basis")
    required_pages = {floor["page"] for floor in config["floors"]}
    if set(review.get("pages", [])) != required_pages:
        raise ValueError("Projection review does not cover every extracted page")


def closed_wall_profiles(drawings, spec):
    # Only explicitly reviewed, closed masonry contours may be filled. Keep
    # open contours as line evidence; do not infer room floors from this step.
    ids = spec["ids"]
    grid = spec["endpointGrid"]
    if not 0 < grid <= .05:
        raise ValueError("Wall endpoint quantization exceeds the source precision budget")
    lines = [set_precision(LineString(p), grid) for i in ids for p in subpaths(drawings[i])]
    profiles = sorted(polygonize(unary_union(lines)), key=lambda p: p.area, reverse=True)
    if [round(p.area, 2) for p in profiles] != spec["expectedAreas"]:
        raise ValueError("Wall profile inventory changed; visual source review required")
    return profiles


def color(value):
    return tuple(round(v, 3) for v in value) if value else None


def subpaths(drawing):
    result, current = [], []
    def append(points):
        nonlocal current
        if current and math.dist(current[-1], points[0]) > 0.001:
            result.append(current)
            current = []
        current.extend(points if not current else points[1:])
    for item in drawing["items"]:
        if item[0] == "l":
            append([tuple(item[1]), tuple(item[2])])
        elif item[0] == "c":
            points = []
            a, b, c, d = item[1:]
            # Fixed sub-pixel error budget at source-document scale.
            length = abs(b-a) + abs(c-b) + abs(d-c)
            for step in range(max(8, min(96, math.ceil(length / 1.5))) + 1):
                t = step / max(8, min(96, math.ceil(length / 1.5)))
                p = a*(1-t)**3 + b*3*t*(1-t)**2 + c*3*t*t*(1-t) + d*t**3
                points.append(tuple(p))
            append(points)
        elif item[0] == "re":
            r = item[1]
            append([tuple(r.tl), tuple(r.tr), tuple(r.br), tuple(r.bl), tuple(r.tl)])
        elif item[0] == "qu":
            q = item[1]
            append([tuple(q.ul), tuple(q.ur), tuple(q.lr), tuple(q.ll), tuple(q.ul)])
        else:
            raise ValueError(f"Unclassified path instruction: {item[0]}")
    if current:
        if drawing.get("closePath") and current[-1] != current[0]:
            current.append(current[0])
        result.append(current)
    return [p for p in result if len(p) > 1]


def fill_geometry(drawing):
    # Illustrator uses both winding and even-odd compound paths.
    rings = []
    for points in subpaths(drawing):
        if len(points) < 3:
            continue
        p = make_valid(Polygon(points))
        if not p.is_empty and p.area > 1e-6:
            signed = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points, points[1:]+points[:1]))
            rings.append((p, signed))
    if not rings:
        return GeometryCollection()
    rings.sort(key=lambda entry: entry[0].area, reverse=True)
    geometry = GeometryCollection()
    for polygon, winding in rings:
        parent = next((s for outer,s in rings if outer.area > polygon.area and outer.covers(polygon)), None)
        hole = parent is not None and (drawing.get("even_odd") or parent*winding < 0)
        geometry = geometry.difference(polygon) if hole else geometry.union(polygon)
    return geometry


def visible_drawings(page):
    clips, index = [], 0
    for item in page.get_drawings(extended=True):
        level = item.get("level", 0)
        while clips and clips[-1][0] >= level:
            clips.pop()
        if item["type"] == "clip":
            clips.append((level, fill_geometry(item)))
            continue
        if item["type"] == "group":
            continue
        clip = box(*page.rect)
        for _, shape in clips:
            clip = clip.intersection(shape)
        yield index, item, clip
        index += 1


def polygons(geometry, origin):
    result = []
    def point(p):
        return [round(p[0]-origin[0], 4), round(p[1]-origin[1], 4)]
    for poly in ([geometry] if geometry.geom_type == "Polygon" else getattr(geometry, "geoms", [])):
        if poly.geom_type == "Polygon" and poly.area > 0.001:
            result.append({"outer": [point(p) for p in poly.exterior.coords],
                           "holes": [[point(p) for p in ring.coords] for ring in poly.interiors]})
    return result


def matches(index, drawing, rule):
    if "ids" in rule and index not in rule["ids"]:
        return False
    if "ranges" in rule and not any(a <= index <= b for a,b in rule["ranges"]):
        return False
    if index in rule.get("exclude", []):
        return False
    if drawing.get("width") is not None:
        if drawing["width"] < rule.get("minWidth", 0) or drawing["width"] > rule.get("maxWidth", float("inf")):
            return False
    if "type" in rule and drawing["type"] not in rule["type"]:
        return False
    channel = "fill" if rule.get("channel") == "fill" else "color"
    if "colors" in rule and color(drawing.get(channel)) not in [tuple(c) for c in rule["colors"]]:
        return False
    return True


def trace_pixel_ink(mask, tolerance=.2):
    runs = []
    for y, row in enumerate(mask):
        edges = np.diff(np.pad(row.astype(np.int16), (1, 1)))
        for left, right in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)):
            runs.append(box(int(left), y, int(right), y + 1))
    geometry = unary_union(runs)
    simplified = geometry.simplify(tolerance, preserve_topology=True)
    if geometry.symmetric_difference(simplified).area > max(.01, geometry.area * .005):
        return geometry
    return simplified


def raster_geometry(document, page, spec):
    """Trace reviewed architectural ink, not the page's labels or legend.

    Source pixels are retained to within the configured contour tolerance.
    Thick structural ink and thin plan details are separate classifications;
    fine ink stays flat rather than being promoted to a wall.
    """
    pixmap = fitz.Pixmap(document, spec["xref"])
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)[:, :, :3]
    if "rgbRange" in spec:
        low, high = spec["rgbRange"]
        ink = np.all((rgb >= low) & (rgb <= high), axis=2).astype(np.uint8)
    else:
        ink = (np.max(rgb, axis=2) <= spec["maxChannel"]).astype(np.uint8)
    matrix = page.get_image_rects(spec["xref"], transform=True)[spec.get("occurrence", 0)][1]
    inverse = ~matrix
    def pixel_rect(rect):
        # Review masks use source PDF coordinates, not fitted screen pixels.
        r = fitz.Rect(rect) * inverse
        return (max(0, round(r.x0 * pixmap.width)), max(0, round(r.y0 * pixmap.height)),
                min(pixmap.width, round(r.x1 * pixmap.width)), min(pixmap.height, round(r.y1 * pixmap.height)))
    for exclusion in spec.get("excludeRects", []):
        x0, y0, x1, y1 = pixel_rect(exclusion["rect"])
        ink[y0:y1, x0:x1] = 0
    if spec.get("wallKernel", 1) > 1:
        kernel = np.ones((spec["wallKernel"], spec["wallKernel"]), np.uint8)
        walls = cv2.morphologyEx(ink, cv2.MORPH_OPEN, kernel)
    else:
        walls = ink.copy()
    for region in spec.get("flatRects", []):
        x0, y0, x1, y1 = pixel_rect(region["rect"])
        walls[y0:y1, x0:x1] = 0
    transform = [matrix.a / pixmap.width, matrix.c / pixmap.height,
                 matrix.b / pixmap.width, matrix.d / pixmap.height, matrix.e, matrix.f]
    for kind, mask in (("wall", walls), ("detail", ink - walls)):
        # Union exact pixel runs. Contour repair can accidentally fill a room
        # when one-pixel vault strokes touch their own hole boundaries.
        simplified = trace_pixel_ink(mask, spec.get("tolerancePixels", .2))
        parts = [simplified] if simplified.geom_type == "Polygon" else getattr(simplified, "geoms", [])
        for i, polygon in enumerate(parts):
            if polygon.area >= spec.get("minAreaPixels", .5):
                yield kind, i, affine_transform(polygon, transform)


def build(config):
    validate_projection(config)
    source = ROOT / "sources/floorplans" / config["file"]
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if digest != config["sha256"]:
        raise ValueError(f"Source changed; review required: {source.name}")
    document = fitz.open(source)
    floors, places, claims, spaces, openings = [], [], [], [], []
    for spec in config["floors"]:
        page = document[spec["page"] - 1]
        crop = box(*spec["crop"])
        origin = spec["crop"][:2]
        floor_id = spec["id"]
        features = []
        for space in spec.get("spaces", []):
            shape = Polygon(space["outer"], space.get("holes", []))
            if not shape.is_valid or not shape.area:
                raise ValueError(f"Invalid reviewed space {space['id']}")
            rings = polygons(shape, origin)
            space_id = f"{floor_id}-{space['id']}"
            features.append({"id": space_id + "-floor", "kind":"surface", "tone":space.get("tone","neutral"), "polygons":rings})
            spaces.append({"id":space_id,"floorId":floor_id,"label":space["label"],"placeId":space["placeId"],"polygons":rings})
            for feature_id in (space_id, space_id + "-floor"):
                claims.append({"featureId":feature_id,"sourceHash":digest,"page":spec["page"],"sourcePaths":space["sourcePaths"],
                               "classification":space["evidence"],"precision":"source-wall-boundaries-with-openings-closed-as-floor-only"})
        for opening in spec.get("openings", []):
            opening_id = f"{floor_id}-{opening['id']}"
            openings.append({"id":opening_id,"floorId":floor_id,"spaceId":f"{floor_id}-{opening['spaceId']}",
                             "segment":[[round(p[i]-origin[i],4) for i in (0,1)] for p in opening["segment"]]})
            claims.append({"featureId":opening_id,"sourceHash":digest,"page":spec["page"],"sourcePaths":opening["sourcePaths"],
                           "classification":opening["evidence"],"precision":"documented-wall-gap-not-access-permission"})
        classified = set()
        for index, drawing, clip in visible_drawings(page):
            for rule in spec["rules"]:
                if not matches(index, drawing, rule):
                    continue
                if rule.get("channel") == "fill":
                    geometry = fill_geometry(drawing)
                else:
                    width = drawing.get("width") or 0.5
                    geometry = unary_union([LineString(p).buffer(width/2, cap_style=2, join_style=2) for p in subpaths(drawing)])
                geometry = geometry.intersection(clip).intersection(crop)
                if geometry.is_empty:
                    continue
                feature_id = f"{floor_id}-path-{index}-{rule['kind']}"
                rings = polygons(geometry, origin)
                if not rings:
                    continue
                features.append({"id": feature_id, "kind": rule["kind"],
                                 "tone": rule.get("tone", "stone"), "polygons": rings})
                claims.append({"featureId": feature_id, "sourceHash": digest, "page": spec["page"],
                               "path": index, "classification": rule["reason"], "precision": "source-proportional"})
                classified.add(index)
                break
        for group in spec.get("wallProfiles", []):
            for index, shape in enumerate(closed_wall_profiles(page.get_drawings(), group)):
                feature_id = f"{floor_id}-{group['id']}-{index}"
                rings = polygons(shape.intersection(crop), origin)
                features.append({"id":feature_id, "kind":"wall", "tone":"stone", "polygons":rings})
                claims.append({"featureId":feature_id,"sourceHash":digest,"page":spec["page"],
                               "sourcePaths":group["ids"],"classification":group["evidence"],
                               "endpointGrid":group["endpointGrid"],"precision":"reviewed-closed-wall-profile-not-a-room-fill"})
        for raster in spec.get("rasterLayers", []):
            for kind, index, geometry in raster_geometry(document, page, raster):
                rings = polygons(geometry.intersection(crop), origin)
                if not rings:
                    continue
                feature_id = f"{floor_id}-raster-{raster['xref']}-{kind}-{index}"
                features.append({"id": feature_id, "kind": kind, "tone": "stone", "polygons": rings})
                claims.append({"featureId": feature_id, "sourceHash": digest, "page": spec["page"],
                               "imageXref": raster["xref"], "classification": raster["reason"],
                               "traceParameters": {k: raster[k] for k in ("maxChannel", "rgbRange", "wallKernel", "tolerancePixels", "excludeRects", "flatRects") if k in raster},
                               "precision": "source-raster-proportional-not-surveyed"})
        for space in spec.get("sourceSpaces", []):
            space_id = f"{floor_id}-{space['id']}"
            feature_ids = [f"{floor_id}-path-{index}-surface" for index in space["sourcePaths"]]
            selected = [next((f for f in features if f["id"] == id_), None) for id_ in feature_ids]
            if not all(selected):
                raise ValueError(f"Missing reviewed floor surface for {space_id}")
            spaces.append({"id":space_id, "floorId":floor_id, "label":space["label"], "placeId":space["placeId"],
                           "featureIds":feature_ids, "polygons":[p for f in selected for p in f["polygons"]]})
            claims.append({"featureId":space_id,"sourceHash":digest,"page":spec["page"],"sourcePaths":space["sourcePaths"],
                           "classification":space["evidence"],"precision":"exact-reviewed-source-floor-footprint"})
        anchors = list(spec.get("places", []))
        if spec.get("labelPattern"):
            pattern = re.compile(spec["labelPattern"])
            for word in page.get_text("words"):
                x0,y0,x1,y1,text,*_ = word
                text = text.replace("\uf47e", "1")
                if pattern.fullmatch(text) and crop.covers(box(x0,y0,x1,y1)):
                    anchors.append({"label": text, "at": [(x0+x1)/2,(y0+y1)/2], "kind": spec.get("defaultPlaceKind", "room"), "name": spec.get("labelNames", {}).get(text, text)})
        expected = sorted(spec.get("expectedLabels", [a["label"] for a in anchors]))
        if sorted(a["label"] for a in anchors) != expected:
            raise ValueError(f"{config['slug']} {floor_id}: label inventory changed")
        anchors += spec.get("servicePlaces", [])
        counts = {}
        for anchor in anchors:
            label = anchor["label"]
            counts[label] = counts.get(label, 0)+1
            id_ = f"{floor_id}-{label.replace(' ', '-')}-{counts[label]}"
            places.append({"id": id_, "floorId": floor_id, "label": label,
                           "kind": anchor.get("kind", "room"), "name": anchor.get("name", label),
                           "at": [round(anchor["at"][i]-origin[i],4) for i in (0,1)]})
            claims.append({"featureId": id_, "sourceHash": digest, "page": spec["page"],
                           "sourceAnchor": anchor["at"], "classification": "reviewed printed room/service anchor",
                           "precision": "room-label-position-not-artwork-wall-position"})
        if not features:
            raise ValueError(f"No geometry for {floor_id}")
        points = [p for f in features for poly in f["polygons"] for p in poly["outer"]]
        bounds = [min(p[i] for p in points) for i in (0,1)] + [max(p[i] for p in points) for i in (0,1)]
        features.sort(key=lambda f: {"surface": 0, "detail": 1, "wall": 2}[f["kind"]])
        floors.append({"id": floor_id, "label": spec["label"], "order": spec["order"],
                       "bounds": bounds, "features": features})
    links = []
    for link in config.get("verticalLinks", []):
        endpoints = [next((p for p in places if p["id"] == link[key]), None) for key in ("fromPlaceId", "toPlaceId")]
        if not all(endpoints) or endpoints[0]["floorId"] == endpoints[1]["floorId"]:
            raise ValueError(f"Invalid cross-floor link {link['id']}")
        claims.append({"featureId": link["id"], "sourceHash": digest, "classification": link["evidence"], "precision": "documented-connection-not-surveyed-shaft"})
        links.append({key: value for key, value in link.items() if key != "evidence"})
    model = {"version": 2, "slug": config["slug"], "projection": "orthographic",
             "registration": "independent-floor-diagrams", "floors": floors, "places": places,
             "limitations": config["limitations"], "stopBindings": config.get("stopBindings", []),
             "sourceDigest": digest, "verticalLinks": links, "spaces":spaces, "openings":openings}
    folder = ROOT / "app/data/architectural-plans"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{config['slug']}.json").write_text(json.dumps(model, ensure_ascii=False, separators=(",", ":"))+"\n")
    evidence_folder = ROOT / "sources/floorplans/evidence"
    evidence_folder.mkdir(exist_ok=True)
    (evidence_folder / f"{config['slug']}.json").write_text(json.dumps({
        "source": config["url"], "sha256": digest, "projection": config["sourceProjection"],
        "transform": "translation only, equal x/y units; floor stacking is display-only",
        "review": config["review"], "claims": claims,
        "coverage": {"floors": len(floors), "labels": len(places), "features": sum(len(f["features"]) for f in floors)},
    }, ensure_ascii=False, indent=2)+"\n")
    print(config["slug"], "floors",len(floors),"labels",len(places),"features",sum(len(f["features"]) for f in floors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="*")
    args = parser.parse_args()
    configs = json.loads((ROOT / "sources/floorplans/extraction.json").read_text())
    configs += [json.loads(path.read_text()) for path in sorted((ROOT / "sources/floorplans/venues").glob("*.json"))]
    for config in configs:
        if not args.slugs or config["slug"] in args.slugs:
            build(config)
