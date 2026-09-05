#!/usr/bin/env python3
"""Source-pixel-only semantic extraction for the remaining Goodyear sheets."""

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
from PIL import Image, ImageDraw, ImageOps


PROFILES = {
    "entry-first": {
        "filename": "tower-goodyear-1069.jpg",
        "crop": (30, 90, 940, 1090),
        "center": (454, 470),
        "wallCircles": [(174, 187), (416, 452)],
        "wallArcSamples": 60,
        "wallProfile": (325, 416),
        "wallProfileArcSamples": 38,
        "wallProfileRadialPixels": 13,
        "stairRange": (180, 335),
        "stairSpan": 22,
        "stairArcSamples": 60,
        "detailRegions": [
            {"radialRange": (360, 415), "angles": [(82, 98)]},
        ],
        "glyphRegions": [
            (180, 95, 225, 155),
            (340, 15, 390, 70),
            (460, 20, 515, 80),
            (835, 345, 910, 435),
            (0, 480, 55, 555),
            (315, 785, 360, 835),
            (345, 730, 390, 780),
            (360, 690, 405, 735),
            (375, 635, 420, 680),
            (388, 595, 430, 640),
            (585, 570, 780, 725),
            (380, 685, 510, 760),
            (260, 380, 700, 500),
        ],
    },
    "galleries-1-3": {
        "filename": "tower-goodyear-1070.jpg",
        "crop": (25, 95, 940, 1100),
        "center": (469, 501),
        "wallCircles": [(219, 232), (431, 458)],
        "wallArcSamples": 70,
        "columns": {
            "radius": 409,
            "angleOffset": 5.5,
            "count": 30,
            "excludedSlots": [53.5, 197.5, 245.5, 293.5],
        },
        "stairRange": (190, 365),
        "stairSpan": 22,
        "stairArcSamples": 42,
        "detailRects": [(720, 420, 805, 610)],
        "glyphRegions": [
            (345, 40, 400, 105),
            (835, 245, 915, 335),
            (0, 535, 55, 620),
            (535, 900, 600, 965),
        ],
    },
    "upper": {
        "filename": "tower-goodyear-1073.jpg",
        "crop": (25, 95, 940, 1100),
        "center": (453, 476),
        "wallCircles": [(201, 215), (421, 445)],
        "wallArcSamples": 70,
        "columns": {"radius": 406, "angleOffset": 5, "count": 30},
        "wallProfile": (195, 355),
        "wallProfileArcSamples": 34,
        "wallProfileRadialPixels": 16,
        "wallProfileAngles": [(207, 278), (288, 343), (145, 204), (96, 145), (25, 52)],
        "stairRange": (180, 350),
        "stairSpan": 18,
        "stairArcSamples": 34,
        "stairAngles": [(343, 25), (50, 100)],
        "detailRegions": [
            {"radialRange": (195, 355), "angles": [(207, 278), (288, 343), (145, 204), (96, 145), (25, 52)]},
        ],
        "localDetail": {"center": (278, 690), "radius": 52},
        "glyphRegions": [
            (820, 340, 915, 445),
            (155, 735, 235, 825),
            (410, 855, 505, 945),
            (630, 290, 815, 410),
            (650, 390, 830, 650),
            (420, 620, 740, 850),
            (260, 380, 650, 560),
        ],
    },
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def angular_mask(angle: np.ndarray, ranges: list[tuple[int, int]] | None) -> np.ndarray:
    if not ranges:
        return np.ones_like(angle, bool)
    output = np.zeros_like(angle, bool)
    for start, end in ranges:
        if start <= end:
            output |= (angle >= start) & (angle <= end)
        else:
            output |= (angle >= start) | (angle <= end)
    return output


def polar_fields(shape: tuple[int, int], center: tuple[int, int]) -> tuple[np.ndarray, np.ndarray]:
    yy, xx = np.ogrid[:shape[0], :shape[1]]
    radius = np.hypot(xx - center[0], yy - center[1])
    angle = (np.degrees(np.arctan2(yy - center[1], xx - center[0])) + 360) % 360
    return radius, angle


def source_polar_lines(
    source_ink: np.ndarray,
    center: tuple[int, int],
    radial_range: tuple[int, int],
    arc_samples: int,
    radial_pixels: int | None = None,
    angle_ranges: list[tuple[int, int]] | None = None,
) -> np.ndarray:
    """Detect polar line families and return their original source pixels only."""
    maximum_radius = math.ceil(math.hypot(*source_ink.shape))
    polar = cv2.warpPolar(
        (source_ink * 255).astype(np.uint8),
        (maximum_radius, 3600),
        center,
        maximum_radius,
        cv2.WARP_POLAR_LINEAR + cv2.WARP_FILL_OUTLIERS,
    )
    zone = np.zeros_like(polar)
    start, end = radial_range
    zone[:, start:end + 1] = polar[:, start:end + 1]
    retained = cv2.morphologyEx(zone, cv2.MORPH_OPEN, np.ones((arc_samples, 1), np.uint8))
    if radial_pixels:
        retained |= cv2.morphologyEx(
            zone,
            cv2.MORPH_OPEN,
            np.ones((1, radial_pixels), np.uint8),
        )
    cartesian = cv2.warpPolar(
        retained,
        (source_ink.shape[1], source_ink.shape[0]),
        center,
        maximum_radius,
        cv2.WARP_POLAR_LINEAR + cv2.WARP_INVERSE_MAP + cv2.WARP_FILL_OUTLIERS,
    )
    candidate = (cartesian > 0) & (source_ink > 0)
    if angle_ranges:
        _, angle = polar_fields(source_ink.shape, center)
        candidate &= angular_mask(angle, angle_ranges)
    return candidate.astype(np.uint8)


def angle_distance(left: float, right: float) -> float:
    return abs((left - right + 180) % 360 - 180)


def source_columns(
    gray: np.ndarray,
    source_ink: np.ndarray,
    center: tuple[int, int],
    expected_radius: float,
    angle_offset: float,
    expected_count: int,
    excluded_slots: list[float] | None = None,
) -> tuple[np.ndarray, list[dict], list[float]]:
    """Classify actual member ink around independently detected centers."""
    circles = cv2.HoughCircles(
        cv2.GaussianBlur(gray, (3, 3), 0.8),
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=20,
        param1=100,
        param2=20,
        minRadius=6,
        maxRadius=22,
    )
    candidates = []
    if circles is not None:
        for x, y, detected_radius in np.round(circles[0]).astype(int):
            distance = math.hypot(x - center[0], y - center[1])
            angle = (math.degrees(math.atan2(y - center[1], x - center[0])) + 360) % 360
            if abs(distance - expected_radius) <= 25:
                half = 25
                x0, x1 = max(0, x - half), min(gray.shape[1], x + half + 1)
                y0, y1 = max(0, y - half), min(gray.shape[0], y + half + 1)
                yy, xx = np.ogrid[y0:y1, x0:x1]
                local_radius = np.hypot(xx - x, yy - y)
                local_angle = (np.degrees(np.arctan2(yy - y, xx - x)) + 360) % 360
                annular_ink = (
                    (np.abs(local_radius - detected_radius) <= 3.5)
                    & (source_ink[y0:y1, x0:x1] > 0)
                )
                angular_bins = len(set((local_angle[annular_ink] // 15).astype(int).tolist()))
                candidates.append((x, y, detected_radius, distance, angle, angular_bins))

    selected = []
    used = set()
    missing_angles = []
    step_angle = 360 / expected_count
    for step in range(expected_count):
        expected = (angle_offset + step * step_angle) % 360
        if excluded_slots and any(angle_distance(expected, item) < 1 for item in excluded_slots):
            missing_angles.append(round(expected, 2))
            continue
        ranked = sorted(
            (
                angle_distance(item[4], expected) + abs(item[3] - expected_radius) / 12,
                index,
                item,
            )
            for index, item in enumerate(candidates)
            if index not in used and angle_distance(item[4], expected) <= 5
        )
        if not ranked:
            missing_angles.append(round(expected, 2))
            continue
        _, index, item = ranked[0]
        used.add(index)
        selected.append(item)

    output = np.zeros_like(source_ink, np.uint8)
    records = []
    height, width = source_ink.shape
    detector = cv2.createLineSegmentDetector(cv2.LSD_REFINE_ADV)
    for x, y, detected_radius, distance, angle, angular_bins in selected:
        half = 24
        x0, x1 = max(0, x - half), min(width, x + half + 1)
        y0, y1 = max(0, y - half), min(height, y + half + 1)
        yy, xx = np.ogrid[y0:y1, x0:x1]
        local_radius = np.hypot(xx - x, yy - y)
        circle_region = np.abs(local_radius - detected_radius) <= 3.5
        local_angle = (np.degrees(np.arctan2(yy - y, xx - x)) + 360) % 360
        local_gray = gray[y0:y1, x0:x1]
        corridors = np.zeros_like(local_gray, np.uint8)
        local_lines = detector.detect(local_gray)[0]
        tangent_segments = 0
        for segment in [] if local_lines is None else local_lines[:, 0]:
            lx1, ly1, lx2, ly2 = map(float, segment)
            length = math.hypot(lx2 - lx1, ly2 - ly1)
            midpoint_x = (lx1 + lx2) / 2 + x0 - x
            midpoint_y = (ly1 + ly2) / 2 + y0 - y
            midpoint_radius = math.hypot(midpoint_x, midpoint_y)
            tangent_error = abs(
                (lx2 - lx1) * midpoint_x + (ly2 - ly1) * midpoint_y
            ) / max(length * midpoint_radius, 1)
            if length < 8 or not max(5, detected_radius * 0.7) <= midpoint_radius <= detected_radius + 12:
                continue
            if tangent_error > 0.42:
                continue
            cv2.line(
                corridors,
                (round(lx1), round(ly1)),
                (round(lx2), round(ly2)),
                1,
                2,
                cv2.LINE_8,
            )
            tangent_segments += 1
        if tangent_segments < 5:
            corridors[:] = 0
        member_region = circle_region | (corridors > 0)
        local_member = (
            (source_ink[y0:y1, x0:x1] > 0) & member_region
        ).astype(np.uint8)
        output[y0:y1, x0:x1] |= local_member
        annular_ink = (source_ink[y0:y1, x0:x1] > 0) & circle_region
        records.append({
            "center": [int(x), int(y)],
            "detectedRadius": int(detected_radius),
            "classifierWindow": [int(x0), int(y0), int(x1), int(y1)],
            "centerRadius": round(float(distance), 2),
            "centerAngle": round(float(angle), 2),
            "annularAngularBins": angular_bins,
            "tangentSegments": tangent_segments,
            "sourceMemberPixels": int(np.count_nonzero(local_member)),
        })
    return output, records, missing_angles


def source_radial_treads(
    gray: np.ndarray,
    source_ink: np.ndarray,
    center: tuple[int, int],
    radial_range: tuple[int, int],
    minimum_span: float,
    angle_ranges: list[tuple[int, int]] | None = None,
) -> tuple[np.ndarray, int]:
    """Use line corridors only to select original radial tread pixels."""
    detector = cv2.createLineSegmentDetector(cv2.LSD_REFINE_ADV)
    detected = detector.detect(gray)[0]
    corridor = np.zeros_like(source_ink, np.uint8)
    accepted = 0
    for segment in [] if detected is None else detected[:, 0]:
        x1, y1, x2, y2 = map(float, segment)
        dx, dy = x2 - x1, y2 - y1
        length = math.hypot(dx, dy)
        r1 = math.hypot(x1 - center[0], y1 - center[1])
        r2 = math.hypot(x2 - center[0], y2 - center[1])
        mean_radius = (r1 + r2) / 2
        mean_angle = (
            math.degrees(math.atan2((y1 + y2) / 2 - center[1], (x1 + x2) / 2 - center[0]))
            + 360
        ) % 360
        center_distance = abs(dx * (center[1] - y1) - dy * (center[0] - x1)) / max(length, 1)
        if not radial_range[0] <= mean_radius <= radial_range[1]:
            continue
        if abs(r2 - r1) < minimum_span or not minimum_span <= length <= 170:
            continue
        if center_distance > 9:
            continue
        if angle_ranges and not any(
            start <= mean_angle <= end if start <= end else mean_angle >= start or mean_angle <= end
            for start, end in angle_ranges
        ):
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


def isolated_components(source_ink: np.ndarray, regions: list[tuple[int, int, int, int]]) -> np.ndarray:
    """Return only source components wholly contained by reviewed glyph regions."""
    output = np.zeros_like(source_ink, np.uint8)
    for x0, y0, x1, y1 in regions:
        roi = source_ink[y0:y1, x0:x1]
        count, labels, stats, _ = cv2.connectedComponentsWithStats(roi, 8)
        for component in range(1, count):
            left, top, width, height, area = stats[component]
            if area < 4:
                continue
            if max(width, height) > 38 or area > 450:
                continue
            if left == 0 or top == 0 or left + width == roi.shape[1] or top + height == roi.shape[0]:
                continue
            output[y0:y1, x0:x1][labels == component] = 1
    return output


def classify(root: Path, profile_name: str) -> tuple[np.ndarray, np.ndarray, np.ndarray, dict]:
    profile = PROFILES[profile_name]
    source = root / "sources/floorplans" / profile["filename"]
    image = np.asarray(Image.open(source).convert("RGB"))
    x0, y0, x1, y1 = profile["crop"]
    crop = image[y0:y1, x0:x1]
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    source_ink = (gray < 190).astype(np.uint8)
    center = profile["center"]

    walls = np.zeros_like(source_ink)
    for radial_range in profile["wallCircles"]:
        walls |= source_polar_lines(
            source_ink,
            center,
            radial_range,
            profile["wallArcSamples"],
        )

    if profile.get("wallProfile"):
        walls |= source_polar_lines(
            source_ink,
            center,
            profile["wallProfile"],
            profile["wallProfileArcSamples"],
            profile["wallProfileRadialPixels"],
            profile.get("wallProfileAngles"),
        )

    column_records = []
    missing_column_angles = []
    if profile.get("columns"):
        spec = profile["columns"]
        columns, column_records, missing_column_angles = source_columns(
            gray,
            source_ink,
            center,
            spec["radius"],
            spec["angleOffset"],
            spec["count"],
            spec.get("excludedSlots"),
        )
        walls |= columns

    radial_treads, segment_count = source_radial_treads(
        gray,
        source_ink,
        center,
        profile["stairRange"],
        profile["stairSpan"],
        profile.get("stairAngles"),
    )
    stair_arcs = source_polar_lines(
        source_ink,
        center,
        profile["stairRange"],
        profile["stairArcSamples"],
        angle_ranges=profile.get("stairAngles"),
    )
    details = radial_treads | stair_arcs

    radius, angle = polar_fields(source_ink.shape, center)
    for region in profile.get("detailRegions", []):
        start, end = region["radialRange"]
        region_mask = (
            (radius >= start)
            & (radius <= end)
            & angular_mask(angle, region["angles"])
        )
        details |= ((source_ink > 0) & region_mask).astype(np.uint8)

    if profile.get("localDetail"):
        local = profile["localDetail"]
        yy, xx = np.ogrid[:source_ink.shape[0], :source_ink.shape[1]]
        local_mask = (xx - local["center"][0]) ** 2 + (yy - local["center"][1]) ** 2 <= local["radius"] ** 2
        details |= ((source_ink > 0) & local_mask).astype(np.uint8)

    for dx0, dy0, dx1, dy1 in profile.get("detailRects", []):
        details[dy0:dy1, dx0:dx1] |= source_ink[dy0:dy1, dx0:dx1]

    glyphs = isolated_components(source_ink, profile.get("glyphRegions", []))
    classified_glyph_pixels = int(np.count_nonzero(glyphs & ((walls | details) > 0)))
    walls[glyphs > 0] = 0
    details[glyphs > 0] = 0

    details[walls > 0] = 0
    if np.any((walls > 0) & (source_ink == 0)):
        raise AssertionError("Wall classification created non-source pixels")
    if np.any((details > 0) & (source_ink == 0)):
        raise AssertionError("Detail classification created non-source pixels")
    if np.any((walls > 0) & (details > 0)):
        raise AssertionError("Wall and detail classifications overlap")

    audit = {
        "profile": profile_name,
        "source": str(source.relative_to(root)),
        "sourceSha256": digest(source),
        "crop": list(profile["crop"]),
        "threshold": "grayscale < 190",
        "sourceInkPixels": int(np.count_nonzero(source_ink)),
        "wallPixels": int(np.count_nonzero(walls)),
        "detailPixels": int(np.count_nonzero(details)),
        "excludedPixels": int(np.count_nonzero(source_ink & ~(walls | details))),
        "radialTreadSegments": segment_count,
        "columns": column_records,
        "unclassifiedColumnSlots": missing_column_angles,
        "sourcePixelSubset": True,
        "syntheticWallOrColumnPixels": 0,
        "filledContours": 0,
        "glyphPixelsExcludedByComponent": int(np.count_nonzero(glyphs)),
        "classifiedGlyphPixelsRemoved": classified_glyph_pixels,
    }
    return crop, walls, details, audit


def write_semantic(root: Path, profile_name: str) -> dict:
    crop, walls, details, audit = classify(root, profile_name)
    derived = root / "sources/floorplans/derived"
    qa = root / "qa/tower-source-pixels"
    derived.mkdir(parents=True, exist_ok=True)
    qa.mkdir(parents=True, exist_ok=True)
    rgb = np.full((*walls.shape, 3), 255, np.uint8)
    rgb[details > 0] = (128, 128, 128)
    rgb[walls > 0] = (0, 0, 0)
    basename = f"leaning-tower-goodyear-{profile_name}-source-pixels"
    semantic_png = qa / f"{basename}.png"
    source_crop = qa / f"{basename}-source.png"
    Image.fromarray(rgb).save(semantic_png, compress_level=9)
    Image.fromarray(crop).save(source_crop, compress_level=9)

    output = derived / f"{basename}.pdf"
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=walls.shape[1], height=walls.shape[0])
    page.insert_image(page.rect, filename=str(semantic_png))
    document.save(output, deflate=True, no_new_id=True)
    document.close()
    audit.update({
        "derivedFile": str(output.relative_to(root)),
        "derivedSha256": digest(output),
        "semanticPng": str(semantic_png.relative_to(root)),
        "semanticPngSha256": digest(semantic_png),
        "sourceCrop": str(source_crop.relative_to(root)),
        "sourceCropSha256": digest(source_crop),
    })
    audit_path = qa / f"{basename}-audit.json"
    audit_path.write_text(json.dumps(audit, indent=2) + "\n")
    return audit


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def render_floor(root: Path, profile_name: str) -> Path:
    preview = load_module(root / "scripts/architectural_preview.py", "architectural_preview")
    model_path = root / "app/data/architectural-plans/leaning-tower.json"
    model = json.loads(model_path.read_text())
    floor = next(item for item in model["floors"] if item["id"] == profile_name)
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
            preview.paint_polygon(
                image,
                points(polygon["outer"]),
                [points(ring) for ring in polygon.get("holes", [])],
                fills[feature["kind"]],
            )
    draw = ImageDraw.Draw(image)
    for place in [item for item in model["places"] if item["floorId"] == profile_name]:
        px = (place["at"][0] - x0) * scale + margin
        py = (place["at"][1] - y0) * scale + margin
        draw.ellipse((px - 5, py - 5, px + 5, py + 5), fill="#c53b33")
        draw.text((px + 8, py - 7), place["label"], fill="#7d1d18")
    qa = root / "qa/tower-source-pixels"
    output = qa / f"leaning-tower-{profile_name}-source-pixels-model.png"
    image.save(output, compress_level=9)
    return output


def render_contact(root: Path, profile_name: str, model_path: Path) -> Path:
    qa = root / "qa/tower-source-pixels"
    basename = f"leaning-tower-goodyear-{profile_name}-source-pixels"
    source = Image.open(qa / f"{basename}-source.png").convert("RGB")
    semantic = Image.open(qa / f"{basename}.png").convert("RGB")
    model = Image.open(model_path).convert("RGB")
    cell_width, cell_height, label_height = 460, 510, 32
    contact = Image.new("RGB", (cell_width * 3, cell_height + label_height + 44), "white")
    draw = ImageDraw.Draw(contact)
    draw.text((12, 12), "SOURCE | SOURCE-PIXEL CLASSIFICATION | GENERATED MODEL", fill="black")
    labels = ["original crop", "black wall / gray detail", "shared-mask preview"]
    for column, (candidate, label) in enumerate(zip([source, semantic, model], labels)):
        fitted = ImageOps.contain(candidate, (cell_width - 16, cell_height - 16))
        left = column * cell_width + (cell_width - fitted.width) // 2
        top = 44 + (cell_height - fitted.height) // 2
        contact.paste(fitted, (left, top))
        draw.text((column * cell_width + 8, 44 + cell_height + 6), label, fill="black")
    output = qa / f"leaning-tower-{profile_name}-source-pixels-contact.png"
    contact.save(output, compress_level=9)
    return output


def build(root: Path, profile_name: str) -> dict:
    generator = load_module(
        root / "scripts/build-architectural-plans.py",
        "architectural_plan_generator",
    )
    generator.ROOT = root
    config_path = root / "sources/floorplans/venues/leaning-tower.json"
    generator.build(json.loads(config_path.read_text()))
    model_path = root / "app/data/architectural-plans/leaning-tower.json"
    model = json.loads(model_path.read_text())
    for link in model.get("verticalLinks", []):
        if link.get("kind") not in {"stairs", "elevator"} or not link.get("label", "").strip():
            raise AssertionError(f"Invalid vertical link {link.get('id')}")
    rendered = render_floor(root, profile_name)
    contact = render_contact(root, profile_name, rendered)
    return {
        "configSha256": digest(config_path),
        "modelSha256": digest(model_path),
        "evidenceSha256": digest(root / "sources/floorplans/evidence/leaning-tower.json"),
        "modelPreviewSha256": digest(rendered),
        "contactSha256": digest(contact),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=["derive", "build", "render"])
    parser.add_argument("profile", choices=sorted([*PROFILES, "galleries-4-7"]))
    parser.add_argument("--root", type=Path, required=True)
    args = parser.parse_args()
    root = args.root.resolve()
    if args.operation == "derive":
        if args.profile not in PROFILES:
            parser.error(f"No derivation profile for {args.profile}")
        result = write_semantic(root, args.profile)
    elif args.operation == "build":
        result = build(root, args.profile)
    else:
        model_preview = render_floor(root, args.profile)
        contact = render_contact(root, args.profile, model_preview)
        result = {
            "modelPreviewSha256": digest(model_preview),
            "contactSha256": digest(contact),
        }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
