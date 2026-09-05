#!/usr/bin/env python3
"""Replay the portable St Mark model with the unchanged shared builder."""

import hashlib
import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/st-mark-basilica.json"


def load_generator():
    path = ROOT / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_generator", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def main():
    config = json.loads(CONFIG.read_text())
    derived = next(source for source in config["sourceFiles"] if source["id"] == "semantic-derived")
    source_path = ROOT / "sources/floorplans" / derived["file"]
    actual = hashlib.sha256(source_path.read_bytes()).hexdigest()
    if actual != derived["sha256"]:
        raise ValueError(f"Derived source changed: expected {derived['sha256']}, got {actual}")
    generator = load_generator()
    generator.build(config)


if __name__ == "__main__":
    main()
