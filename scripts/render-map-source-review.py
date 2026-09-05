#!/usr/bin/env python3
"""Place each source crop beside its actual browser-rendered floor for review."""

import argparse
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]


def thumbnail(image, width):
    return image.resize((width, round(image.height * width / image.width)))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="+")
    parser.add_argument("--browser", default="work/map-review/browser")
    args = parser.parse_args()
    configs = json.loads((ROOT / "sources/floorplans/extraction.json").read_text())
    configs += [json.loads(path.read_text()) for path in (ROOT / "sources/floorplans/venues").glob("*.json")]
    output = ROOT / "work/map-review/source-browser-review"
    output.mkdir(parents=True, exist_ok=True)
    for slug in args.slugs:
        config = next(item for item in reversed(configs) if item["slug"] == slug)
        files = {"primary": config["file"]}
        files.update({item["id"]: item["file"] for item in config.get("sourceFiles", [])})
        for floor in config["floors"]:
            source = files[floor.get("sourceId", "primary")]
            with fitz.open(ROOT / "sources/floorplans" / source) as document:
                page = document[floor["page"] - 1]
                # Builder coordinates are unrotated native PDF coordinates.
                # Remove only display rotation for the source-side comparison.
                page.set_rotation(0)
                pixels = page.get_pixmap(matrix=fitz.Matrix(3, 3), clip=fitz.Rect(floor["crop"]))
                raw = Image.frombytes("RGB", (pixels.width, pixels.height), pixels.samples)
            screenshot = ROOT / args.browser / f"{slug}-1440-{floor['id']}-2d.png"
            actual = Image.open(screenshot).convert("RGB")
            raw, actual = thumbnail(raw, 680), thumbnail(actual, 680)
            canvas = Image.new("RGB", (1390, max(raw.height, actual.height) + 60), "#eeeeee")
            draw = ImageDraw.Draw(canvas)
            draw.text((10, 10), f"{slug} / {floor['id']} / source p{floor['page']}", fill="black")
            draw.text((710, 10), "Actual browser 2D / 1440", fill="black")
            canvas.paste(raw, (10, 40))
            canvas.paste(actual, (700, 40))
            destination = output / f"{slug}-{floor['id']}.png"
            canvas.save(destination)
            print(destination.relative_to(ROOT))


if __name__ == "__main__":
    main()
