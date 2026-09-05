#!/usr/bin/env python3
"""Validate canonical St Mark output against independent source checkpoints."""

import json
from pathlib import Path

from shapely.geometry import Point, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/st-mark-basilica.json"
MODEL = ROOT / "app/data/architectural-plans/st-mark-basilica.json"
CHECKPOINTS = ROOT / "sources/floorplans/rebuild-reports/st-mark-basilica-source-checkpoints.json"


def feature_shape(feature):
    return unary_union(
        [Polygon(item["outer"], item.get("holes", [])) for item in feature["polygons"]]
    )


def main():
    config = json.loads(CONFIG.read_text())
    model = json.loads(MODEL.read_text())
    checkpoints = json.loads(CHECKPOINTS.read_text())
    floor_spec = config["floors"][0]
    floor = model["floors"][0]
    if floor.get("sourceId") != "semantic-derived":
        raise AssertionError("Canonical floor does not select the derived source")
    walls = unary_union(
        [feature_shape(feature) for feature in floor["features"] if feature["kind"] == "wall"]
    )

    def local_point(source_point):
        return Point(
            source_point[0] - floor_spec["crop"][0],
            source_point[1] - floor_spec["crop"][1],
        )

    missing_walls = [
        item["id"] for item in checkpoints["requiredWall"]
        if not walls.covers(local_point(item["sourcePoint"]))
    ]
    bridged_gaps = [
        item["id"] for item in checkpoints["requiredEmpty"]
        if walls.covers(local_point(item["sourcePoint"]))
    ]
    if missing_walls or bridged_gaps:
        raise AssertionError({"missingWalls": missing_walls, "bridgedGaps": bridged_gaps})

    source_places = {item["label"]: item for item in floor_spec["places"]}
    model_places = {item["label"]: item for item in model["places"]}
    if set(source_places) != set(model_places) or len(model_places) != 47:
        raise AssertionError("The 47-key inventory changed")
    moved = []
    for label, source_place in source_places.items():
        expected = [
            round(source_place["at"][0] - floor_spec["crop"][0], 4),
            round(source_place["at"][1] - floor_spec["crop"][1], 4),
        ]
        if model_places[label]["at"] != expected:
            moved.append((label, expected, model_places[label]["at"]))
    if moved:
        raise AssertionError({"movedAnchors": moved})

    polygon_count = 0
    for feature in floor["features"]:
        for item in feature["polygons"]:
            shape = Polygon(item["outer"], item.get("holes", []))
            if not shape.is_valid or shape.is_empty or shape.area <= 0:
                raise AssertionError(("invalid serialized polygon", feature["id"]))
            polygon_count += 1
    result = {
        "status": "pass",
        "sourceId": floor["sourceId"],
        "wallCheckpoints": len(checkpoints["requiredWall"]),
        "emptyCheckpoints": len(checkpoints["requiredEmpty"]),
        "printedKeyMasks": len(checkpoints["printedKeyMasks"]),
        "places": len(model_places),
        "features": len(floor["features"]),
        "polygons": polygon_count,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
