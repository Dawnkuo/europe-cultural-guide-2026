"""Extract independently reviewed, enclosed white plan regions as selection faces."""
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely.affinity import affine_transform

ROOT = Path(__file__).resolve().parents[1]
module = importlib.util.spec_from_file_location("plans", ROOT / "scripts/build-architectural-plans.py")
builder = importlib.util.module_from_spec(module)
module.loader.exec_module(builder)

# Each seed is inside a visually checked white region of the pinned source.
# These faces support selection, not claims that tombs/altars are walkable.
REGIONS = [
    ("portico", "Portico", "1", [(196, 529), (125, 530), (270, 530)]),
    ("portal", "Portal", "2", [(196, 435)]),
    ("cella", "Cella", "3", [(196, 284)]),
    ("sanctuary", "Sanctuary", "4", [(196, 136)]),
    ("st-joseph", "Chapel of St Joseph", "6", [(88, 389)]),
    ("crucifixion", "Chapel of the Crucifixion", "10", [(88, 177)]),
    ("railing", "Chapel of Our Lady of the Railing", "13", [(301, 178)]),
    ("annunciation", "Chapel of the Annunciation", "17", [(301, 388)]),
]


def main():
    path = ROOT / "sources/floorplans/venues/pantheon.json"
    config = json.loads(path.read_text())
    source = ROOT / "sources/floorplans" / config["file"]
    if hashlib.sha256(source.read_bytes()).hexdigest() != config["sha256"]:
        raise ValueError("Pantheon source changed: review required")
    with fitz.open(source) as document:
        pixmap = fitz.Pixmap(document, 8)
        rgb = np.frombuffer(pixmap.samples, np.uint8).reshape(pixmap.height, pixmap.width, 3)
        # Red plan labels remain open space; only the reviewed dark architectural
        # ink defines boundaries. No closing, dilation or inferred bridge is used.
        background = (rgb.max(axis=2) > 190).astype(np.uint8)
        _, components, stats, _ = cv2.connectedComponentsWithStats(background, connectivity=4)
        matrix = document[0].get_image_rects(8, transform=True)[0][1]
        inverse = ~matrix
        transform = [matrix.a / pixmap.width, matrix.c / pixmap.height,
                     matrix.b / pixmap.width, matrix.d / pixmap.height, matrix.e, matrix.f]
        faces, claims = [], []
        for space_id, name, label, seeds in REGIONS:
            ids = set()
            for seed in seeds:
                point = fitz.Point(seed) * inverse
                component = int(components[round(point.y * pixmap.height), round(point.x * pixmap.width)])
                x, y, width, height, area = stats[component]
                if component == 0 or area < 1000 or x == 0 or y == 0 or x + width == pixmap.width or y + height == pixmap.height:
                    raise ValueError(f"Unenclosed or invalid source face: {name}")
                ids.add(component)
            mask = np.isin(components, list(ids)).astype(np.uint8)
            geometry = affine_transform(builder.trace_pixel_ink(mask, tolerance=.2), transform)
            polygons = builder.polygons(geometry, [0, 0])
            if not polygons or not geometry.is_valid:
                raise ValueError(f"Invalid source face topology: {name}")
            place = next(p for p in config["floors"][0]["places"] if p["label"] == label)
            faces.append({
                "id": space_id, "label": place["name"], "placeId": f"L0-{label}-1",
                "polygons": polygons, "tone": "neutral",
                "sourcePaths": [f"image:8:white-component:{i}" for i in sorted(ids)],
                "evidence": f"Reviewed enclosed white source region for {name}; 4-connected components at dark-ink threshold 190, no morphology. Translation and equal x/y scaling only. Selection footprint, not a navigation clearance claim.",
            })
            claims.append({"spaceId": space_id, "sourceSeeds": seeds,
                           "components": [{"id": i, "boundsAndPixelArea": stats[i].tolist()} for i in sorted(ids)],
                           "sourceArea": float(geometry.area)})
        config["floors"][0]["spaces"] = faces
        path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
        report = {"source": {"file": f"sources/floorplans/{config['file']}", "sha256": config["sha256"]},
                  "method": "Reviewed enclosed source-white components; source-proportional selection faces; no guessed room partitions.",
                  "spaces": claims}
        (ROOT / "sources/floorplans/rebuild-reports/pantheon-source-spaces.json").write_text(json.dumps(report, indent=2) + "\n")
        print(f"Pantheon: {len(faces)} source-derived selection spaces")


if __name__ == "__main__":
    main()
