"""One reviewed inventory for source audits, model generation and room anchors."""

import json
from pathlib import Path


def load_inventory(source: Path):
    inventory = json.loads((source / "st-peters-number-inventory.json").read_text())
    corrections = json.loads((source / "st-peters-anchor-corrections.json").read_text())
    places = []
    for place in inventory["basilica"]:
        if place["label"] in corrections["unlocatedBasilicaLabels"]:
            continue
        if place["label"] in corrections["basilica"]:
            place["at"] = corrections["basilica"][place["label"]]
        place["precision"] = "reviewed-named-plan-zone" if place["label"] in corrections["namedZoneLabels"] else "reviewed-source-glyph-center"
        places.append(place)
    places.extend({**place, "precision": "reviewed-source-glyph-center"} for place in corrections["additionalBasilicaInstances"])
    inventory["basilica"] = places
    return inventory
