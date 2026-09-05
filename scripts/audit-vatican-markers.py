#!/usr/bin/env python3
"""Verify exact Vatican marker centers through config and serialized model."""
from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXTRACTED = ROOT / "work/vatican-marker-qa/extracted-markers.json"
CONFIG = ROOT / "sources/floorplans/venues/vatican-museums.json"
MODEL = ROOT / "app/data/architectural-plans/vatican-museums.json"
OUTPUT = ROOT / "work/vatican-marker-qa/marker-audit.json"


def main() -> None:
    extracted = json.loads(EXTRACTED.read_text())
    config = json.loads(CONFIG.read_text())
    model = json.loads(MODEL.read_text())
    floors = {floor["id"]: floor for floor in config["floors"]}
    model_places = {place["id"]: place for place in model["places"]}

    config_occurrences = defaultdict(int)
    checks = []
    for marker in extracted["markers"]:
        floor = floors[marker["floorId"]]
        matching = [place for place in floor["places"] if place["label"] == marker["label"]]
        index = marker["occurrence"] - 1
        assert index < len(matching)
        place = matching[index]
        assert place["at"] == marker["center"]
        assert f"drawing {marker['circleDrawingIndex']}" in place["evidence"]
        leader_index = marker.get("leaderDrawingIndex")
        if leader_index is not None:
            assert f"drawing {marker['leaderDrawingIndex']}" in place["evidence"]

        config_occurrences[(marker["floorId"], marker["label"])] += 1
        place_id = f"{marker['floorId']}-{marker['label']}-{marker['occurrence']}"
        model_place = model_places[place_id]
        expected_local = [
            marker["center"][0] - floor["crop"][0],
            marker["center"][1] - floor["crop"][1],
        ]
        delta = math.dist(model_place["at"], expected_local)
        assert delta < 0.0006
        checks.append({
            "placeId": place_id,
            "circleDrawingIndex": marker["circleDrawingIndex"],
            "leaderDrawingIndex": leader_index,
            "sourceCenter": marker["center"],
            "serializedLocalAt": model_place["at"],
            "serializationDelta": round(delta, 7),
        })

    assert config_occurrences[("first", "11")] == 3
    assert config_occurrences[("first", "19")] == 3
    assert config_occurrences[("second", "5")] == 2
    assert all(set(binding) == {"stopIndex", "placeId"} for binding in model["stopBindings"])
    assert not model.get("unresolvedStops")
    assert all(
        place["kind"] in {"room", "service", "area", "object"}
        for place in model["places"]
    )
    audit = {
        "status": "pass",
        "sourceMarkerCount": len(checks),
        "leaderEndpointMarkerCount": sum(
            check["leaderDrawingIndex"] is not None for check in checks
        ),
        "orientationCircleMarkerCount": sum(
            check["leaderDrawingIndex"] is None for check in checks
        ),
        "maximumSerializationDelta": max(check["serializationDelta"] for check in checks),
        "repeatedMarkers": {
            "first-11": 3,
            "first-19": 3,
            "second-5": 2
        },
        "checks": checks,
    }
    OUTPUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
