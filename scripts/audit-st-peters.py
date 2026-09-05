#!/usr/bin/env python3
"""Audit the serialized St Peter source-derived model and support evidence."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from shapely.geometry import Point, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/st-peters-basilica.json"
MODEL = ROOT / "app/data/architectural-plans/st-peters-basilica.json"
REVIEW = ROOT / "work/st-peters-source-qa/review.json"
SPACE_CHECKS = ROOT / "work/st-peters-source-qa/space-selector-checkpoints.json"
OUTPUT = ROOT / "work/st-peters-source-qa/model-audit.json"
ALLOWED_KINDS = {"room", "service", "area", "object"}
EXPECTED_SPACES = {
    "basilica-narthex",
    "basilica-nave",
    "basilica-right-transept",
    "basilica-apse",
    "basilica-crossing",
    "grottoes-peter-chapel",
    "grottoes-confessio",
    "grottoes-central-passage",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    config = json.loads(CONFIG.read_text())
    model = json.loads(MODEL.read_text())
    review = json.loads(REVIEW.read_text())
    checks = json.loads(SPACE_CHECKS.read_text())

    assert model["slug"] == "st-peters-basilica"
    assert model["projection"] == "orthographic"
    assert model["registration"] == "independent-floor-diagrams"
    assert [floor["id"] for floor in model["floors"]] == ["basilica", "grottoes"]
    assert len(model["places"]) == 156
    assert {place["kind"] for place in model["places"]} <= ALLOWED_KINDS
    assert len(model["spaces"]) == 28
    assert [item["label"] for item in model["unlocatedPlaces"]] == ["82"]
    assert not any("at" in item for item in model["unlocatedPlaces"])
    assert len(model["verticalLinks"]) == 0
    assert len(model["stopBindings"]) == 11
    assert {item["stopIndex"] for item in model["stopBindings"]} == set(range(7))
    assert "unresolvedStops" not in model
    assert {item["stopIndex"] for item in config["unresolvedStops"]} == {7, 8, 9}
    assert not ({item["stopIndex"] for item in config["unresolvedStops"]} &
                {item["stopIndex"] for item in model["stopBindings"]})
    assert all(set(item) == {"stopIndex", "placeId"} for item in model["stopBindings"])

    assert config["sourceProjection"]["pages"] == []
    assert [source["id"] for source in config["sourceFiles"]] == ["reviewed-plans"]
    assert config["sourceFiles"][0]["sourceProjection"]["pages"] == [1, 2]
    assert "millon-1966-rectified" not in model["sourceDigests"]
    expected_digests = {
        "primary": digest(ROOT / "sources/floorplans" / config["file"]),
        "reviewed-plans": digest(ROOT / "sources/floorplans" / config["sourceFiles"][0]["file"]),
    }
    assert model["sourceDigests"] == expected_digests
    assert config["sha256"] == expected_digests["primary"]
    assert config["sourceFiles"][0]["sha256"] == expected_digests["reviewed-plans"]

    cor = review["churchesOfRome"]
    assert cor["basilica"]["sourcePage"] == 15
    assert cor["basilica"]["sourceXref"] == 99
    assert cor["basilica"]["nativeSize"] == [483, 479]
    assert cor["grottoes"]["sourcePage"] == 63
    assert cor["grottoes"]["sourceXref"] == 261
    assert cor["grottoes"]["nativeSize"] == [880, 784]
    assert cor["basilica"]["classification"]["wallBodyPixelsWithoutGraySeedWithin7x7"] == 0
    assert cor["basilica"]["classification"]["syntheticFootprints"] == 0
    assert cor["grottoes"]["classification"]["emittedPixelsOutsideSourceInk"] == 0
    assert cor["grottoes"]["classification"]["syntheticFootprints"] == 0
    assert all(item["passed"] for floor in cor.values() for item in floor["wallCheckpoints"])
    assert cor["basilica"]["numberInventory"]["uniqueLabels"] == 83
    assert cor["basilica"]["numberInventory"]["placeOccurrences"] == 86
    assert cor["basilica"]["numberInventory"]["duplicateLabels"] == [79]
    assert cor["basilica"]["numberInventory"]["missingLabels"] == []
    assert cor["grottoes"]["numberInventory"]["uniqueLabels"] == 68
    assert cor["grottoes"]["numberInventory"]["placeOccurrences"] == 70
    assert cor["grottoes"]["numberInventory"]["duplicateLabels"] == [3, 68]

    millon = review["millon1966"]
    assert millon["accession"] == "48_13_060"
    assert millon["coverage"].startswith("partial plan")
    assert millon["geometryUse"].startswith("corroboration only")
    assert millon["domeCircleAxisRatio"] <= 1.015
    assert millon["syntheticWallPixels"] == 0

    place_by_id = {place["id"]: place for place in model["places"]}
    assert len(place_by_id) == len(model["places"])
    selection_review = json.loads((ROOT / "sources/floorplans/rebuild-reports/st-peters-reviewed-room-selections.json").read_text())
    assert selection_review["visualReview"] and selection_review["sourceSha256"] == expected_digests["reviewed-plans"]
    selected_ids = {f"{floor}-source-room-{item['label']}" for floor, items in selection_review["floors"].items() for item in items}
    assert {space["id"] for space in model["spaces"]} == EXPECTED_SPACES | selected_ids
    for space in model["spaces"]:
        shape = unary_union(
            [Polygon(polygon["outer"], polygon.get("holes", [])) for polygon in space["polygons"]]
        )
        assert shape.is_valid and shape.area > 0
        assert shape.covers(Point(place_by_id[space["placeId"]]["at"]))

    flat_checks = [item for floor_checks in checks.values() for item in floor_checks]
    assert len(flat_checks) == 8
    assert {
        f"{floor_id}-{item['id']}"
        for floor_id, floor_checks in checks.items()
        for item in floor_checks
    } == EXPECTED_SPACES
    for item in flat_checks:
        assert item["sourceWallPixelsMissingFromBarrier"] == 0
        assert item["sourceWallPixelsInsideComponent"] == 0
        assert item["closurePixelsInsideComponent"] == 0
        assert item["reviewedBoundaryClosurePixels"] > 0
        assert item["emittedWallPixelsAddedBySelector"] == 0

    result = {
        "status": "pass",
        "floors": 2,
        "places": 156,
        "features": sum(len(floor["features"]) for floor in model["floors"]),
        "spaces": 28,
        "verticalLinks": 0,
        "stopBindings": 11,
        "resolvedGuideStopIndices": 7,
        "unresolvedGuideStopIndices": [7, 8, 9],
        "sourceDigests": expected_digests,
        "sourceWallPixels": {
            "basilica": cor["basilica"]["classification"]["wallBodyPixels"],
            "grottoes": cor["grottoes"]["classification"]["wallPixels"],
        },
        "flatDetailPixels": {
            "basilica": cor["basilica"]["classification"]["reviewedFlatDetailPixels"],
            "grottoes": cor["grottoes"]["classification"]["flatDetailPixels"],
        },
        "syntheticFootprints": 0,
        "numberInventory": {
            "basilicaUnique": 83,
            "basilicaOccurrences": 86,
            "basilicaUnlocated": [82],
            "basilicaDuplicates": [79],
            "grottoesUnique": 68,
            "grottoesOccurrences": 70,
            "grottoesDuplicates": [3, 68],
        },
        "spaceSelectorChecks": {
            "mainSpaces": 8,
            "additionalRoomSelectors": 20,
            "sourceWallPixelsMissingFromBarriers": 0,
            "sourceWallPixelsInsideComponents": 0,
            "closurePixelsInsideComponents": 0,
            "emittedWallPixelsAddedBySelectors": 0,
        },
        "millon1966": {
            "modelFloor": False,
            "coverage": millon["coverage"],
            "domeCircleAxisRatio": millon["domeCircleAxisRatio"],
        },
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
