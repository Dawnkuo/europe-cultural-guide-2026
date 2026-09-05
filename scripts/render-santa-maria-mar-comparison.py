#!/usr/bin/env python3
"""Render the native thesis image, selected cyan mask and generated model."""

import json
from pathlib import Path

import cv2
import numpy as np


ROOT = Path(__file__).resolve().parents[1]
QA = ROOT / "sources/floorplans/qa"
MODEL = ROOT / "app/data/architectural-plans/santa-maria-mar.json"
SOURCE = QA / "santa-maria-mar-thesis-xref104.jpeg"
MASK = QA / "santa-maria-mar-cyan-structural-mask.png"
KINDS = {"surface": (232, 224, 210), "detail": (80, 80, 80), "wall": (25, 25, 25)}


def fit(image, width, height):
    scale = min(width / image.shape[1], height / image.shape[0])
    resized = cv2.resize(
        image,
        (round(image.shape[1] * scale), round(image.shape[0] * scale)),
        interpolation=cv2.INTER_AREA,
    )
    canvas = np.full((height, width, 3), 255, np.uint8)
    x = (width - resized.shape[1]) // 2
    y = (height - resized.shape[0]) // 2
    canvas[y:y + resized.shape[0], x:x + resized.shape[1]] = resized
    return canvas


def render(model):
    floor = model["floors"][0]
    x0, y0, x1, y1 = floor["bounds"]
    scale = min(1500 / (x1 - x0), 650 / (y1 - y0))
    canvas = np.full((round((y1 - y0) * scale), round((x1 - x0) * scale), 3), 248, np.uint8)

    def points(ring):
        return np.array([[(x - x0) * scale, (y - y0) * scale] for x, y in ring], np.int32)

    for feature in floor["features"]:
        colour = KINDS[feature["kind"]]
        for polygon in feature["polygons"]:
            cv2.fillPoly(canvas, [points(polygon["outer"])], colour)
            for hole in polygon.get("holes", []):
                cv2.fillPoly(canvas, [points(hole)], (248, 248, 248))
    return canvas


def main():
    model = json.loads(MODEL.read_text())
    panels = [cv2.imread(str(SOURCE)), cv2.imread(str(MASK)), render(model)]
    panels = [fit(panel, 1600, 720) for panel in panels]
    divider = np.full((12, 1600, 3), 210, np.uint8)
    output = QA / "santa-maria-mar-source-mask-model-contact.png"
    cv2.imwrite(str(output), np.vstack((panels[0], divider, panels[1], divider, panels[2])))
    print(output)


if __name__ == "__main__":
    main()
