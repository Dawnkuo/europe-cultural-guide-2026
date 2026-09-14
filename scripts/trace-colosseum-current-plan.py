#!/usr/bin/env python3
"""Extract a review-only first-level trace, never an accepted indoor map."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

import cv2
import fitz
import numpy as np
from shapely.geometry import Polygon
from shapely import make_valid

parser = argparse.ArgumentParser()
parser.add_argument("pdf", type=Path)
parser.add_argument("--out", type=Path, default=Path("work/experience/colosseum-source-study"))
args = parser.parse_args()
args.out.mkdir(parents=True, exist_ok=True)
if args.pdf.resolve() != (args.out / "source.pdf").resolve():
    shutil.copyfile(args.pdf, args.out / "source.pdf")
doc = fitz.open(args.pdf)
page = doc[6]
images = page.get_images()
assert len(images) == 1, "Recheck the source figure before extracting"
pix = fitz.Pixmap(doc, images[0][0])
assert (pix.width, pix.height) == (1081, 825), "Source controls no longer match"
raw = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
gray = cv2.cvtColor(raw[:, :, :3], cv2.COLOR_RGB2GRAY)

# The perimeter follows the inner radial-pier zone. It deliberately excludes
# the external numbered bays and the legend, whose outline symbols are not
# proof of surviving masonry. No elevation is inferred from this raster.
boundary = [[161,211],[222,164],[330,126],[434,126],[522,154],
            [606,197],[681,253],[731,327],[776,427],[778,491],
            [738,557],[661,639],[563,696],[488,726],[417,726],
            [314,690],[239,649],[166,583],[106,511],[76,450],
            [69,372],[84,299],[123,249]]
region = np.zeros(gray.shape, dtype=np.uint8)
cv2.fillPoly(region, [np.array(boundary, dtype=np.int32)], 255)
ink = np.where((gray < 215) & (region > 0), 255, 0).astype(np.uint8)
connected = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, np.ones((2, 2), np.uint8))
count, labels, stats, _ = cv2.connectedComponentsWithStats(connected)
features, rejected, repairs = [], [], []
for label in range(1, count):
    x, y, w, h, area = [int(v) for v in stats[label]]
    # Review selection for exterior relief, not source-complete extraction:
    # small items may be piers, labels or fragments and stay unresolved.
    if area < 70 or max(w, h) < 9:
        rejected.append({"bounds": [x, y, w, h], "area": area, "reason": "small-unclassified"})
        continue
    mask = np.where(labels == label, 255, 0).astype(np.uint8)
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    for index, contour in enumerate(contours):
        if hierarchy[0][index][3] != -1:
            continue
        outer = cv2.approxPolyDP(contour, 0.45, True).reshape(-1, 2).tolist()
        if len(outer) < 3:
            continue
        holes = []
        child = hierarchy[0][index][2]
        while child != -1:
            ring = cv2.approxPolyDP(contours[child], 0.45, True).reshape(-1, 2).tolist()
            if len(ring) >= 3:
                holes.append(ring + [ring[0]])
            child = hierarchy[0][child][0]
        outer.append(outer[0])
        shape = Polygon(outer, holes)
        fixed = shape if shape.is_valid else make_valid(shape)
        pending, polygons = [fixed], []
        while pending:
            geometry = pending.pop()
            if geometry.geom_type == "Polygon":
                polygons.append(geometry)
            elif hasattr(geometry, "geoms"):
                pending.extend(geometry.geoms)
        if not shape.is_valid:
            repairs.append({"component": label, "method": "GEOS-make-valid-linework",
                            "sourceArea": float(shape.area),
                            "resultArea": sum(p.area for p in polygons),
                            "polygonParts": len(polygons), "review": "unreviewed"})
        for part, polygon in enumerate(polygons):
            assert polygon.is_valid, "Invalid rings must not reach an extrusion"
            features.append({"id": f"rea2002-component-{label}-{part}",
                             "outer": list(polygon.exterior.coords),
                             "holes": [list(ring.coords) for ring in polygon.interiors],
                             "valid": True, "area": float(polygon.area), "review": "unreviewed"})

result = {
    "status": "unreviewed-do-not-publish",
    "source": "Coccia, Como, Conforto, Ianniruberto (2006), p.765 fig.6, reprinted from Rea (2002)",
    "url": "https://the-colosseum.net/docs/Coccia%20Como%20Conforto%20-%20Statical%20analysis.pdf",
    "institutionalRecord": "https://art.torvergata.it/handle/2108/25987",
    "pdfSHA256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
    "figureSHA256": hashlib.sha256(pix.samples).hexdigest(),
    "projection": "orthographic-plan; orientation not yet registered to exterior",
    "sourceSize": [pix.width, pix.height], "boundary": boundary,
    "parameters": {"threshold": 215, "connectKernel": [2, 2], "minArea": 70, "minExtent": 9, "tolerancePixels": 0.45},
    "features": features, "rejected": rejected, "repairs": repairs,
    "limitations": [
        "Only a selected first-level radial-pier zone; not a whole building or hypogeum plan.",
        "Closing can join labels or gaps. Every selected component needs source-overlay review.",
        "No height, opening, room number, visit route, seating or current access is inferred.",
        "Small excluded components remain unclassified, not declared absent.",
        "The 2002 plan requires reconciliation with later conservation work before a current-state claim."
    ]
}
(args.out / "trace.json").write_text(json.dumps(result, indent=2) + "\n")
paths = []
for feature in features:
    def path(ring):
        return "M" + " L".join(f"{x},{y}" for x, y in ring) + " Z"
    d = " ".join(path(ring) for ring in [feature["outer"], *feature["holes"]])
    fill = "#d8bc76" if feature["valid"] else "#ef7272"
    paths.append(f'<path d="{d}" fill="{fill}" fill-rule="evenodd"><title>{feature["id"]}</title></path>')
(args.out / "trace.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1081 825">'
    '<rect width="1081" height="825" fill="#061019"/>' + ''.join(paths) + '</svg>')
pix.save(str(args.out / "source-figure.png"))
print(json.dumps({"features": len(features), "invalid": sum(not f["valid"] for f in features), "topologyRepairs": len(repairs), "unclassifiedSmallComponents": len(rejected), "status": result["status"]}))
