#!/usr/bin/env python3
"""Rebuild the St Mark Campanile model through the unchanged shared builder."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "sources/floorplans/venues/st-mark-campanile.json"
BUILDER_PATH = ROOT / "scripts/build-architectural-plans.py"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    config = json.loads(CONFIG_PATH.read_text())
    records = [config, *config.get("sourceFiles", [])]
    for record in records:
        source_path = ROOT / "sources/floorplans" / record["file"]
        actual = sha256(source_path)
        if actual != record["sha256"]:
            raise ValueError(
                f"Source digest mismatch for {source_path.name}: "
                f"expected {record['sha256']}, got {actual}"
            )

    spec = importlib.util.spec_from_file_location("architectural_builder", BUILDER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load shared builder from {BUILDER_PATH}")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    builder.ROOT = ROOT
    builder.build(config)


if __name__ == "__main__":
    main()
