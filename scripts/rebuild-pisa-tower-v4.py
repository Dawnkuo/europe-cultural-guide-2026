#!/usr/bin/env python3
"""Build a source-pixel-only semantic layer for Goodyear sheet 4."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources/floorplans"
DERIVED = SOURCES / "derived"
QA = ROOT / "qa/tower-v4"
SOURCE = SOURCES / "tower-goodyear-1071.jpg"
SOURCE_CROP = (25, 115, 940, 1100)
CENTER = (470, 476)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def polar_fields(shape: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.ogrid[:shape[0], :shape[1]]
    radius = np.hypot(xx - CENTER[0], yy - CENTER[1])
    angle = (np.degrees(np.arctan2(yy - CENTER[1], xx - CENTER[0])) + 360) % 360
    return radius, angle


def angle_distance(left: float, right: float) -> float:
    return abs((left - right + 180) % 360 - 180)


def source_column_pixels(
    gray: np.ndarray,
    source_ink: np.ndarray,
) -> tuple[np.ndarray, list[dict]]:
    """Select source pixels in independently detected column windows."""
    circles = cv2.HoughCircles(
        cv2.GaussianBlur(gray, (3, 3), 0.8),
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=22,
        param1=100,
        param2=22,
        minRadius=7,
        maxRadius=21,
    )
    candidates = []
    if circles is not None:
        for x, y, detected_radius in np.round(circles[0]).astype(int):
            distance = math.hypot(x - CENTER[0], y - CENTER[1])
            angle = (math.degrees(math.atan2(y - CENTER[1], x - CENTER[0])) + 360) % 360
            if abs(distance - 413) <= 24:
                candidates.append((x, y, detected_radius, distance, angle))

    selected = []
    used = set()
    for step in range(30):
        expected = (5.5 + step * 12) % 360
        ranked = sorted(
            (
                angle_distance(item[4], expected) + abs(item[3] - 413) / 12,
                index,
                item,
            )
            for index, item in enumerate(candidates)
            if index not in used and angle_distance(item[4], expected) <= 4.5
        )
        if not ranked:
            raise ValueError(f"No source column detected near angle {expected:.1f}")
        _, index, item = ranked[0]
        used.add(index)
        selected.append(item)

    output = np.zeros_like(source_ink, np.uint8)
    records = []
    height, width = source_ink.shape
    for x, y, detected_radius, distance, angle in selected:
        # This is a classifier window only. Detected circle and line corridors
        # select the member's source ink; they do not become emitted geometry.
        half = 23
        x0, x1 = max(0, x - half), min(width, x + half + 1)
        y0, y1 = max(0, y - half), min(height, y + half + 1)
        yy, xx = np.ogrid[y0:y1, x0:x1]
        local_radius = np.hypot(xx - x, yy - y)
        circle_region = np.abs(local_radius - detected_radius) <= 3.5

        local_gray = gray[y0:y1, x0:x1]
        line_corridors = np.zeros_like(local_gray, np.uint8)
        detector = cv2.createLineSegmentDetector(cv2.LSD_REFINE_ADV)
        local_lines = detector.detect(local_gray)[0]
        for segment in [] if local_lines is None else local_lines[:, 0]:
            lx1, ly1, lx2, ly2 = map(float, segment)
            length = math.hypot(lx2 - lx1, ly2 - ly1)
            midpoint_radius = math.hypot(
                (lx1 + lx2) / 2 + x0 - x,
                (ly1 + ly2) / 2 + y0 - y,
            )
            if length < 8 or not 11 <= midpoint_radius <= 23:
                continue
            cv2.line(
                line_corridors,
                (round(lx1), round(ly1)),
                (round(lx2), round(ly2)),
                1,
                2,
                cv2.LINE_8,
            )
        member_region = circle_region | (line_corridors > 0)
        output[y0:y1, x0:x1] |= (
            (source_ink[y0:y1, x0:x1] > 0) & member_region
        ).astype(np.uint8)
        records.append({
            "center": [int(x), int(y)],
            "detectedRadius": int(detected_radius),
            "classifierWindow": [int(x0), int(y0), int(x1), int(y1)],
            "centerRadius": round(float(distance), 2),
            "centerAngle": round(float(angle), 2),
        })
    return output, records


def source_circular_pixels(
    source_ink: np.ndarray,
    radial_ranges: list[tuple[int, int]],
    minimum_angular_samples: int,
) -> np.ndarray:
    """Find long circular traces, then return only their original pixels."""
    maximum_radius = 470
    polar = cv2.warpPolar(
        (source_ink * 255).astype(np.uint8),
        (maximum_radius, 3600),
        CENTER,
        maximum_radius,
        cv2.WARP_POLAR_LINEAR + cv2.WARP_FILL_OUTLIERS,
    )
    zone = np.zeros_like(polar)
    for start, end in radial_ranges:
        zone[:, start:end + 1] = polar[:, start:end + 1]
    long_arcs = cv2.morphologyEx(
        zone,
        cv2.MORPH_OPEN,
        np.ones((minimum_angular_samples, 1), np.uint8),
    )
    cartesian = cv2.warpPolar(
        long_arcs,
        (source_ink.shape[1], source_ink.shape[0]),
        CENTER,
        maximum_radius,
        cv2.WARP_POLAR_LINEAR + cv2.WARP_INVERSE_MAP + cv2.WARP_FILL_OUTLIERS,
    )
    return ((cartesian > 0) & (source_ink > 0)).astype(np.uint8)


def source_radial_treads(gray: np.ndarray, source_ink: np.ndarray) -> tuple[np.ndarray, int]:
    """Use detected line corridors only to select original tread pixels."""
    detector = cv2.createLineSegmentDetector(cv2.LSD_REFINE_ADV)
    detected = detector.detect(gray)[0]
    corridor = np.zeros_like(source_ink, np.uint8)
    accepted = 0
    for segment in [] if detected is None else detected[:, 0]:
        x1, y1, x2, y2 = map(float, segment)
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy)
        r1 = math.hypot(x1 - CENTER[0], y1 - CENTER[1])
        r2 = math.hypot(x2 - CENTER[0], y2 - CENTER[1])
        mean_radius = (r1 + r2) / 2
        center_distance = abs(
            dx * (CENTER[1] - y1) - dy * (CENTER[0] - x1)
        ) / max(length, 1)
        if not 220 <= mean_radius <= 365:
            continue
        if abs(r2 - r1) < 24 or not 24 <= length <= 150:
            continue
        if center_distance > 8:
            continue
        cv2.line(
            corridor,
            (round(x1), round(y1)),
            (round(x2), round(y2)),
            1,
            3,
            cv2.LINE_8,
        )
        accepted += 1
    return ((corridor > 0) & (source_ink > 0)).astype(np.uint8), accepted


def source_tangential_stair_edges(source_ink: np.ndarray) -> np.ndarray:
    """Detect long source arcs in polar space, then retain source pixels only."""
    maximum_radius = 470
    polar = cv2.warpPolar(
        (source_ink * 255).astype(np.uint8),
        (maximum_radius, 3600),
        CENTER,
        maximum_radius,
        cv2.WARP_POLAR_LINEAR + cv2.WARP_FILL_OUTLIERS,
    )
    zone = np.zeros_like(polar)
    zone[:, 220:366] = polar[:, 220:366]
    long_arcs = cv2.morphologyEx(zone, cv2.MORPH_OPEN, np.ones((45, 1), np.uint8))
    cartesian = cv2.warpPolar(
        long_arcs,
        (source_ink.shape[1], source_ink.shape[0]),
        CENTER,
        maximum_radius,
        cv2.WARP_POLAR_LINEAR + cv2.WARP_INVERSE_MAP + cv2.WARP_FILL_OUTLIERS,
    )
    return ((cartesian > 0) & (source_ink > 0)).astype(np.uint8)


def classify() -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    image = np.asarray(Image.open(SOURCE).convert("RGB"))
    x0, y0, x1, y1 = SOURCE_CROP
    crop = image[y0:y1, x0:x1]
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    source_ink = (gray < 190).astype(np.uint8)
    walls = source_circular_pixels(
        source_ink,
        radial_ranges=[(208, 223), (440, 464)],
        minimum_angular_samples=70,
    )

    columns, column_records = source_column_pixels(gray, source_ink)
    walls |= columns

    # Two labels physically overlap classifier windows. Remove only the
    # reviewed glyph-side pixels; obscured member geometry stays unknown.
    walls[39:86, 437:457] = 0  # "160th step" beside the north member.
    walls[493:550, 33:43] = 0  # Station G beside the west member.

    radial_treads, radial_segment_count = source_radial_treads(gray, source_ink)
    tangential_edges = source_tangential_stair_edges(source_ink)
    stairs = radial_treads | tangential_edges
    stairs[walls > 0] = 0

    if np.any((walls > 0) & (source_ink == 0)):
        raise AssertionError("Wall classification created non-source pixels")
    if np.any((stairs > 0) & (source_ink == 0)):
        raise AssertionError("Stair classification created non-source pixels")
    if np.any((walls > 0) & (stairs > 0)):
        raise AssertionError("Wall and stair classifications overlap")

    audit = {
        "source": str(SOURCE.relative_to(ROOT)),
        "sourceSha256": digest(SOURCE),
        "crop": list(SOURCE_CROP),
        "threshold": "grayscale < 190",
        "sourceInkPixels": int(np.count_nonzero(source_ink)),
        "wallPixels": int(np.count_nonzero(walls)),
        "stairPixels": int(np.count_nonzero(stairs)),
        "excludedPixels": int(np.count_nonzero(source_ink & ~(walls | stairs))),
        "radialTreadSegments": radial_segment_count,
        "columns": column_records,
        "sourcePixelSubset": True,
        "syntheticWallOrColumnPixels": 0,
        "filledContours": 0,
    }
    return crop, walls, stairs, audit


def write_semantic_pdf(walls: np.ndarray, stairs: np.ndarray) -> Path:
    DERIVED.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    rgb = np.full((*walls.shape, 3), 255, np.uint8)
    rgb[stairs > 0] = (128, 128, 128)
    rgb[walls > 0] = (0, 0, 0)
    png = QA / "leaning-tower-goodyear-galleries-4-7-v4.png"
    Image.fromarray(rgb).save(png, compress_level=9)

    output = DERIVED / "leaning-tower-goodyear-galleries-4-7-v4.pdf"
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=walls.shape[1], height=walls.shape[0])
    page.insert_image(page.rect, filename=str(png))
    document.save(output, deflate=True, no_new_id=True)
    document.close()
    return output


def derive() -> None:
    crop, walls, stairs, audit = classify()
    output = write_semantic_pdf(walls, stairs)
    audit["derivedFile"] = str(output.relative_to(ROOT))
    audit["derivedSha256"] = digest(output)
    audit["semanticPng"] = str(
        (QA / "leaning-tower-goodyear-galleries-4-7-v4.png").relative_to(ROOT)
    )
    audit["semanticPngSha256"] = digest(
        QA / "leaning-tower-goodyear-galleries-4-7-v4.png"
    )
    (QA / "leaning-tower-goodyear-galleries-4-7-v4-audit.json").write_text(
        json.dumps(audit, indent=2) + "\n"
    )
    Image.fromarray(crop).save(QA / "leaning-tower-goodyear-1071-crop.png")
    print(json.dumps(audit, indent=2))


def load_generator():
    path = ROOT / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_plan_generator", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def load_paint_polygon():
    path = ROOT / "scripts/architectural_preview.py"
    spec = importlib.util.spec_from_file_location("architectural_preview", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module.paint_polygon


def render_corrected_floor() -> Path:
    paint_polygon = load_paint_polygon()
    model = json.loads((ROOT / "app/data/architectural-plans/leaning-tower.json").read_text())
    floor = next(item for item in model["floors"] if item["id"] == "galleries-4-7")
    x0, y0, x1, y1 = floor["bounds"]
    margin = 50
    scale = min(1100 / max(x1 - x0, 1), 780 / max(y1 - y0, 1))
    width = max(360, math.ceil((x1 - x0) * scale + margin * 2))
    height = max(280, math.ceil((y1 - y0) * scale + margin * 2))
    image = Image.new("RGB", (width, height), "#f7f5ef")

    def points(ring):
        return [
            ((point[0] - x0) * scale + margin, (point[1] - y0) * scale + margin)
            for point in ring
        ]

    fills = {"surface": "#e6e1d6", "detail": "#989892", "wall": "#343a40"}
    for feature in floor["features"]:
        for polygon in feature["polygons"]:
            paint_polygon(
                image,
                points(polygon["outer"]),
                [points(ring) for ring in polygon.get("holes", [])],
                fills[feature["kind"]],
            )

    draw = ImageDraw.Draw(image)
    for place in [item for item in model["places"] if item["floorId"] == floor["id"]]:
        px = (place["at"][0] - x0) * scale + margin
        py = (place["at"][1] - y0) * scale + margin
        draw.ellipse((px - 5, py - 5, px + 5, py + 5), fill="#c53b33")
        draw.text((px + 8, py - 7), place["label"], fill="#7d1d18")
    output = QA / "leaning-tower-galleries-4-7-v4-model.png"
    image.save(output, compress_level=9)
    return output


def render_contact() -> Path:
    source = Image.open(QA / "leaning-tower-goodyear-1071-crop.png").convert("RGB")
    semantic = Image.open(QA / "leaning-tower-goodyear-galleries-4-7-v4.png").convert("RGB")
    model = Image.open(QA / "leaning-tower-galleries-4-7-v4-model.png").convert("RGB")
    cell_width, cell_height, label_height = 460, 500, 32
    contact = Image.new("RGB", (cell_width * 3, cell_height + label_height + 44), "white")
    draw = ImageDraw.Draw(contact)
    draw.text(
        (12, 12),
        "SOURCE 1071 | SOURCE-PIXEL CLASSIFICATION | GENERATED MODEL",
        fill="black",
    )
    labels = ["original crop", "black wall / gray stair", "shared-mask preview"]
    for column, (candidate, label) in enumerate(zip([source, semantic, model], labels)):
        fitted = ImageOps.contain(candidate, (cell_width - 16, cell_height - 16))
        left = column * cell_width + (cell_width - fitted.width) // 2
        top = 44 + (cell_height - fitted.height) // 2
        contact.paste(fitted, (left, top))
        draw.text((column * cell_width + 8, 44 + cell_height + 6), label, fill="black")
    output = QA / "leaning-tower-galleries-4-7-v4-contact.png"
    contact.save(output, compress_level=9)
    return output


def build() -> None:
    generator = load_generator()
    config = json.loads((SOURCES / "venues/leaning-tower.json").read_text())
    generator.build(config)
    model_path = ROOT / "app/data/architectural-plans/leaning-tower.json"
    model = json.loads(model_path.read_text())
    for link in model.get("verticalLinks", []):
        if link.get("kind") not in {"stairs", "elevator"} or not link.get("label", "").strip():
            raise AssertionError(f"Invalid vertical link {link.get('id')}")
    render_corrected_floor()
    contact = render_contact()
    print(json.dumps({
        "configSha256": digest(SOURCES / "venues/leaning-tower.json"),
        "modelSha256": digest(model_path),
        "evidenceSha256": digest(SOURCES / "evidence/leaning-tower.json"),
        "contactSha256": digest(contact),
    }, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {"derive", "build"}:
        raise SystemExit("usage: rebuild-pisa-tower-v4.py derive|build")
    if sys.argv[1] == "derive":
        derive()
    else:
        build()
