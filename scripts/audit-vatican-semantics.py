#!/usr/bin/env python3
"""Audit the source-derived Vatican semantic model and its serialized contract."""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "sources/floorplans/venues/vatican-museums.json"
MODEL_PATH = ROOT / "app/data/architectural-plans/vatican-museums.json"
SEMANTIC_AUDIT_PATH = ROOT / "work/vatican-semantic-qa/semantic-audit.json"
DOOR_CLOSURE_AUDIT_PATH = ROOT / "work/vatican-semantic-qa/space-door-closure-checkpoints.json"
OUTPUT_PATH = ROOT / "work/vatican-semantic-qa/model-audit.json"
SERVICE_INVENTORY_PATH = ROOT / "sources/floorplans/vatican-museums-service-inventory.json"

EXPECTED_SPACES = {
    "first-gregorian-egyptian",
    "first-chiaramonti",
    "first-braccio-nuovo",
    "first-pio-clementino",
    "first-borgia-west",
    "first-borgia-central",
    "first-borgia-east",
    "first-pinecone-courtyard",
    "first-sistine-chapel",
    "first-aldobrandini-wedding",
    "first-christian-museum",
    "first-vatican-library-museums",
    "first-profane-museum",
    "first-gregorian-profane",
    "first-pinacoteca-north",
    "first-pinacoteca-central",
    "first-pinacoteca-south",
    "second-etruscan-west",
    "second-immaculate-conception",
    "second-raphael-rooms",
    "basement-ethnological-philatelic-shared",
    "basement-carriage-pavilion",
}
EXPECTED_LINKS = {
    "west-stair-first-second": (
        "first-二层西楼梯-1",
        "second-一层西楼梯-1",
    ),
    "east-stair-first-second": (
        "first-二层东楼梯-1",
        "second-一层东楼梯-1",
    ),
}
EXPECTED_LINK_ENDPOINTS = {
    "first-二层西楼梯-1": [143.05, 39.796],
    "second-一层西楼梯-1": [59.979, 123.798],
    "first-二层东楼梯-1": [656.54, 121.205],
    "second-一层东楼梯-1": [494.808, 122.607],
}
EXPECTED_FLAT_STAIRS = {
    "west-small-stair",
    "pinecone-east-stair",
    "far-east-standalone-stair",
    "south-spiral-stair",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def feature_shape(feature: dict):
    return unary_union(
        [Polygon(item["outer"], item.get("holes", [])) for item in feature["polygons"]]
    )


def main() -> None:
    config = json.loads(CONFIG_PATH.read_text())
    model = json.loads(MODEL_PATH.read_text())
    semantic = json.loads(SEMANTIC_AUDIT_PATH.read_text())
    door_closures = json.loads(DOOR_CLOSURE_AUDIT_PATH.read_text())
    service_inventory = json.loads(SERVICE_INVENTORY_PATH.read_text())

    assert model["slug"] == "vatican-museums"
    assert model["projection"] == "orthographic"
    assert model["registration"] == "independent-floor-diagrams"
    assert not model.get("unresolvedStops")
    assert all(set(binding) == {"stopIndex", "placeId"} for binding in model["stopBindings"])
    assert all(
        place["kind"] in {"room", "service", "area", "object"}
        for place in model["places"]
    )
    assert len(model["places"]) == 96
    assert service_inventory["counts"] == {"first": 46, "second": 7, "basement": 6}
    assert {binding["stopIndex"] for binding in model["stopBindings"]} == set(range(12))

    configured_sources = {item["id"]: item for item in config["sourceFiles"]}
    assert configured_sources["registered-plans"]["sourceProjection"]["pages"] == []
    assert configured_sources["semantic-plans"]["sourceProjection"]["pages"] == [1, 2, 3]
    source_digests = {}
    for source_id, source in configured_sources.items():
        actual = digest(ROOT / "sources/floorplans" / source["file"])
        assert actual == source["sha256"]
        assert model["sourceDigests"][source_id] == actual
        source_digests[source_id] = actual

    config_floors = {floor["id"]: floor for floor in config["floors"]}
    model_floors = {floor["id"]: floor for floor in model["floors"]}
    assert {floor_id: floor["crop"] for floor_id, floor in config_floors.items()} == {
        "first": [20, 90, 825, 555],
        "second": [25, 40, 570, 285],
        "basement": [15, 330, 342, 570],
    }
    assert {
        floor_id: (floor["sourceId"], floor["page"])
        for floor_id, floor in config_floors.items()
    } == {
        "first": ("semantic-plans", 1),
        "second": ("semantic-plans", 2),
        "basement": ("semantic-plans", 3),
    }
    for floor_id, floor in config_floors.items():
        black_layers = [
            layer
            for layer in floor["rasterLayers"]
            if layer["rgbRange"] == [[0, 0, 0], [0, 0, 0]]
        ]
        assert len(black_layers) == 1
        assert black_layers[0].get("allInkIsDetail") is False
        assert any(feature["kind"] == "wall" for feature in model_floors[floor_id]["features"])
        gray_layers = [
            layer
            for layer in floor["rasterLayers"]
            if layer["rgbRange"] == [[128, 128, 128], [128, 128, 128]]
        ]
        if floor_id == "second":
            assert gray_layers == []
            assert all(feature["kind"] != "detail" for feature in model_floors[floor_id]["features"])
        else:
            assert len(gray_layers) == 1
            assert gray_layers[0].get("allInkIsDetail") is True

    assert {space["id"] for space in model["spaces"]} == EXPECTED_SPACES
    assert not any(
        token in space["id"]
        for space in model["spaces"]
        for token in ("room-6", "room-7", "room-8", "gallery-6", "gallery-7", "gallery-8")
    )
    places = {place["id"]: place for place in model["places"]}
    semantic_space_audit = {
        f"{floor_id}-{item['id']}": item
        for floor_id, floor_audit in semantic.items()
        for item in floor_audit["spaces"]
    }
    for space in model["spaces"]:
        place = places[space["placeId"]]
        assert place["floorId"] == space["floorId"]
        shape = unary_union(
            [Polygon(item["outer"], item.get("holes", [])) for item in space["polygons"]]
        )
        assert shape.is_valid and shape.area > 0
        floor_crop = config_floors[space["floorId"]]["crop"]
        source_seed = semantic_space_audit[space["id"]]["seed"]
        local_seed = Point(source_seed[0] - floor_crop[0], source_seed[1] - floor_crop[1])
        assert shape.buffer(0.001).covers(local_seed)

    service_checks = []
    service_occurrences = Counter()
    for source_service in service_inventory["services"]:
        floor_id = source_service["floorId"]
        label = source_service["label"]
        service_occurrences[(floor_id, label)] += 1
        place_id = f"{floor_id}-{label}-{service_occurrences[(floor_id, label)]}"
        place = places[place_id]
        crop = config_floors[floor_id]["crop"]
        assert crop[0] <= source_service["center"][0] <= crop[2]
        assert crop[1] <= source_service["center"][1] <= crop[3]
        expected_local = [
            round(source_service["center"][0] - crop[0], 4),
            round(source_service["center"][1] - crop[1], 4),
        ]
        assert place["kind"] == "service"
        assert place["at"] == expected_local
        configured = config_floors[floor_id]["servicePlaces"]
        matching = [item for item in configured if item["label"] == label]
        source_index = service_occurrences[(floor_id, label)] - 1
        assert matching[source_index]["at"] == source_service["center"]
        assert f"drawing {source_service['drawingIndex']}" in matching[source_index]["evidence"]
        service_checks.append({
            "placeId": place_id,
            "drawingIndex": source_service["drawingIndex"],
            "sourceCenter": source_service["center"],
            "serializedLocalAt": place["at"],
        })
    assert len(service_checks) == 59

    repeated = Counter((place["floorId"], place["label"]) for place in model["places"])
    assert repeated[("first", "11")] == 3
    assert repeated[("first", "19")] == 3
    assert repeated[("second", "5")] == 2

    links = {link["id"]: link for link in model["verticalLinks"]}
    assert set(links) == set(EXPECTED_LINKS)
    for link_id, (from_id, to_id) in EXPECTED_LINKS.items():
        assert links[link_id]["kind"] == "stairs"
        assert links[link_id]["fromPlaceId"] == from_id
        assert links[link_id]["toPlaceId"] == to_id
    for place_id, expected_at in EXPECTED_LINK_ENDPOINTS.items():
        assert places[place_id]["kind"] == "service"
        assert places[place_id]["at"] == expected_at

    second_floor = model_floors["second"]
    second_crop = config_floors["second"]["crop"]
    second_features = [feature_shape(feature) for feature in second_floor["features"]]
    context_intersections = []
    pixel_size = max(
        (semantic["second"]["sourcePlacementRect"][2] - semantic["second"]["sourcePlacementRect"][0])
        / semantic["second"]["sourceImageSize"][0],
        (semantic["second"]["sourcePlacementRect"][3] - semantic["second"]["sourcePlacementRect"][1])
        / semantic["second"]["sourceImageSize"][1],
    )
    for rect in semantic["second"]["omitContextRects"]:
        local = box(
            rect[0] - second_crop[0],
            rect[1] - second_crop[1],
            rect[2] - second_crop[0],
            rect[3] - second_crop[1],
        )
        raw_area = sum(shape.intersection(local).area for shape in second_features)
        # Traced source pixels extend half a source pixel around their centers. The
        # source audit is center-based, so inset by half a pixel when checking the
        # omitted interior; raw overlap may contain only the retained boundary row.
        interior = local.buffer(-pixel_size / 2)
        interior_area = sum(shape.intersection(interior).area for shape in second_features)
        assert interior_area == 0
        context_intersections.append({
            "rawBoundaryOverlapArea": round(raw_area, 6),
            "interiorOverlapArea": round(interior_area, 6),
        })

    semantic_counts = {}
    for floor_id, audit in semantic.items():
        assert audit["syntheticGeometryPixels"] == 0
        assert audit["wallMaxChannel"] == 220
        assert audit["sourceNeutralPixels"] >= audit["sourceStructuralPixels"]
        assert audit["omittedNeutralShadowPixels"] == (
            audit["sourceNeutralPixels"] - audit["sourceStructuralPixels"]
        )
        assert audit["omittedNeutralShadowPixels"] > 0
        assert audit["wallPixels"] > 0
        assert audit["sourceWallPixelsBeforeNoiseFilter"] >= audit["wallPixels"]
        assert audit["retainedWallComponentMinimumPixels"] == 9
        assert audit["omittedWallNoisePixels"] == (
            audit["sourceWallPixelsBeforeNoiseFilter"] - audit["wallPixels"]
        )
        if floor_id == "second":
            assert audit["retainGardenContext"] is False
            assert audit["flatDetailPixels"] == 0
            assert audit["flatStairDetailPixels"] == 0
            assert audit["retainedPixelsInsideOmitContextRects"] == 0
        else:
            assert audit["retainGardenContext"] is True
            assert audit["flatDetailPixels"] > 0
        if floor_id == "first":
            assert {item["id"] for item in audit["reviewedStairs"]} == EXPECTED_FLAT_STAIRS
            assert audit["flatStairDetailPixels"] > 0
            for stair in audit["reviewedStairs"]:
                assert stair["sourceStructuralPixelsReclassifiedFlat"] > 0
                assert stair["syntheticDetailPixels"] == 0
                assert stair["wallCheckpoints"]
                assert all(item["retainedWallPixels"] > 0 for item in stair["wallCheckpoints"])
        else:
            assert audit["reviewedStairs"] == []
            assert audit["flatStairDetailPixels"] == 0
        semantic_counts[floor_id] = {
            "wallPixels": audit["wallPixels"],
            "flatDetailPixels": audit["flatDetailPixels"],
            "flatStairDetailPixels": audit["flatStairDetailPixels"],
            "sourceNeutralPixels": audit["sourceNeutralPixels"],
            "sourceStructuralPixels": audit["sourceStructuralPixels"],
            "omittedNeutralShadowPixels": audit["omittedNeutralShadowPixels"],
            "omittedWallNoisePixels": audit["omittedWallNoisePixels"],
        }

    closure_records = [item for records in door_closures.values() for item in records]
    assert len(closure_records) == 22
    assert {f"{floor_id}-{item['id']}" for floor_id, records in door_closures.items() for item in records} == EXPECTED_SPACES
    for item in closure_records:
        assert item["sourceWallPixelsInsideFloodComponent"] == 0
        assert item["dilationPixelsInsideFloodComponent"] == 0
        assert item["reviewedBoundaryClosurePixels"] > 0
        assert item["emittedWallPixelsAddedByClosure"] == 0

    result = {
        "status": "pass",
        "sourceDigests": source_digests,
        "floors": len(model["floors"]),
        "places": len(model["places"]),
        "collectionAndOrientationMarkers": 30,
        "servicePlaces": len(service_checks),
        "servicePlacesByFloor": service_inventory["counts"],
        "features": sum(len(floor["features"]) for floor in model["floors"]),
        "spaces": len(model["spaces"]),
        "verticalLinks": len(model["verticalLinks"]),
        "stopBindings": len(model["stopBindings"]),
        "unresolvedStops": len(model.get("unresolvedStops", [])),
        "repeatedMarkers": {"first-11": 3, "first-19": 3, "second-5": 2},
        "secondOmittedContextIntersectionAreas": context_intersections,
        "semanticCounts": semantic_counts,
        "reviewedFlatStairs": sorted(EXPECTED_FLAT_STAIRS),
        "spaceDilationChecks": {
            "spaces": len(closure_records),
            "sourceWallPixelsInsideFloodComponents": 0,
            "dilationPixelsInsideFloodComponents": 0,
            "emittedWallPixelsAddedByClosure": 0,
        },
        "sourceSpaceExceptions": config["completenessAudit"]["sourceSpaceExceptions"],
    }
    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
