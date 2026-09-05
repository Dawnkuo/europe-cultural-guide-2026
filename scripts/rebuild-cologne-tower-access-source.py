#!/usr/bin/env python3
"""Embed the reviewed Cologne south-tower JPEG at native pixels in a PDF."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import fitz
from PIL import Image


SOURCE = Path("sources/floorplans/cologne-south-tower-access-plan-2009.jpg")
OUTPUT = Path("sources/floorplans/cologne-south-tower-access-plan-2009-review.pdf")
EXPECTED_SOURCE_SHA256 = "bfcf3a34027b10e1492f61186f094bc1d724d6841dba79b4b903ba04cfc77657"
EXPECTED_SIZE = (450, 459)
EXPECTED_TRAILER_ID = "[<C2841E101F4630C38F1CC290C3920EC2><195F4E2348770F6B901BA0A219A731CC>]"
EXPECTED_OUTPUT_SHA256 = "7a57a71c2b3888365117b1d6aa70e3e4ca51e201c0312e4f61818fdd28ad14bb"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(root: Path) -> Path:
    source = root / SOURCE
    output_path = root / OUTPUT
    if sha256(source) != EXPECTED_SOURCE_SHA256:
        raise ValueError(f"Unexpected source digest: {source}")

    with Image.open(source) as image:
        if image.size != EXPECTED_SIZE:
            raise ValueError(f"Unexpected source dimensions: {image.size}")
        width, height = image.size

    document = fitz.open()
    page = document.new_page(width=width, height=height)
    page.insert_image(page.rect, filename=str(source))
    document.set_metadata({
        "title": "Cologne Cathedral south tower access, reviewed 2009 orthographic plan",
        "subject": "Exact public JPEG embedded at native 450 x 459 pixels; no resampling, rectification or redrawing.",
    })
    # Pin the original wrapper ID so rebuilding preserves the installed source digest.
    document.xref_set_key(-1, "ID", EXPECTED_TRAILER_ID)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    document.save(output_path, garbage=4, deflate=True, no_new_id=True)
    if sha256(output_path) != EXPECTED_OUTPUT_SHA256:
        raise ValueError(f"Unexpected output digest: {output_path}")
    return output_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    output = build(args.root.resolve())
    print(f"sha256 {sha256(output)}  {output}")


if __name__ == "__main__":
    main()
