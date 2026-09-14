#!/usr/bin/env python3
"""Preserve the official plan's coloured footprint ink for source review only."""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely import box, union_all


SOURCE_HASH = "fa1697d17ed7247aa471c7d1f6e3492c5ac57de3218e57a2b65bb3e2f54cdb9a"
SOURCE_URL = "https://m.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/notizie/2023/144_mappa_stato_vaticano.pdf"


def pixel_polygons(mask):
    # Union unit pixel cells, not contour-centre polygons. This preserves every
    # selected pixel and avoids silently dropping single-pixel fragments.
    runs = []
    for y, row in enumerate(mask):
        transitions = np.diff(np.pad(row.astype(np.int8), (1, 1)))
        starts = np.flatnonzero(transitions == 1)
        ends = np.flatnonzero(transitions == -1)
        runs.extend(box(int(a), y, int(b), y + 1) for a, b in zip(starts, ends))
    result = union_all(runs)
    parts = [result] if result.geom_type == "Polygon" else list(result.geoms)
    assert all(p.is_valid for p in parts)
    assert sum(p.area for p in parts) == int(mask.sum())
    return sorted(parts, key=lambda p: (p.bounds[1], p.bounds[0], p.area))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--out", type=Path, default=Path("work/experience/vatican-compound-source/trace"))
    args = parser.parse_args()
    assert hashlib.sha256(args.pdf.read_bytes()).hexdigest() == SOURCE_HASH, "Re-review a changed source"
    args.out.mkdir(parents=True, exist_ok=True)
    document = fitz.open(args.pdf)
    assert len(document) == 1
    source_images = document[0].get_images()
    assert len(source_images) == 1
    image = fitz.Pixmap(document, source_images[0][0])
    assert (image.width, image.height, image.n) == (2067, 2923, 3)
    rgb = np.frombuffer(image.samples, np.uint8).reshape(image.height, image.width, 3)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    mask = cv2.inRange(hsv, np.array([17, 125, 110]), np.array([36, 255, 255])) > 0

    # The printed compass and photographed door are not building ink.
    # Retain the other selected pixels without closing, hole filling, scaling,
    # simplification, assumed courtyard boundaries or invented roof divisions.
    exclusions = [
        {"bounds": [0, 0, 2067, 510], "reason": "top margin, compass and legend"},
        {"bounds": [1625, 2020, 1890, 2285], "reason": "photograph inset of Porta S. Rosa"},
        {"bounds": [0, 2440, 2067, 2923], "reason": "lower margin, printed arms and caption"},
    ]
    excluded = []
    for item in exclusions:
        x0, y0, x1, y1 = item["bounds"]
        excluded.append({**item, "selectedPixelsRemoved": int(mask[y0:y1, x0:x1].sum())})
        mask[y0:y1, x0:x1] = False
    parts = pixel_polygons(mask)
    features = [{
        "id": f"state-plan-ink-{index + 1}",
        "outer": list(part.exterior.coords),
        "holes": [list(ring.coords) for ring in part.interiors],
        "areaPixels": part.area,
        "bounds": list(part.bounds),
        "classification": "unclassified-source-ink",
    } for index, part in enumerate(parts)]
    result = {
        "status": "source-segmentation-only-not-a-building-model",
        "source": {"url": SOURCE_URL, "sha256": SOURCE_HASH, "page": 1,
                   "embeddedImageSize": [image.width, image.height],
                   "embeddedImageSHA256": hashlib.sha256(image.samples).hexdigest()},
        "coordinateSpace": "native-source-pixel-corners",
        "projection": "orthographic; source north points right, not up",
        "worldScale": "unassigned; printed 1:1000 has been resized into an A4 PDF",
        "parameters": {"hsvInclusiveMin": [17, 125, 110], "hsvInclusiveMax": [36, 255, 255],
                       "morphology": "none", "simplification": "none"},
        "excludedNonMapRegions": excluded,
        "selectedPixels": int(mask.sum()),
        "vectorAreaPixels": sum(p.area for p in parts),
        "features": features,
        "limitations": [
            "These are colour-connected source fragments, not rooms or complete building footprints.",
            "White number badges, dark outlines and text can interrupt a coloured building region.",
            "Every small fragment remains; no count is promoted to a building or room count.",
            "No wall, height, roof, floor, entrance, route or physical connection is inferred.",
            "Museum/palace semantics and registration to the St Peter mesh remain unreviewed.",
        ],
    }
    (args.out / "trace.json").write_text(json.dumps(result, separators=(",", ":")) + "\n")
    paths = []
    for feature in features:
        rings = [feature["outer"], *feature["holes"]]
        data = " ".join("M" + " L".join(f"{x:g},{y:g}" for x, y in ring) + " Z" for ring in rings)
        paths.append(f'<path id="{feature["id"]}" d="{data}"/>')
    (args.out / "trace.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2067 2923">'
        '<rect width="2067" height="2923" fill="#061019"/>'
        '<g fill="#d8bc76" fill-rule="evenodd">' + "".join(paths) + '</g></svg>\n')
    image.save(str(args.out / "source.png"))
    cv2.imwrite(str(args.out / "selected-mask.png"), mask.astype(np.uint8) * 255)
    print(json.dumps({"status": result["status"], "components": len(features),
                      "selectedPixels": result["selectedPixels"],
                      "vectorAreaPixels": result["vectorAreaPixels"],
                      "topologyRepairs": 0}))


if __name__ == "__main__":
    main()
