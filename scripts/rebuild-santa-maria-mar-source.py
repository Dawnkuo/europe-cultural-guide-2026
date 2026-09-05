#!/usr/bin/env python3
"""Extract source-present cyan structural pixels from the UPC thesis plan."""

import io
import hashlib
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans/santa-maria-mar-thesis.pdf"
OUTPUT = ROOT / "sources/floorplans/santa-maria-mar-cyan-structural.pdf"
QA = ROOT / "sources/floorplans/qa"
SOURCE_SHA256 = "7fc3848f35ba223860d8c2cf2639520105e632fa1a4ed24aed0130a886f985e5"
PAGE_NUMBER = 50
XREF = 104
IMAGE_BOX = fitz.Rect(87.83999633789062, 318.9596252441406, 502.3199768066406, 502.91961669921875)


def cyan_mask(rgb, delta, min_component):
    values = rgb.astype(np.int16)
    red, green, blue = (values[:, :, channel] for channel in range(3))
    selected = (
        (green - red >= delta)
        & (blue - red >= delta)
        & (np.abs(green - blue) <= 50)
        & (np.maximum(green, blue) >= 80)
    )
    count, labels, stats, _ = cv2.connectedComponentsWithStats(selected.astype(np.uint8))
    keep = np.zeros(selected.shape, dtype=np.uint8)
    for index in range(1, count):
        if stats[index, cv2.CC_STAT_AREA] >= min_component:
            keep[labels == index] = 255
    return keep


def main():
    actual_sha256 = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if actual_sha256 != SOURCE_SHA256:
        raise ValueError(f"Unexpected source SHA-256: {actual_sha256}")
    QA.mkdir(parents=True, exist_ok=True)
    document = fitz.open(SOURCE)
    try:
        image = np.asarray(Image.open(io.BytesIO(document.extract_image(XREF)["image"])).convert("RGB"))
        masks = []
        for delta in (8, 10, 12, 18):
            mask = cyan_mask(image, delta, 100)
            masks.append(mask)
            cv2.imwrite(str(QA / f"santa-maria-mar-cyan-delta-{delta}.png"), mask)

        review_width = 1600
        review_rows = []
        for mask in masks:
            height = round(mask.shape[0] * review_width / mask.shape[1])
            review_rows.append(cv2.resize(mask, (review_width, height), interpolation=cv2.INTER_AREA))
        separator = np.full((12, review_width), 220, np.uint8)
        review = review_rows[0]
        for row in review_rows[1:]:
            review = np.vstack((review, separator, row))
        cv2.imwrite(str(QA / "santa-maria-mar-cyan-threshold-review.png"), review)

        # Delta 8 recovers the anti-aliased source line without adding pixels
        # beyond the original cyan overlay. The component floor removes only
        # isolated colour noise from the underlying greyscale photomontage.
        chosen = masks[0]
        mono_mask = np.where(chosen > 0, 0, 255).astype(np.uint8)
        rgb_mask = np.repeat(mono_mask[:, :, None], 3, axis=2)
        encoded = io.BytesIO()
        Image.fromarray(rgb_mask).save(encoded, format="PNG", optimize=False)

        output = fitz.open()
        page = output.new_page(width=document[PAGE_NUMBER - 1].rect.width, height=document[PAGE_NUMBER - 1].rect.height)
        page.insert_image(IMAGE_BOX, stream=encoded.getvalue())
        output.save(OUTPUT, garbage=4, deflate=True, no_new_id=True)
        output.close()
        cv2.imwrite(str(QA / "santa-maria-mar-cyan-structural-mask.png"), rgb_mask)
    finally:
        document.close()
    print(OUTPUT)


if __name__ == "__main__":
    main()
