#!/usr/bin/env python3
"""Render native Casa Batllo plan extracts beside the generated floors."""

import json
from pathlib import Path

import cv2
import fitz
import numpy as np


ROOT = Path("/tmp/europe-map-rebuild-barcelona")
QA = ROOT / "sources/floorplans/qa"
MODEL = ROOT / "app/data/architectural-plans/casa-batllo.json"
SOURCE = ROOT / "sources/floorplans/casa-batllo-ar-post-gaudi-plans.pdf"
SOURCE_IDS = ("ground", "first", "second")
KINDS = {"surface": (232, 224, 210), "detail": (80, 80, 80), "wall": (25, 25, 25)}


def render_floor(floor, places):
    x0, y0, x1, y1 = floor["bounds"]
    width = max(x1 - x0, 1)
    height = max(y1 - y0, 1)
    scale = min(1420 / width, 520 / height)
    canvas = np.full((round(height * scale), round(width * scale), 3), 248, np.uint8)

    def points(ring):
        return np.array([[(x - x0) * scale, (y - y0) * scale] for x, y in ring], np.int32)

    for feature in floor["features"]:
        colour = KINDS[feature["kind"]]
        for polygon in feature["polygons"]:
            cv2.fillPoly(canvas, [points(polygon["outer"])], colour)
            for hole in polygon.get("holes", []):
                cv2.fillPoly(canvas, [points(hole)], (248, 248, 248))
    for place in places:
        x = round((place["at"][0] - x0) * scale)
        y = round((place["at"][1] - y0) * scale)
        cv2.circle(canvas, (x, y), 5, (15, 79, 190), -1)
    return canvas


def fit(image, width, height):
    scale = min(width / image.shape[1], height / image.shape[0])
    resized = cv2.resize(image, (round(image.shape[1] * scale), round(image.shape[0] * scale)), interpolation=cv2.INTER_AREA)
    canvas = np.full((height, width, 3), 255, np.uint8)
    x = (width - resized.shape[1]) // 2
    y = (height - resized.shape[0]) // 2
    canvas[y:y + resized.shape[0], x:x + resized.shape[1]] = resized
    return canvas


def source_page(document, page_number):
    pixmap = document[page_number].get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
    return cv2.cvtColor(image[:, :, :3], cv2.COLOR_RGB2BGR)


def main():
    model = json.loads(MODEL.read_text())
    document = fitz.open(SOURCE)
    try:
        rows = []
        for page_number, floor in enumerate(model["floors"]):
            native = source_page(document, page_number)
            cv2.imwrite(str(QA / f"casa-batllo-{SOURCE_IDS[page_number]}-native.png"), native)
            original = fit(native, 1420, 520)
            places = [place for place in model["places"] if place["floorId"] == floor["id"]]
            generated = fit(render_floor(floor, places), 1420, 520)
            divider = np.full((520, 12, 3), 220, np.uint8)
            rows.append(np.hstack((original, divider, generated)))
    finally:
        document.close()

    separator = np.full((16, rows[0].shape[1], 3), 255, np.uint8)
    sheet = rows[0]
    for row in rows[1:]:
        sheet = np.vstack((sheet, separator, row))
    output = QA / "casa-batllo-source-model-contact.png"
    cv2.imwrite(str(output), sheet)
    print(output)


if __name__ == "__main__":
    main()
