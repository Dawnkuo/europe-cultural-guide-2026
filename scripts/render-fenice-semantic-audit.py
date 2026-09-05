#!/usr/bin/env python3
"""Render reproducible Fenice source/model semantic comparison images."""

import importlib.util
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "sources/floorplans/venues/fenice.json"
MODEL_PATH = ROOT / "app/data/architectural-plans/fenice.json"
SHARED_PREVIEW = ROOT / "scripts/architectural_preview.py"
SOURCE_OUT = ROOT / "work/fenice-semantic-audit"
MODEL_OUT = ROOT / "work/rendered/models-semantic"


def load_preview_module():
    spec = importlib.util.spec_from_file_location("architectural_preview", SHARED_PREVIEW)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def source_files(config):
    records = {"primary": config["file"]}
    records.update({record["id"]: record["file"] for record in config.get("sourceFiles", [])})
    return records


def source_to_pixel(point, inverse, width, height):
    normalized = fitz.Point(*point) * inverse
    return (round(normalized.x * width), round(normalized.y * height))


def render_source_overlay(config, model, floor, preview):
    floor_spec = next(item for item in config["floors"] if item["id"] == floor["id"])
    raster = floor_spec["rasterLayers"][0]
    file_name = source_files(config)[floor_spec.get("sourceId", "primary")]
    document = fitz.open(ROOT / "sources/floorplans" / file_name)
    page = document[floor_spec["page"] - 1]
    pixmap = fitz.Pixmap(document, raster["xref"])
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    source = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    source = Image.blend(source, Image.new("RGB", source.size, "white"), 0.58).convert("RGBA")
    matrix = page.get_image_rects(raster["xref"], transform=True)[raster.get("occurrence", 0)][1]
    inverse = ~matrix
    origin = floor_spec["crop"][:2]
    overlay = Image.new("RGBA", source.size, (0, 0, 0, 0))

    def points(ring):
        return [
            source_to_pixel((x + origin[0], y + origin[1]), inverse, pixmap.width, pixmap.height)
            for x, y in ring
        ]

    for kind, color in (("detail", (31, 102, 192, 165)), ("wall", (218, 56, 50, 175))):
        for feature in floor["features"]:
            if feature["kind"] != kind:
                continue
            for polygon in feature["polygons"]:
                preview.paint_polygon(
                    overlay,
                    points(polygon["outer"]),
                    [points(ring) for ring in polygon.get("holes", [])],
                    color,
                )

    reviewed = Image.alpha_composite(source, overlay)
    reviewed.save(SOURCE_OUT / f"{floor['id']}-source-semantic-overlay.png")
    grid = reviewed.copy()
    draw = ImageDraw.Draw(grid)
    x0, y0, x1, y1 = floor_spec["crop"]
    first_x = int(x0 // 25 + 1) * 25
    first_y = int(y0 // 25 + 1) * 25
    for x in range(first_x, int(x1) + 1, 25):
        px, _ = source_to_pixel((x, y0), inverse, pixmap.width, pixmap.height)
        draw.line((px, 0, px, pixmap.height), fill=(255, 45, 45, 150), width=1)
        draw.text((px + 2, 2), str(x), fill=(255, 45, 45, 255))
    for y in range(first_y, int(y1) + 1, 25):
        _, py = source_to_pixel((x0, y), inverse, pixmap.width, pixmap.height)
        draw.line((0, py, pixmap.width, py), fill=(255, 45, 45, 150), width=1)
        draw.text((2, py + 2), str(y), fill=(255, 45, 45, 255))
    grid.save(SOURCE_OUT / f"{floor['id']}-source-semantic-overlay-grid.png")

    masks = source.copy()
    mask_draw = ImageDraw.Draw(masks, "RGBA")
    for prefix, key, color in (
        ("X", "excludeRects", (255, 0, 0, 46)),
        ("F", "flatRects", (0, 120, 255, 46)),
    ):
        for index, record in enumerate(raster.get(key, [])):
            left = source_to_pixel(record["rect"][:2], inverse, pixmap.width, pixmap.height)
            right = source_to_pixel(record["rect"][2:], inverse, pixmap.width, pixmap.height)
            mask_draw.rectangle((*left, *right), fill=color, outline=color[:3] + (210,), width=1)
            mask_draw.text((left[0] + 2, left[1] + 2), f"{prefix}{index}", fill=color[:3] + (255,))
    masks.save(SOURCE_OUT / f"{floor['id']}-review-masks.png")


def render_model(floor, preview):
    width = height = 768
    pad = 20
    x0, y0, x1, y1 = floor["bounds"]
    scale = min((width - 2 * pad) / (x1 - x0), (height - 2 * pad) / (y1 - y0))
    image = Image.new("RGB", (width, height), (250, 249, 247))

    def points(ring):
        return [
            (round(pad + (x - x0) * scale), round(pad + (y - y0) * scale))
            for x, y in ring
        ]

    for kind, color in (
        ("surface", (232, 228, 217)),
        ("detail", (152, 145, 132)),
        ("wall", (30, 30, 27)),
    ):
        for feature in floor["features"]:
            if feature["kind"] != kind:
                continue
            for polygon in feature["polygons"]:
                preview.paint_polygon(
                    image,
                    points(polygon["outer"]),
                    [points(ring) for ring in polygon.get("holes", [])],
                    color,
                )
    image.save(MODEL_OUT / f"fenice-{floor['id']}.png")


def main():
    SOURCE_OUT.mkdir(parents=True, exist_ok=True)
    MODEL_OUT.mkdir(parents=True, exist_ok=True)
    config = json.loads(CONFIG_PATH.read_text())
    model = json.loads(MODEL_PATH.read_text())
    preview = load_preview_module()
    for floor in model["floors"]:
        if floor["id"] not in {"foyer", "auditorium", "apollinee"}:
            continue
        render_source_overlay(config, model, floor, preview)
        render_model(floor, preview)
    print("fenice semantic audit images rendered")


if __name__ == "__main__":
    main()
