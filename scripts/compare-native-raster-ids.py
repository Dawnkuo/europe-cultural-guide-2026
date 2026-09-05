#!/usr/bin/env python3
"""Capture and compare the nine repaired Pisa raster planes across builders."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "app/data/architectural-plans"
REPORTS = ROOT / "reports"
QA = ROOT / "qa"

PLANES = [
    ("leaning-tower", "base", "leaning-tower-base"),
    ("leaning-tower", "entry-first", "leaning-tower-entry-first"),
    ("leaning-tower", "galleries-1-3", "leaning-tower-galleries-1-3"),
    ("leaning-tower", "galleries-4-7", "leaning-tower-galleries-4-7"),
    ("leaning-tower", "upper", "leaning-tower-upper"),
    ("pisa-cathedral", "ground", "pisa-cathedral-ground"),
    ("pisa-baptistery", "ground", "pisa-baptistery-ground"),
    ("camposanto", "ground", "camposanto-ground"),
    ("opera-pisa", "ground", "opera-pisa-ground"),
]


def canonical_hash(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot() -> dict:
    result = {}
    for slug, floor_id, contact_name in PLANES:
        model_path = MODELS / f"{slug}.json"
        model = json.loads(model_path.read_text())
        floor = next(item for item in model["floors"] if item["id"] == floor_id)
        features = floor["features"]
        result[f"{slug}:{floor_id}"] = {
            "featureCount": len(features),
            "featureIds": [feature["id"] for feature in features],
            "featureGeometryHashes": {
                feature["id"]: canonical_hash(feature) for feature in features
            },
            "places": [place for place in model["places"] if place["floorId"] == floor_id],
            "stopBindings": model.get("stopBindings", []),
            "verticalLinks": model.get("verticalLinks", []),
            "contactSha256": file_hash(QA / "contacts" / f"{contact_name}.png"),
        }
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--capture-before", action="store_true")
    args = parser.parse_args()
    before_path = REPORTS / "pre-native-builder-nine-plane-snapshot.json"
    if args.capture_before:
        before_path.write_text(json.dumps(snapshot(), ensure_ascii=False, indent=2) + "\n")
        print(before_path)
        return

    before = json.loads(before_path.read_text())
    after = snapshot()
    planes = {}
    for key in before:
        old = before[key]
        new = after[key]
        planes[key] = {
            "featureCountBefore": old["featureCount"],
            "featureCountAfter": new["featureCount"],
            "rasterFeatureIdsIdentical": old["featureIds"] == new["featureIds"],
            "featureGeometryIdenticalById": old["featureGeometryHashes"] == new["featureGeometryHashes"],
            "placesIdentical": old["places"] == new["places"],
            "stopBindingsIdentical": old["stopBindings"] == new["stopBindings"],
            "verticalLinksIdentical": old["verticalLinks"] == new["verticalLinks"],
            "contactSha256Before": old["contactSha256"],
            "contactSha256After": new["contactSha256"],
            "contactPixelsIdentical": old["contactSha256"] == new["contactSha256"],
        }
    passed = all(
        item[check]
        for item in planes.values()
        for check in [
            "rasterFeatureIdsIdentical",
            "featureGeometryIdenticalById",
            "placesIdentical",
            "stopBindingsIdentical",
            "verticalLinksIdentical",
            "contactPixelsIdentical",
        ]
    )
    report = {
        "status": "pass" if passed else "fail",
        "builderSha256": file_hash(ROOT / "scripts/build-architectural-plans.py"),
        "scope": "Nine repaired raster planes; the unchanged Baptistery upper v2 is outside this before/after contact set.",
        "nativeIdConclusion": "The latest native PDF path-ID fix does not change raster feature IDs, geometry, places, route bindings, or rendered contacts for these nine planes.",
        "planes": planes,
    }
    output = REPORTS / "native-builder-nine-plane-comparison.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    if not passed:
        raise AssertionError(f"Native-builder comparison failed; see {output}")
    print(output)


if __name__ == "__main__":
    main()
