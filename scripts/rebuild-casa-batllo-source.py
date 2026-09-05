#!/usr/bin/env python3
"""Extract the three published Casa Batllo floor plans without rescaling."""

import hashlib
import io
from pathlib import Path

import fitz
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans/investigated/casa-batllo-architectural-review-drawings.pdf"
OUTPUT = ROOT / "sources/floorplans/casa-batllo-ar-post-gaudi-plans.pdf"
SOURCE_SHA256 = "bd3d92782bd35d3ab93aa3c55f291cae05163b7742a2ff2269cd16c74343d3ba"

# The PDF page places these original-resolution plan images from top to bottom.
PLANS = [
    ("ground", 175, False),
    ("first", 179, True),
    ("second", 183, False),
]


def main():
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError("Casa Batllo publication changed; source review required")
    source = fitz.open(SOURCE)
    output = fitz.open()
    try:
        for _label, xref, inverted in PLANS:
            extracted = source.extract_image(xref)
            image = Image.open(io.BytesIO(extracted["image"])).convert("RGB")
            if inverted:
                # This JPEG is stored as white ink on black and displayed by the
                # source PDF with an inverted Decode array. Reapply that exact
                # display transform before lossless embedding.
                image = ImageOps.invert(image)
            encoded = io.BytesIO()
            image.save(encoded, format="PNG", optimize=False)
            page = output.new_page(width=image.width, height=image.height)
            page.insert_image(page.rect, stream=encoded.getvalue())
        output.save(OUTPUT, garbage=4, deflate=True, no_new_id=True)
    finally:
        source.close()
        output.close()
    print(OUTPUT)


if __name__ == "__main__":
    main()
