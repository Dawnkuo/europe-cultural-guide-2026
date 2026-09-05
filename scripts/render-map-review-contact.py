#!/usr/bin/env python3
"""Create legible browser-map contact sheets without changing source assets."""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument("directory", type=Path)
parser.add_argument("width", type=int)
args = parser.parse_args()
paths = sorted(args.directory.glob(f"*-{args.width}-3d.png"))
tile_w, tile_h = (390, 610) if args.width == 390 else (600, 345)
for start in range(0, len(paths), 9):
    page = Image.new("RGB", (tile_w * 3, tile_h * 3), "#15212a")
    draw = ImageDraw.Draw(page)
    for index, path in enumerate(paths[start:start + 9]):
        image = Image.open(path).convert("RGB")
        image = image.crop((0, 0, image.width, min(image.height, 660 if args.width != 390 else 575)))
        image.thumbnail((tile_w - 12, tile_h - 30))
        x, y = index % 3 * tile_w, index // 3 * tile_h
        draw.text((x + 6, y + 4), path.stem, fill="#e4d39e")
        page.paste(image, (x + 6, y + 24))
    target = args.directory / f"contact-{args.width}-{start // 9}.png"
    page.save(target)
    print(target)
