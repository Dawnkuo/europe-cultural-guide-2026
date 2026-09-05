#!/usr/bin/env python3
"""Build the Pisa Baptistery first-floor v2 from author-published pixels."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans/pisa-baptistery-vr-first-floor.png"
DERIVED = ROOT / "sources/floorplans/derived/pisa-baptistery-first-floor-source-pixels-v2.pdf"
QA = ROOT / "qa/baptistery-upper-v2"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def classify_source() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, list[dict], dict]:
    rgba = np.asarray(Image.open(SOURCE).convert("RGBA"))
    alpha = rgba[:, :, 3:4].astype(np.float32) / 255
    rgb = np.rint(rgba[:, :, :3] * alpha + 255 * (1 - alpha)).astype(np.uint8)
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    raw_ink = gray < 250
    component_count, component_labels, component_stats, _ = cv2.connectedComponentsWithStats(
        raw_ink.astype(np.uint8), 8
    )
    ink = np.zeros_like(raw_ink)
    for component in range(1, component_count):
        if component_stats[component, cv2.CC_STAT_AREA] >= 10:
            ink |= component_labels == component

    center = (265.0, 267.0)
    yy, xx = np.ogrid[:gray.shape[0], :gray.shape[1]]
    radius = np.hypot(xx - center[0], yy - center[1])
    # Opening separates filled masonry from the thin arch, vault and railing
    # strokes. The source intersection is mandatory because morphology is only
    # a classifier and may never add or shift a source pixel.
    opened = cv2.morphologyEx(ink.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)) > 0
    walls = opened & ink

    # The plan shows the lower font and pulpit through the upper central void.
    # They remain source detail but cannot become first-floor masonry.
    walls[radius < 82] = False

    # Twelve source-drawn first-floor support symbols have dark center marks.
    # Expand only the review window, then retain the original ink in it; no
    # ideal circles, squares, or replacement column footprints are drawn.
    dark = ((gray <= 64) & (radius >= 95) & (radius <= 122)).astype(np.uint8)
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(dark, 8)
    columns: list[dict] = []
    for index in range(1, count):
        x, y, width, height, area = [int(value) for value in stats[index]]
        cx, cy = centroids[index]
        if not (20 <= area <= 60 and width <= 10 and height <= 10):
            continue
        x0, y0 = max(0, x - 4), max(0, y - 4)
        x1, y1 = min(gray.shape[1], x + width + 4), min(gray.shape[0], y + height + 4)
        walls[y0:y1, x0:x1] |= ink[y0:y1, x0:x1]
        columns.append({"darkBounds": [x, y, x + width, y + height], "reviewWindow": [x0, y0, x1, y1],
                        "center": [round(float(cx), 2), round(float(cy), 2)]})
    columns.sort(key=lambda item: math.atan2(item["center"][1] - center[1], item["center"][0] - center[0]))
    if len(columns) != 12:
        raise ValueError(f"Expected 12 source support symbols, found {len(columns)}")

    # The paired radial strokes describe arches/vaults above the ambulatory;
    # they do not divide the walkable gallery into wedge-shaped rooms. They
    # stay in the residual detail class. No radial corridor is promoted.
    walls &= ink
    details = ink & ~walls
    if np.any(walls & details) or not np.array_equal(walls | details, ink):
        raise ValueError("Wall/detail classification must be a disjoint partition of source ink")

    # A source-derived floor surface would require a gallery region separated
    # from both the central void and the page exterior by the source ink. Test
    # that topology without closing gaps. All three reviewed seeds belong to
    # one background component, so no annular floor polygon is emitted.
    background_count, background_labels, background_stats, _ = cv2.connectedComponentsWithStats(
        (~ink).astype(np.uint8), 4
    )
    seeds = {
        "outside": [0, 0],
        "gallery": [265, 140],
        "centralVoid": [265, 200],
    }
    seed_components = {
        name: int(background_labels[y, x]) for name, (x, y) in seeds.items()
    }
    surface_audit = {
        "backgroundComponents": int(background_count - 1),
        "seeds": seeds,
        "seedComponents": seed_components,
        "seedComponentAreas": {
            name: int(background_stats[label, cv2.CC_STAT_AREA])
            for name, label in seed_components.items()
        },
        "gallerySeparatedFromExterior": seed_components["gallery"] != seed_components["outside"],
        "centralVoidSeparatedFromGallery": seed_components["centralVoid"] != seed_components["gallery"],
        "sourceSpaceEmitted": False,
        "reason": (
            "Without adding closure pixels, the gallery, central void and exterior seeds share "
            "one white-background component. The source alpha supplies an outer disc but no "
            "separate central-void fill, so an annular floor would require invented closure."
        ),
    }
    return rgb, raw_ink, ink, walls, details, columns, surface_audit


def write_classified_pdf(walls: np.ndarray, details: np.ndarray) -> int:
    QA.mkdir(parents=True, exist_ok=True)
    DERIVED.parent.mkdir(parents=True, exist_ok=True)
    classified = np.full((*walls.shape, 3), 255, np.uint8)
    classified[details] = (128, 128, 128)
    classified[walls] = (0, 0, 0)
    Image.fromarray(classified).save(QA / "pisa-baptistery-first-floor-classified-v2.png", compress_level=9)
    semantic = np.full((*walls.shape, 3), 255, np.uint8)
    semantic[details] = (91, 159, 178)
    semantic[walls] = (33, 31, 28)
    Image.fromarray(semantic).save(QA / "pisa-baptistery-first-floor-semantic-v2.png")

    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=classified.shape[1], height=classified.shape[0])
    page.insert_image(page.rect, stream=(QA / "pisa-baptistery-first-floor-classified-v2.png").read_bytes())
    document.save(DERIVED, deflate=True, no_new_id=True)
    document.close()
    check = fitz.open(DERIVED)
    xref = check[0].get_images(full=True)[0][0]
    check.close()
    return xref


def load_builder():
    path = ROOT / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("pisa_baptistery_builder", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def paint_model() -> Path:
    model = json.loads((ROOT / "app/data/architectural-plans/pisa-baptistery.json").read_text())
    floor = next(item for item in model["floors"] if item["id"] == "upper")
    width = height = 620
    margin = 35
    x0, y0, x1, y1 = floor["bounds"]
    scale = min((width - 2 * margin) / (x1 - x0), (height - 2 * margin) / (y1 - y0))
    ox = (width - (x1 - x0) * scale) / 2 - x0 * scale
    oy = (height - (y1 - y0) * scale) / 2 - y0 * scale
    image = Image.new("RGB", (width, height), "white")
    preview_path = ROOT / "scripts/architectural_preview.py"
    spec = importlib.util.spec_from_file_location("architectural_preview", preview_path)
    preview = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(preview)
    colors = {"surface": "#eee9df", "detail": "#5b9fb2", "wall": "#211f1c"}
    for feature in floor["features"]:
        for polygon in feature["polygons"]:
            outer = [(round(x * scale + ox), round(y * scale + oy)) for x, y in polygon["outer"]]
            holes = [[(round(x * scale + ox), round(y * scale + oy)) for x, y in ring]
                     for ring in polygon.get("holes", [])]
            preview.paint_polygon(image, outer, holes, colors[feature["kind"]])
    output = QA / "pisa-baptistery-first-floor-model-v2.png"
    image.save(output)
    return output


def write_contact(source: np.ndarray, model_path: Path) -> Path:
    classified = Image.open(QA / "pisa-baptistery-first-floor-semantic-v2.png").convert("RGB")
    panels = [Image.fromarray(source), classified, Image.open(model_path).convert("RGB")]
    labels = ["DIRECT AUTHOR MAP", "SOURCE PIXELS: WALL BLACK / DETAIL BLUE", "GENERATED MODEL"]
    canvas = Image.new("RGB", (3 * 620, 680), "white")
    draw = ImageDraw.Draw(canvas)
    for index, (panel, label) in enumerate(zip(panels, labels)):
        panel.thumbnail((580, 600), Image.Resampling.LANCZOS)
        x = index * 620 + (620 - panel.width) // 2
        y = 55 + (600 - panel.height) // 2
        canvas.paste(panel, (x, y))
        draw.text((index * 620 + 20, 18), label, fill="#171717")
    output = QA / "pisa-baptistery-first-floor-contact-v2.png"
    canvas.save(output)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--derive-only", action="store_true")
    args = parser.parse_args()
    source, raw_ink, retained_ink, walls, details, columns, surface_audit = classify_source()
    QA.mkdir(parents=True, exist_ok=True)
    Image.fromarray(source).save(QA / "pisa-baptistery-first-floor-source-v2.png")
    xref = write_classified_pdf(walls, details)
    audit = {
        "sourceFile": str(SOURCE.relative_to(ROOT)),
        "sourceSha256": digest(SOURCE),
        "derivedFile": str(DERIVED.relative_to(ROOT)),
        "derivedSha256": digest(DERIVED),
        "imageXref": xref,
        "sourceInkPixels": int(np.count_nonzero(raw_ink)),
        "retainedArchitecturalPixels": int(np.count_nonzero(retained_ink)),
        "wallPixels": int(np.count_nonzero(walls)),
        "detailPixels": int(np.count_nonzero(details)),
        "excludedGlyphOrNoisePixels": int(np.count_nonzero(raw_ink & ~retained_ink)),
        "outsideSourcePixels": int(np.count_nonzero(walls & ~raw_ink)),
        "unclassifiedRetainedPixels": int(np.count_nonzero(retained_ink & ~(walls | details))),
        "detectedSourceSupports": columns,
        "radialArchVaultPixels": "flat detail; none promoted by angle corridors",
        "surfaceBoundaryAudit": surface_audit,
        "classification": "source pixels only; filled outer masonry and actual support-symbol ink are walls; radial arch/vault strokes, railings and lower-level references are flat detail; no ideal circles, replacement columns, contour fills, or floor fills",
    }
    (QA / "pisa-baptistery-first-floor-audit-v2.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n"
    )
    print(json.dumps(audit, ensure_ascii=False, indent=2))
    if args.derive_only:
        return
    config = json.loads((ROOT / "sources/floorplans/venues/pisa-baptistery.json").read_text())
    if config["sourceFiles"][-1]["sha256"] != audit["derivedSha256"]:
        raise ValueError("Derived first-floor PDF digest does not match the reviewed config")
    load_builder().build(config)
    contact = write_contact(source, paint_model())
    print("contact", digest(contact))


if __name__ == "__main__":
    main()
