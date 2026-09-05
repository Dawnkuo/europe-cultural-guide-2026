#!/usr/bin/env python3
"""Extract four historic La Pedrera visitor plans and their printed area fills."""

import io
import hashlib
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans/investigated/la-pedrera-visitor-brochure-third-party.pdf"
OUTPUT = ROOT / "sources/floorplans/la-pedrera-historic-visitor-plans.pdf"
QA = ROOT / "work/la-pedrera-source-review"

# Crop boxes use pixels after a counter-clockwise 90-degree rotation of each
# 2480 x 3507 scan. Page order follows the visitor's vertical route.
PLANS = [
    {
        "id": "ground", "page": 3, "xref": 20, "crop": (1175, 690, 2320, 1435),
        "holeArea": 10000, "closeKernel": 3, "colour": "all",
        "excludeRects": [(140, 540, 174, 581), (112, 583, 141, 622),
                         (665, 640, 700, 687), (640, 694, 671, 745)],
    },
    {"id": "apartment", "page": 2, "xref": 13, "crop": (1190, 1580, 2320, 2320), "holeArea": 20000, "closeKernel": 3, "colour": "green"},
    {"id": "attic", "page": 2, "xref": 13, "crop": (1180, 790, 2320, 1515), "holeArea": 5000, "closeKernel": 3, "colour": "green"},
    {"id": "roof", "page": 2, "xref": 13, "crop": (1190, 15, 2320, 720), "holeArea": 10000, "closeKernel": 3, "colour": "green"},
]


def coloured_area(image, mode, hole_area, close_kernel, exclude_rects=()):
    rgb = np.asarray(image.convert("RGB"), dtype=np.int16)
    red, green, blue = (rgb[:, :, channel] for channel in range(3))
    if mode == "green":
        selected = (green - red >= 2) & (blue - red >= 0) & (red > 95) & (green < 250)
    else:
        selected = (rgb.max(axis=2) - rgb.min(axis=2) >= 7) & (rgb.min(axis=2) > 105) & (rgb.max(axis=2) < 248)
    for x0, y0, x1, y1 in exclude_rects:
        selected[y0:y1, x0:x1] = False
    mask = selected.astype(np.uint8) * 255
    # Small, per-plan kernels join only the scan's halftone dots. In
    # particular, the entrance plan uses 3px rather than the former 21px
    # close that joined external a/b wayfinding ink to the visitor fill.
    if close_kernel > 1:
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((close_kernel, close_kernel), np.uint8))

    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = np.where(labels == largest, 255, 0).astype(np.uint8)

    # The scan's halftone and overprinted wayfinding badges create small gaps.
    # Fill only gaps below the reviewed per-plan area threshold; all larger
    # courtyard, roof-void and skylight holes remain source-shaped.
    count, labels, stats, _ = cv2.connectedComponentsWithStats((mask == 0).astype(np.uint8))
    for index in range(1, count):
        x, y, width, height, area = (int(value) for value in stats[index])
        enclosed = x > 0 and y > 0 and x + width < mask.shape[1] and y + height < mask.shape[0]
        if enclosed and area < hole_area:
            mask[labels == index] = 255
    return mask


def surface_paths(mask):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    hierarchy = hierarchy[0]
    result = []
    for index, contour in enumerate(contours):
        if hierarchy[index][3] != -1:
            continue
        rings = [contour]
        child = hierarchy[index][2]
        while child != -1:
            rings.append(contours[child])
            child = hierarchy[child][0]
        result.append(rings)
    return result


def add_surface(page, rings):
    shape = page.new_shape()
    for contour in rings:
        points = [fitz.Point(float(point[0][0]), float(point[0][1])) for point in contour]
        if len(points) >= 3:
            shape.draw_polyline(points)
    shape.finish(color=None, fill=(0.93, 0.90, 0.78), closePath=True, even_odd=True)
    shape.commit(overlay=False)


def main():
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != "a50e5212e85eff30cb7574939d90f3b3f81c075de5292e377c24b9b74deb37f0":
        raise ValueError("La Pedrera brochure changed: source review required")
    QA.mkdir(parents=True, exist_ok=True)
    source = fitz.open(SOURCE)
    output = fitz.open()
    try:
        extracted = {}
        for spec in PLANS:
            if spec["xref"] not in extracted:
                data = source.extract_image(spec["xref"])["image"]
                extracted[spec["xref"]] = Image.open(io.BytesIO(data)).convert("RGB").transpose(Image.Transpose.ROTATE_90)
            image = extracted[spec["xref"]].crop(spec["crop"])
            mask = coloured_area(
                image,
                spec["colour"],
                spec["holeArea"],
                spec["closeKernel"],
                spec.get("excludeRects", ()),
            )

            page = output.new_page(width=image.width, height=image.height)
            paths = surface_paths(mask)
            if len(paths) != 1:
                raise ValueError(f"{spec['id']} expected one reviewed visitor-area surface, got {len(paths)}")
            add_surface(page, paths[0])
            encoded = io.BytesIO()
            image.save(encoded, format="PNG", optimize=False)
            page.insert_image(page.rect, stream=encoded.getvalue(), overlay=True)

            image.save(QA / f"la-pedrera-{spec['id']}-visitor-source.png")
            cv2.imwrite(str(QA / f"la-pedrera-{spec['id']}-visitor-surface-mask.png"), mask)
            overlay = np.asarray(image).copy()
            colour = np.zeros_like(overlay)
            colour[:, :, 0] = 220
            overlay[mask > 0] = (0.55 * overlay[mask > 0] + 0.45 * colour[mask > 0]).astype(np.uint8)
            Image.fromarray(overlay).save(QA / f"la-pedrera-{spec['id']}-visitor-surface-overlay.png")
        output.save(OUTPUT, garbage=4, deflate=True, no_new_id=True)
    finally:
        source.close()
        output.close()
    print(OUTPUT)


if __name__ == "__main__":
    main()
