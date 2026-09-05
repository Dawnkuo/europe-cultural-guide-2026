#!/usr/bin/env python3
"""Build and validate installed Tuscany architectural plans."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import re
from pathlib import Path

from PIL import Image
from architectural_preview import paint_polygon
from shapely.geometry import Point, Polygon
from shapely.ops import unary_union


SCRATCH = Path(__file__).resolve().parents[1]
REPO = SCRATCH
GENERATOR = REPO / "scripts/build-architectural-plans.py"
SLUGS = ("florence-duomo", "giunti-odeon", "mercato-centrale")
EXPECTED_FLOORS = {
    "florence-duomo": 1,
    "giunti-odeon": 3,
    "mercato-centrale": 1,
}
GUIDE_STOP_COUNTS = {
    "florence-duomo": 5,
    "giunti-odeon": 4,
    "mercato-centrale": 4,
}
HAN = re.compile(r"[\u4e00-\u9fff]")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_generator():
    spec = importlib.util.spec_from_file_location("architectural_plan_generator", GENERATOR)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load generator: {GENERATOR}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = SCRATCH
    return module


def enrich_place_metadata(config: dict, model: dict) -> None:
    """Carry reviewed manual-anchor evidence into the installable model.

    The shared generator currently writes these values to evidence claims but
    does not yet copy them onto place records, although the runtime accepts the
    fields. Keep this scratch output self-contained without editing shared code.
    """
    metadata = {}
    for floor in config["floors"]:
        counts = {}
        for anchor in [*floor.get("places", []), *floor.get("servicePlaces", [])]:
            label = anchor["label"]
            counts[label] = counts.get(label, 0) + 1
            place_id = f"{floor['id']}-{label.replace(' ', '-')}-{counts[label]}"
            metadata[place_id] = {
                "evidence": anchor.get(
                    "evidence",
                    "Visually reviewed geometry anchor; not necessarily printed text",
                ),
                "precision": anchor.get("precision", "reviewed-map-position-not-surveyed"),
            }
    for place in model["places"]:
        place.update(metadata[place["id"]])


def render_floor(slug: str, floor: dict) -> Path:
    x0, y0, x1, y1 = floor["bounds"]
    width = max(x1 - x0, 1)
    height = max(y1 - y0, 1)
    scale = min(1500 / width, 1100 / height)
    pad = 30
    canvas = Image.new(
        "RGB",
        (math.ceil(width * scale) + 2 * pad, math.ceil(height * scale) + 2 * pad),
        "#f7f5ef",
    )
    colors = {"surface": "#d8d1c0", "detail": "#8e8a82", "wall": "#3b3935"}

    def points(ring):
        return [((x - x0) * scale + pad, (y - y0) * scale + pad) for x, y in ring]

    for feature in floor["features"]:
        fill = colors[feature["kind"]]
        for polygon in feature["polygons"]:
            paint_polygon(canvas, points(polygon["outer"]),
                          [points(hole) for hole in polygon.get("holes", [])], fill)
    destination = SCRATCH / "work/renders" / f"generated-{slug}-{floor['id']}.png"
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination)
    return destination


def validate_model(slug: str, config: dict, model: dict, evidence: dict) -> dict:
    errors = []
    if model.get("version") != 2 or model.get("projection") != "orthographic":
        errors.append("model contract/version mismatch")
    if len(model.get("floors", [])) != EXPECTED_FLOORS[slug]:
        errors.append("floor count mismatch")
    if model.get("sourceDigest") != config["sha256"]:
        errors.append("primary source digest mismatch")
    expected_digests = {"primary": config["sha256"]}
    expected_digests.update({item["id"]: item["sha256"] for item in config.get("sourceFiles", [])})
    if config.get("sourceFiles") and model.get("sourceDigests") != expected_digests:
        errors.append("supplementary source digest mismatch")

    floor_ids = {floor["id"] for floor in model.get("floors", [])}
    for floor in model.get("floors", []):
        if not HAN.search(floor.get("label", "")):
            errors.append(f"public floor label is not Chinese: {floor['id']}")
    for limitation in model.get("limitations", []):
        if not HAN.search(limitation):
            errors.append("public limitation is not Chinese")
    place_ids = [place["id"] for place in model.get("places", [])]
    if len(place_ids) != len(set(place_ids)):
        errors.append("duplicate place id")
    for place in model.get("places", []):
        if place["floorId"] not in floor_ids:
            errors.append(f"place references missing floor: {place['id']}")
        if not HAN.search(place.get("label", "")) or not HAN.search(place.get("name", "")):
            errors.append(f"public place label/name is not Chinese: {place['id']}")
        if not place.get("evidence") or not place.get("precision"):
            errors.append(f"place lacks evidence/precision: {place['id']}")

    spaces = model.get("spaces", [])
    if not spaces:
        errors.append("model has no semantic spaces")
    space_floor_ids = {space["floorId"] for space in spaces}
    for floor_id in floor_ids - space_floor_ids:
        errors.append(f"floor has no semantic space: {floor_id}")
    for space in spaces:
        if space["floorId"] not in floor_ids or space["placeId"] not in place_ids:
            errors.append(f"space references missing floor/place: {space['id']}")
        if not HAN.search(space.get("label", "")):
            errors.append(f"public space label is not Chinese: {space['id']}")
        polygons = []
        for ring in space.get("polygons", []):
            polygon = Polygon(ring["outer"], ring.get("holes", []))
            polygons.append(polygon)
            if polygon.area <= 0 or not polygon.is_valid:
                errors.append(f"invalid semantic space polygon: {space['id']}")
        place = next((item for item in model["places"] if item["id"] == space["placeId"]), None)
        if place and polygons and not unary_union(polygons).covers(Point(place["at"])):
            errors.append(f"semantic-space place lies outside its floor polygon: {space['id']}")

    feature_count = 0
    ring_count = 0
    feature_ids = []
    floor_bounds = {floor["id"]: floor["bounds"] for floor in model.get("floors", [])}
    for place in model.get("places", []):
        x0, y0, x1, y1 = floor_bounds[place["floorId"]]
        x, y = place["at"]
        if not x0 <= x <= x1 or not y0 <= y <= y1:
            errors.append(f"place outside extracted floor bounds: {place['id']}")
    for floor in model.get("floors", []):
        if not floor.get("features"):
            errors.append(f"floor has no geometry: {floor['id']}")
        for feature in floor.get("features", []):
            feature_count += 1
            feature_ids.append(feature["id"])
            for ring in feature.get("polygons", []):
                ring_count += 1
                outer = ring.get("outer", [])
                if len(outer) < 4 or outer[0] != outer[-1]:
                    errors.append(f"open/short ring: {feature['id']}")
                    continue
                if not all(math.isfinite(value) for point in outer for value in point):
                    errors.append(f"non-finite ring: {feature['id']}")
                    continue
                polygon = Polygon(outer, ring.get("holes", []))
                if polygon.area <= 0 or not polygon.is_valid:
                    errors.append(f"invalid polygon: {feature['id']}")
    if len(feature_ids) != len(set(feature_ids)):
        errors.append("duplicate feature id")

    valid_hashes = set(expected_digests.values())
    for claim in evidence.get("claims", []):
        if claim.get("sourceHash") not in valid_hashes:
            errors.append(f"claim references unpinned source: {claim.get('featureId')}")

    bound_indices = [binding["stopIndex"] for binding in model.get("stopBindings", [])]
    for binding in model.get("stopBindings", []):
        if binding["placeId"] not in place_ids:
            errors.append(f"binding references missing place: {binding['placeId']}")
        if not 0 <= binding["stopIndex"] < GUIDE_STOP_COUNTS[slug]:
            errors.append(f"binding index outside guide inventory: {binding['stopIndex']}")

    for link in model.get("verticalLinks", []):
        if link["fromPlaceId"] not in place_ids or link["toPlaceId"] not in place_ids:
            errors.append(f"vertical link references missing place: {link['id']}")

    expected_coverage = {
        "floors": len(model["floors"]),
        "labels": len(model["places"]),
        "features": feature_count,
    }
    if evidence.get("coverage") != expected_coverage:
        errors.append("evidence coverage does not match model")

    renders = [str(render_floor(slug, floor)) for floor in model["floors"]]
    return {
        "slug": slug,
        "status": "pass" if not errors else "fail",
        "floors": len(model["floors"]),
        "places": len(model["places"]),
        "spaces": len(spaces),
        "features": feature_count,
        "rings": ring_count,
        "guideStops": GUIDE_STOP_COUNTS[slug],
        "bindingChoices": len(bound_indices),
        "boundStops": sorted(set(bound_indices)),
        "unresolvedStops": sorted(set(range(GUIDE_STOP_COUNTS[slug])) - set(bound_indices)),
        "renders": renders,
        "errors": errors,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="*", choices=SLUGS)
    args = parser.parse_args()
    slugs = tuple(args.slugs) or SLUGS
    generator = load_generator()
    results = []
    for slug in slugs:
        config_path = SCRATCH / "sources/floorplans/venues" / f"{slug}.json"
        config = json.loads(config_path.read_text())
        records = [config, *config.get("sourceFiles", [])]
        for record in records:
            source = SCRATCH / "sources/floorplans" / record["file"]
            if digest(source) != record["sha256"]:
                raise RuntimeError(f"Pinned source digest mismatch: {source}")
        generator.build(config)
        model_path = SCRATCH / "app/data/architectural-plans" / f"{slug}.json"
        model = json.loads(model_path.read_text())
        enrich_place_metadata(config, model)
        model_path.write_text(json.dumps(model, ensure_ascii=False, separators=(",", ":")) + "\n")
        evidence = json.loads((SCRATCH / "sources/floorplans/evidence" / f"{slug}.json").read_text())
        results.append(validate_model(slug, config, model, evidence))

    output = SCRATCH / "work/validation.json"
    output.write_text(json.dumps({"generator": str(GENERATOR), "results": results}, indent=2) + "\n")
    for result in results:
        print(
            result["slug"], result["status"],
            f"floors={result['floors']}", f"features={result['features']}",
            f"bound={result['boundStops']}", f"unresolved={result['unresolvedStops']}",
        )
        for error in result["errors"]:
            print("  ERROR", error)
    if any(result["errors"] for result in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
