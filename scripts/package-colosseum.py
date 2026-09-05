#!/usr/bin/env python3
"""Create the stable, root-relative Colosseum DAI handoff package."""
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / "handoff/colosseum-dai-levels-v1"
FILES = [
    "scripts/make_colosseum_dai_levels.py",
    "scripts/rebuild-colosseum.py",
    "scripts/audit-colosseum.py",
    "scripts/package-colosseum.py",
    "sources/floorplans/research/colosseum-dai-podium-2022.pdf",
    "sources/floorplans/research/colosseum-dai-podium-plan-2022.pdf",
    "sources/floorplans/colosseum-dai-reviewed-levels.pdf",
    "sources/floorplans/venues/colosseum.json",
    "sources/floorplans/evidence/colosseum.json",
    "app/data/architectural-plans/colosseum.json",
    "work/colosseum-dai-levels-qa/registered-source-mosaic.jpg",
    "work/colosseum-dai-levels-qa/hypogeum-level-2-source-semantic-comparison.jpg",
    "work/colosseum-dai-levels-qa/podium-level-3-source-semantic-comparison.jpg",
    "work/colosseum-dai-levels-qa/registration.json",
    "work/colosseum-dai-levels-qa/classification-audit.json",
    "work/colosseum-dai-levels-qa/critical-wall-checkpoints.json",
    "work/colosseum-dai-levels-qa/model-audit.json",
    "work/model-renders/colosseum--hypogeum-level-2.png",
    "work/model-renders/colosseum--podium-level-3.png",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    if PACKAGE.exists():
        raise FileExistsError(f"Refusing to replace existing handoff: {PACKAGE}")
    for relative in FILES:
        source = ROOT / relative
        if not source.is_file():
            raise FileNotFoundError(source)
        target = PACKAGE / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    audit = json.loads((ROOT / "work/colosseum-dai-levels-qa/model-audit.json").read_text())
    if audit["status"] != "pass" or audit["exportedValidator"]["errors"]:
        raise ValueError("Only a validator-clean model may be packaged")
    handoff = {
        "package": "colosseum-dai-levels-v1",
        "status": "ready-for-main-review",
        "rootRelativeInstall": True,
        "canonicalBuild": (
            "scripts/rebuild-colosseum.py regenerates the reviewed semantic PDF and config, "
            "then calls the shared builder; no generated-model postpatch"
        ),
        "summary": {
            "floors": 2,
            "places": 10,
            "features": 11558,
            "spaces": 0,
            "stopBindings": 2,
            "boundStopIndices": [2, 4],
            "configUnresolvedStopIndices": [0, 1, 3, 5],
            "serializedHasUnresolvedStops": False,
            "exportedValidatorErrors": [],
        },
        "sourceSemantics": {
            "hypogeum-level-2": "DAI legend: Theme IPOGEI Ebene 2 / Livello 2",
            "podium-level-3": "DAI legend: Theme PODIO Ebene 3 PODIO / Livello 3 PODIO",
            "sameRegisteredPlate": True,
            "duplicateSemanticGeometry": False,
            "generatedFootprints": 0,
            "emittedPixelsOutsideSourceTheme": {
                "hypogeum-level-2": 0,
                "podium-level-3": 0,
            },
        },
        "registration": {
            "controlPoints": 15,
            "rmsResidualPixels": 0.149906,
            "maxResidualPixels": 0.449193,
            "downsample": "Each output cell is the union of a 4x4 source-theme block; wall wins over flat detail.",
        },
        "claimBoundary": (
            "This is an archaeological scholarly plate with reconstruction proposals, not a current "
            "visitor-route or operations plan. Modern security, a unique lift/trapdoor binding, and "
            "complete seating remain explicitly unresolved."
        ),
        "sources": [
            {
                "file": "sources/floorplans/research/colosseum-dai-podium-plan-2022.pdf",
                "url": "https://publications.dainst.org/journals/rm/article/view/4033/7838",
                "use": "1:100 supplementary orthographic plate and its printed level themes",
            },
            {
                "file": "sources/floorplans/research/colosseum-dai-podium-2022.pdf",
                "url": "https://publications.dainst.org/journals/rm/article/view/4033",
                "doi": "https://doi.org/10.34780/izc6-l6zf",
                "use": "peer-reviewed article context for the podium reconstruction proposal",
            },
        ],
        "qa": [
            "work/colosseum-dai-levels-qa/hypogeum-level-2-source-semantic-comparison.jpg",
            "work/colosseum-dai-levels-qa/podium-level-3-source-semantic-comparison.jpg",
            "work/colosseum-dai-levels-qa/critical-wall-checkpoints.json",
            "work/colosseum-dai-levels-qa/model-audit.json",
            "work/model-renders/colosseum--hypogeum-level-2.png",
            "work/model-renders/colosseum--podium-level-3.png",
        ],
        "files": {relative: digest(PACKAGE / relative) for relative in FILES},
    }
    (PACKAGE / "HANDOFF.json").write_text(
        json.dumps(handoff, ensure_ascii=False, indent=2) + "\n"
    )
    print(PACKAGE)
    print(digest(PACKAGE / "HANDOFF.json"))


if __name__ == "__main__":
    main()
