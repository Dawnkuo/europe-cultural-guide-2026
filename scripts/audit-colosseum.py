#!/usr/bin/env python3
"""Audit the canonical Colosseum model and its reviewed DAI source package."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/colosseum.json"
MODEL = ROOT / "app/data/architectural-plans/colosseum.json"
EVIDENCE = ROOT / "sources/floorplans/evidence/colosseum.json"
CLASSIFICATION = ROOT / "work/colosseum-dai-levels-qa/classification-audit.json"
CHECKPOINTS = ROOT / "work/colosseum-dai-levels-qa/critical-wall-checkpoints.json"
OUTPUT = ROOT / "work/colosseum-dai-levels-qa/model-audit.json"
EXPECTED_FLOORS = ["hypogeum-level-2", "podium-level-3"]
EXPECTED_FEATURE_COUNTS = {
    "hypogeum-level-2": 4205,
    "podium-level-3": 7353,
}
ALLOWED_PLACE_KINDS = {"room", "service", "area", "object"}


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def feature_signature(floor: dict) -> str:
    value = json.dumps(floor["features"], ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(value.encode()).hexdigest()


def exported_validation(module: Path) -> list[str]:
    script = (
        f"const m=await import({json.dumps(module.resolve().as_uri())});"
        "const fs=await import('node:fs');"
        "const p=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));"
        "console.log(JSON.stringify(m.validateArchitecturalPlan(p)));"
    )
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", script, str(MODEL)],
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(completed.stdout)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--validator-module",
        type=Path,
        required=True,
        help="ESM module exporting validateArchitecturalPlan from the current main checkout",
    )
    args = parser.parse_args()

    config = load(CONFIG)
    model = load(MODEL)
    evidence = load(EVIDENCE)
    classification = load(CLASSIFICATION)
    checkpoints = load(CHECKPOINTS)
    errors = exported_validation(args.validator_module)
    if errors:
        raise ValueError(f"Exported validator rejected Colosseum: {errors}")

    floor_ids = [floor["id"] for floor in model["floors"]]
    if floor_ids != EXPECTED_FLOORS:
        raise ValueError(f"Floor inventory changed: {floor_ids}")
    feature_counts = {floor["id"]: len(floor["features"]) for floor in model["floors"]}
    if feature_counts != EXPECTED_FEATURE_COUNTS:
        raise ValueError(f"Feature inventory changed: {feature_counts}")
    signatures = {floor["id"]: feature_signature(floor) for floor in model["floors"]}
    if len(set(signatures.values())) != len(signatures):
        raise ValueError("Serialized Colosseum floors have duplicate feature geometry")
    if "unresolvedStops" in model:
        raise ValueError("Canonical model must not serialize unresolvedStops")

    places = {place["id"]: place for place in model["places"]}
    invalid_kinds = sorted({place["kind"] for place in places.values()} - ALLOWED_PLACE_KINDS)
    if invalid_kinds:
        raise ValueError(f"Invalid place kinds: {invalid_kinds}")
    for binding in model["stopBindings"]:
        if binding["placeId"] not in places:
            raise ValueError(f"Unknown stop target: {binding['placeId']}")
    bound = {item["stopIndex"] for item in model["stopBindings"]}
    unresolved = {item["stopIndex"] for item in config["unresolvedStops"]}
    if bound & unresolved:
        raise ValueError("Bound and unresolved stop indexes overlap")
    if bound | unresolved != set(range(6)):
        raise ValueError("Guide stop audit no longer covers indexes 0..5")

    source_digests = {
        "primary": digest(ROOT / "sources/floorplans" / config["file"]),
        **{
            source["id"]: digest(ROOT / "sources/floorplans" / source["file"])
            for source in config["sourceFiles"]
        },
    }
    if source_digests != model["sourceDigests"]:
        raise ValueError("Serialized source digests do not match current source files")
    if evidence["sha256"] != source_digests["primary"]:
        raise ValueError("Evidence primary digest changed")

    source_audit = classification["classification"]
    if any(value["emittedPixelsOutsideSourceTheme"] for value in source_audit.values()):
        raise ValueError("Semantic geometry extends outside a DAI source theme")
    if classification["semanticOutput"]["generatedFootprints"] != 0:
        raise ValueError("Generated footprints are forbidden")
    registration = classification["registration"]
    if registration["controlPointCount"] != 15:
        raise ValueError("Registration control point inventory changed")
    if registration["rmsResidualPixels"] > 0.2 or registration["maxResidualPixels"] > 0.5:
        raise ValueError("Registration residual exceeds its reviewed budget")
    if checkpoints["duplicateSemanticGeometry"]:
        raise ValueError("Reviewed source levels have duplicate semantic geometry")

    audit = {
        "status": "pass",
        "canonicalBuilderOnly": True,
        "exportedValidator": {
            "module": str(args.validator_module.resolve()),
            "moduleSha256": digest(args.validator_module),
            "errors": errors,
        },
        "floors": floor_ids,
        "featureCounts": feature_counts,
        "serializedFeatureSignatures": signatures,
        "sourceSemanticSignatures": checkpoints["semanticSignatures"],
        "duplicateFloorGeometry": False,
        "places": len(places),
        "placeKinds": sorted({place["kind"] for place in places.values()}),
        "boundStops": sorted(bound),
        "unresolvedConfigStops": sorted(unresolved),
        "modelHasUnresolvedStops": False,
        "sourceDigests": source_digests,
        "registration": {
            "controlPointCount": registration["controlPointCount"],
            "rmsResidualPixels": registration["rmsResidualPixels"],
            "maxResidualPixels": registration["maxResidualPixels"],
        },
        "emittedPixelsOutsideSourceTheme": {
            floor: value["emittedPixelsOutsideSourceTheme"]
            for floor, value in source_audit.items()
        },
        "generatedFootprints": 0,
        "criticalCheckpointFile": str(CHECKPOINTS.relative_to(ROOT)),
        "visualReviewFiles": [
            "work/colosseum-dai-levels-qa/hypogeum-level-2-source-semantic-comparison.jpg",
            "work/colosseum-dai-levels-qa/podium-level-3-source-semantic-comparison.jpg",
            "work/model-renders/colosseum--hypogeum-level-2.png",
            "work/model-renders/colosseum--podium-level-3.png",
        ],
        "claimBoundary": (
            "DAI archaeological publication themes only; not a current visitor-route or "
            "operations plan, and no specific lift/trapdoor or complete seating location is asserted."
        ),
    }
    OUTPUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    print(OUTPUT)


if __name__ == "__main__":
    main()
