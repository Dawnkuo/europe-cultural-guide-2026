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
from bisect import bisect_right
from pathlib import Path

import fitz
import cv2
import numpy as np
from shapely.affinity import affine_transform
from shapely.geometry import GeometryCollection, LineString, Polygon, box
from shapely.ops import polygonize, substring, unary_union
from shapely import make_valid, set_precision

ROOT = Path(__file__).resolve().parents[1]


def validate_projection(config):
    sources = {"primary": config, **{source["id"]: source for source in config.get("sourceFiles", [])}}
    if len(sources) != 1 + len(config.get("sourceFiles", [])):
        raise ValueError("Duplicate source identifier")
    for floor in config["floors"]:
        if floor.get("sourceId", "primary") not in sources:
            raise ValueError("Floor references an unknown source")
    for source_id, source in sources.items():
        review = source.get("sourceProjection", {})
        if review.get("kind") != "orthographic":
            raise ValueError("Unreviewed or oblique source: rectify and visually verify a plan view before extraction")
        if len(review.get("basis", "").strip()) < 30:
            raise ValueError("Projection review needs a specific visual basis")
        required_pages = {floor["page"] for floor in config["floors"] if floor.get("sourceId", "primary") == source_id}
        if set(review.get("pages", [])) != required_pages:
            raise ValueError("Projection review does not cover every extracted page")


def open_sources(config):
    sources = {"primary": config, **{source["id"]: source for source in config.get("sourceFiles", [])}}
    documents = {}
    for source_id, record in sources.items():
        source = ROOT / "sources/floorplans" / record["file"]
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        if digest != record["sha256"]:
            raise ValueError(f"Source changed; review required: {source.name}")
        documents[source_id] = fitz.open(source)
    return sources, documents


def closed_wall_profiles(drawings, spec):
    # Only explicitly reviewed, closed masonry contours may be filled. Keep
    # open contours as line evidence; do not infer room floors from this step.
    ids = spec["ids"]
    grid = spec["endpointGrid"]
    if not 0 < grid <= .05:
        raise ValueError("Wall endpoint quantization exceeds the source precision budget")
    lines = [set_precision(LineString(p), grid) for i in ids for p in subpaths(drawings[i])]
    if "clipBounds" in spec:
        clip = box(*spec["clipBounds"])
        lines = [line.intersection(clip) for line in lines]
    profiles = sorted(polygonize(unary_union(lines)), key=lambda p: p.area, reverse=True)
    if [round(p.area, 2) for p in profiles] != spec["expectedAreas"]:
        raise ValueError("Wall profile inventory changed; visual source review required")
    if "profileIndices" in spec:
        indices = spec["profileIndices"]
        if not indices or len(set(indices)) != len(indices) or any(type(i) is not int or not 0 <= i < len(profiles) for i in indices):
            raise ValueError("Invalid reviewed wall profile selection")
        return [profiles[i] for i in indices]
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


def stroke_geometry(drawing):
    width = drawing.get("width") or 0.5
    lines = [LineString(points) for points in subpaths(drawing)]
    encoded = drawing.get("dashes") or "[] 0"
    match = re.fullmatch(r"\[([^\]]*)\]\s*([-+\d.eE]+)", encoded.strip())
    if not match:
        raise ValueError(f"Unsupported PDF dash array: {encoded}")
    pattern = [float(value) for value in match[1].split()]
    if not pattern:
        return unary_union([line.buffer(width / 2, cap_style=2, join_style=2) for line in lines])
    phase = float(match[2])
    if any(not math.isfinite(value) or value < 0 for value in [*pattern, phase]) or sum(pattern) <= 0:
        raise ValueError(f"Invalid PDF dash array: {encoded}")
    if len(pattern) % 2:
        pattern *= 2
    cycle = sum(pattern)
    caps = drawing.get("lineCap", (0, 0, 0))
    cap = max(caps) if isinstance(caps, (list, tuple)) else caps
    cap_style = {0: 2, 1: 1, 2: 3}[cap]
    segments = []
    for line in lines:
        # The PDF dash phase restarts at each subpath, not at each curve segment.
        position = -(phase % cycle)
        while position < line.length:
            for index, length in enumerate(pattern):
                end = position + length
                if index % 2 == 0 and end >= 0 and position <= line.length:
                    if length > 0 or cap == 1:
                        segment = substring(line, max(0, position), min(line.length, end))
                        segments.append(segment.buffer(width / 2, cap_style=cap_style, join_style=2))
                position = end
    return unary_union(segments)


def closed_source_region(drawings, ids):
    regions = []
    for index in ids:
        paths = subpaths(drawings[index])
        if not paths or any(len(points) < 4 or points[0] != points[-1] for points in paths):
            raise ValueError("Source clipping requires explicitly closed paths")
        regions.append(fill_geometry(drawings[index]))
    if not regions:
        raise ValueError("Source clipping requires a reviewed boundary")
    return unary_union(regions)


def visible_drawings(page):
    # Extended extraction sometimes splits a native `fs` into two operations.
    # Source inventories use native indices, so counting extended records shifts
    # every later room/feature. Retain native identities and each channel's clip.
    native = page.get_drawings()
    by_sequence = {drawing["seqno"]: index for index, drawing in enumerate(native)}
    sequences = [drawing["seqno"] for drawing in native]
    channel_clips = [{} for _ in native]
    clips = []
    for item in page.get_drawings(extended=True):
        level = item.get("level", 0)
        while clips and clips[-1][0] >= level:
            clips.pop()
        if item["type"] == "clip":
            clips.append((level, fill_geometry(item)))
            continue
        if item["type"] == "group":
            continue
        index = by_sequence.get(item["seqno"])
        if index is None and item["type"] == "s":
            prior = bisect_right(sequences, item["seqno"]) - 1
            if prior >= 0 and native[prior]["type"] == "fs":
                index = prior
        if index is None or item["items"] != native[index]["items"]:
            raise ValueError(f"Cannot match extended PDF operation {item['seqno']} to its native path")
        clip = box(*page.rect)
        for _, shape in clips:
            clip = clip.intersection(shape)
        for channel in ("fill", "stroke"):
            if (channel == "fill" and "f" in item["type"]) or (channel == "stroke" and "s" in item["type"]):
                channel_clips[index].setdefault(channel, []).append(clip)
    for index, drawing in enumerate(native):
        channels = {key: unary_union(values) for key, values in channel_clips[index].items()}
        required = {key for key, marker in (("fill", "f"), ("stroke", "s")) if marker in drawing["type"]}
        if set(channels) != required:
            raise ValueError(f"Missing PDF drawing channels for native path {index}")
        yield index, {**drawing, "channelClips": channels}, unary_union(list(channels.values()))


def polygons(geometry, origin):
    result = []
    local = affine_transform(geometry, [1, 0, 0, 1, -origin[0], -origin[1]])
    # Snap as topology, not independent rounded vertices: fine vector strokes
    # can otherwise acquire self-intersections during JSON serialization.
    geometry = set_precision(make_valid(local), .0001, mode="valid_output")
    def point(p):
        return [round(p[0], 4), round(p[1], 4)]
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
    if mask.ndim != 2 or not np.all((mask == 0) | (mask == 1)):
        raise ValueError("Pixel tracing requires a binary source mask")
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
    if "maxChroma" in spec:
        # Neutral linework can range from black to pale grey. Separate hue
        # from luminance so rejecting coloured callouts does not erase walls.
        ink &= ((rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)) <= spec["maxChroma"]).astype(np.uint8)
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
        # An even kernel's asymmetric anchor may shift opened ink outside
        # the source. Classification must never add or move source pixels.
        walls &= ink
    else:
        walls = ink.copy()
    if spec.get("allInkIsDetail"):
        # Paving, furniture and architectural outlines can share one raster
        # colour. A reviewed line-only layer must never become solid masonry.
        walls[:] = 0
    for region in spec.get("flatRects", []):
        x0, y0, x1, y1 = pixel_rect(region["rect"])
        walls[y0:y1, x0:x1] = 0
    transform = [matrix.a / pixmap.width, matrix.c / pixmap.height,
                 matrix.b / pixmap.width, matrix.d / pixmap.height, matrix.e, matrix.f]
    details = ink & (1 - walls)
    for kind, mask in (("wall", walls), ("detail", details)):
        # Union exact pixel runs. Contour repair can accidentally fill a room
        # when one-pixel vault strokes touch their own hole boundaries.
        simplified = trace_pixel_ink(mask, spec.get("tolerancePixels", .2))
        parts = [simplified] if simplified.geom_type == "Polygon" else getattr(simplified, "geoms", [])
        for i, polygon in enumerate(parts):
            if polygon.area >= spec.get("minAreaPixels", .5):
                yield kind, i, affine_transform(polygon, transform)


def reviewed_raster_kind(spec, source_kind):
    kinds = spec.get("includeKinds", ["wall", "detail"])
    mapping = spec.get("kindMap", {})
    if not isinstance(kinds, list) or not kinds or set(kinds) - {"wall", "detail"}:
        raise ValueError("Raster includeKinds must name reviewed wall/detail channels")
    if set(mapping) - {"wall", "detail"} or set(mapping.values()) - {"wall", "detail", "surface"}:
        raise ValueError("Invalid reviewed raster kindMap")
    return mapping.get(source_kind, source_kind) if source_kind in kinds else None


def build(config):
    validate_projection(config)
    source_records, documents = open_sources(config)
    floors, places, claims, spaces, openings = [], [], [], [], []
    for spec in config["floors"]:
        source_id = spec.get("sourceId", "primary")
        document = documents[source_id]
        digest = source_records[source_id]["sha256"]
        page = document[spec["page"] - 1]
        crop = box(*spec["crop"])
        origin = spec["crop"][:2]
        floor_id = spec["id"]
        features = []
        for space in spec.get("spaces", []) + spec.get("selectionSpaces", []):
            selection_only = space.get("selectionOnly", False)
            shape = unary_union([Polygon(p["outer"], p.get("holes", [])) for p in space["polygons"]]) if "polygons" in space else Polygon(space["outer"], space.get("holes", []))
            if not shape.is_valid or not shape.area:
                raise ValueError(f"Invalid reviewed space {space['id']}")
            rings = polygons(shape, origin)
            space_id = f"{floor_id}-{space['id']}"
            if not selection_only:
                features.append({"id": space_id + "-floor", "kind":"surface", "tone":space.get("tone","neutral"), "polygons":rings})
            spaces.append({"id":space_id,"floorId":floor_id,"label":space["label"],"placeId":space["placeId"],"polygons":rings})
            if selection_only:
                spaces[-1]["featureIds"] = []
            if "scope" in space:
                spaces[-1]["scope"] = space["scope"]
            for feature_id in (space_id,) if selection_only else (space_id, space_id + "-floor"):
                claims.append({"featureId":feature_id,"sourceHash":digest,"page":spec["page"],"sourcePaths":space["sourcePaths"],
                               "classification":space["evidence"],"precision":"source-wall-boundaries-with-openings-closed-as-floor-only"})
                if selection_only:
                    claims[-1].update({"precision":"source-boundary-selection-only-not-building-geometry",
                                       "selectionOnly":True,"selectionCuts":spec.get("selectionCuts",[])})
        for opening in spec.get("openings", []):
            opening_id = f"{floor_id}-{opening['id']}"
            openings.append({"id":opening_id,"floorId":floor_id,"spaceId":f"{floor_id}-{opening['spaceId']}",
                             "segment":[[round(p[i]-origin[i],4) for i in (0,1)] for p in opening["segment"]]})
            claims.append({"featureId":opening_id,"sourceHash":digest,"page":spec["page"],"sourcePaths":opening["sourcePaths"],
                           "classification":opening["evidence"],"precision":"documented-wall-gap-not-access-permission"})
        classified = set()
        source_drawings = {index: (drawing, clip) for index, drawing, clip in visible_drawings(page)}
        for index, (drawing, clip) in source_drawings.items():
            for rule in spec["rules"]:
                if not matches(index, drawing, rule):
                    continue
                if rule.get("channel") == "fill":
                    geometry = fill_geometry(drawing)
                else:
                    geometry = stroke_geometry(drawing)
                channel_clip = drawing["channelClips"].get("fill" if rule.get("channel") == "fill" else "stroke", clip)
                geometry = geometry.intersection(channel_clip).intersection(crop)
                if "overpaintFillPaths" in rule:
                    # A later PDF fill may clear the interior of a service
                    # core. Preserve that visible hole in the wall mesh.
                    for fill_id in rule["overpaintFillPaths"]:
                        fill_drawing, fill_clip = source_drawings[fill_id]
                        if fill_id <= index or fill_drawing["type"] not in ("f", "fs") or fill_drawing.get("fill_opacity") != 1:
                            raise ValueError("Overpaint must identify a later source fill")
                        fill_clip = fill_drawing["channelClips"].get("fill", fill_clip)
                        geometry = geometry.difference(fill_geometry(fill_drawing).intersection(fill_clip))
                if "withinClosedPaths" in rule:
                    geometry = geometry.intersection(closed_source_region(page.get_drawings(), rule["withinClosedPaths"]))
                for region in rule.get("excludeContextRegions", []):
                    if rule["kind"] != "surface" or not region.get("evidence"):
                        raise ValueError("Context removal requires a documented floor-surface region")
                    geometry = geometry.difference(box(*region["bounds"]))
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
                if "withinClosedPaths" in rule:
                    claims[-1]["withinClosedPaths"] = rule["withinClosedPaths"]
                if "overpaintFillPaths" in rule:
                    claims[-1]["overpaintFillPaths"] = rule["overpaintFillPaths"]
                if "excludeContextRegions" in rule:
                    claims[-1]["excludeContextRegions"] = rule["excludeContextRegions"]
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
                if "profileIndices" in group:
                    profile_index = group["profileIndices"][index]
                    claims[-1]["profileIndex"] = profile_index
                    if "profileSourcePaths" in group:
                        claims[-1]["sourcePaths"] = group["profileSourcePaths"][str(profile_index)]
                        claims[-1]["sourceProfileGroup"] = f"{floor_id}-{group['id']}"
        raster_instances = {}
        for raster in spec.get("rasterLayers", []):
            instance = raster_instances.get(raster["xref"], 0)
            raster_instances[raster["xref"]] = instance + 1
            instance_suffix = f"-instance-{instance}" if instance else ""
            for kind, index, geometry in raster_geometry(document, page, raster):
                output_kind = reviewed_raster_kind(raster, kind)
                if output_kind is None:
                    continue
                rings = polygons(geometry.intersection(crop), origin)
                if not rings:
                    continue
                feature_id = f"{floor_id}-raster-{raster['xref']}{instance_suffix}-{kind}-{index}"
                features.append({"id": feature_id, "kind": output_kind, "tone": raster.get("tone", "stone"), "polygons": rings})
                claims.append({"featureId": feature_id, "sourceHash": digest, "page": spec["page"],
                               "imageXref": raster["xref"], "imageOccurrence": raster.get("occurrence", 0), "extractionInstance": instance, "classification": raster["reason"],
                               "traceParameters": {k: raster[k] for k in ("maxChannel", "maxChroma", "rgbRange", "wallKernel", "tolerancePixels", "allInkIsDetail", "excludeRects", "flatRects", "includeKinds", "kindMap") if k in raster},
                               "precision": "source-raster-proportional-not-surveyed"})
        for space in spec.get("sourceSpaces", []):
            space_id = f"{floor_id}-{space['id']}"
            feature_ids = [f"{floor_id}-path-{index}-surface" for index in space["sourcePaths"]]
            selected = [next((f for f in features if f["id"] == id_), None) for id_ in feature_ids]
            if not all(selected):
                raise ValueError(f"Missing reviewed floor surface for {space_id}")
            spaces.append({"id":space_id, "floorId":floor_id, "label":space["label"], "placeId":space["placeId"],
                           "featureIds":feature_ids, "polygons":[p for f in selected for p in f["polygons"]]})
            if "scope" in space:
                spaces[-1]["scope"] = space["scope"]
            claims.append({"featureId":space_id,"sourceHash":digest,"page":spec["page"],"sourcePaths":space["sourcePaths"],
                           "classification":space["evidence"],"precision":"exact-reviewed-source-floor-footprint"})
        anchors = list(spec.get("places", []))
        if spec.get("labelPattern"):
            pattern = re.compile(spec["labelPattern"])
            for word in page.get_text("words"):
                x0,y0,x1,y1,text,*_ = word
                text = text.replace("\uf47e", "1")
                if pattern.fullmatch(text) and crop.covers(box(x0,y0,x1,y1)):
                    anchors.append({"label": text, "at": [(x0+x1)/2,(y0+y1)/2], "kind": spec.get("defaultPlaceKind", "room"), "name": spec.get("labelNames", {}).get(text, text), "evidence": "Printed identifier extracted at the original text-box center", "precision": "printed-room-label-position"})
        expected = sorted(spec.get("expectedLabels", [a["label"] for a in anchors]))
        if sorted(a["label"] for a in anchors) != expected:
            raise ValueError(f"{config['slug']} {floor_id}: label inventory changed")
        anchors += spec.get("servicePlaces", [])
        counts = {}
        for anchor in anchors:
            label = anchor["label"]
            counts[label] = counts.get(label, 0)+1
            id_ = f"{floor_id}-{label.replace(' ', '-')}-{counts[label]}"
            places.append({"id": id_, "floorId": floor_id, "label": anchor.get("displayLabel", label),
                           "kind": anchor.get("kind", "room"), "name": anchor.get("name", label),
                           "at": [round(anchor["at"][i]-origin[i],4) for i in (0,1)]})
            claims.append({"featureId": id_, "sourceHash": digest, "page": spec["page"],
                           "sourceAnchor": anchor["at"], "classification": anchor.get("evidence", "Visually reviewed room, service or geometry anchor; not necessarily printed text"),
                           "precision": anchor.get("precision", "reviewed-map-position-not-surveyed")})
        if not features:
            raise ValueError(f"No geometry for {floor_id}")
        points = [p for f in features for poly in f["polygons"] for p in poly["outer"]]
        bounds = [min(p[i] for p in points) for i in (0,1)] + [max(p[i] for p in points) for i in (0,1)]
        features.sort(key=lambda f: {"surface": 0, "detail": 1, "wall": 2}[f["kind"]])
        floors.append({"id": floor_id, "label": spec["label"], "order": spec["order"],
                       "bounds": bounds, "features": features})
        if source_id != "primary":
            floors[-1]["sourceId"] = source_id
    digest = config["sha256"]
    links = []
    for link in config.get("verticalLinks", []):
        if link.get("kind") not in ("stairs", "elevator") or not link.get("label", "").strip():
            raise ValueError(f"Invalid cross-floor link type/label {link['id']}")
        if any(prior["id"] == link["id"] for prior in links):
            raise ValueError(f"Duplicate cross-floor link {link['id']}")
        endpoints = [next((p for p in places if p["id"] == link[key]), None) for key in ("fromPlaceId", "toPlaceId")]
        if not all(endpoints) or endpoints[0]["floorId"] == endpoints[1]["floorId"]:
            raise ValueError(f"Invalid cross-floor link {link['id']}")
        claims.append({"featureId": link["id"], "sourceHash": digest, "classification": link["evidence"], "precision": "documented-connection-not-surveyed-shaft"})
        links.append({key: value for key, value in link.items() if key != "evidence"})
    model = {"version": 2, "slug": config["slug"], "projection": "orthographic",
             "registration": "independent-floor-diagrams", "floors": floors, "places": places,
             "limitations": config["limitations"], "stopBindings": config.get("stopBindings", []),
             "sourceDigest": digest, "verticalLinks": links, "spaces":spaces, "openings":openings}
    if config.get("unlocatedPlaces"):
        model["unlocatedPlaces"] = [{key: place[key] for key in ("id", "label", "name", "reason")} for place in config["unlocatedPlaces"]]
        for place in config["unlocatedPlaces"]:
            claims.append({"featureId": place["id"], "sourceHash": digest, "page": place["sourcePage"], "classification": place["evidence"], "precision": "unlocated-no-spatial-claim"})
    if config.get("sourceFiles"):
        model["sourceDigests"] = {source_id: record["sha256"] for source_id, record in source_records.items()}
    folder = ROOT / "app/data/architectural-plans"
    folder.mkdir(parents=True, exist_ok=True)
    (folder / f"{config['slug']}.json").write_text(json.dumps(model, ensure_ascii=False, separators=(",", ":"))+"\n")
    evidence_folder = ROOT / "sources/floorplans/evidence"
    evidence_folder.mkdir(exist_ok=True)
    evidence = {
        "source": config["url"], "sha256": digest, "projection": config["sourceProjection"],
        "transform": "translation only, equal x/y units; floor stacking is display-only",
        "review": config["review"], "claims": claims,
        "coverage": {"floors": len(floors), "labels": len(places), "features": sum(len(f["features"]) for f in floors)},
    }
    if config.get("sourceFiles"):
        evidence["sources"] = [{"id": source_id, "url": record["url"], "sha256":record["sha256"],
                                "file":record["file"], "projection":record["sourceProjection"]}
                               for source_id, record in source_records.items()]
    profile_groups = {f"{floor['id']}-{group['id']}": {key: group[key] for key in ("ids", "endpointGrid", "expectedAreas", "profileIndices", "clipBounds") if key in group}
                      for floor in config["floors"] for group in floor.get("wallProfiles", []) if "profileSourcePaths" in group}
    if profile_groups:
        evidence["wallProfileGroups"] = profile_groups
    evidence_json = json.dumps(evidence, ensure_ascii=False, indent=2)
    if len(evidence_json.encode("utf-8")) > 40_000_000:
        evidence_json = json.dumps(evidence, ensure_ascii=False, separators=(",", ":"))
    (evidence_folder / f"{config['slug']}.json").write_text(evidence_json+"\n")
    for document in documents.values():
        document.close()
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
