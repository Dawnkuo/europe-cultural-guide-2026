#!/usr/bin/env python3
"""Rebuild the strict five-venue Pisa source-pixel package.

Every emitted wall/detail pixel is selected from authoritative source ink.
Classifier masks may reject annotations or assign semantics, but they never
draw, close, regularize, or fill replacement geometry.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources/floorplans"
DERIVED = SOURCES / "derived"
QA = ROOT / "qa"
REPORTS = ROOT / "reports"
BUILDER = ROOT / "scripts/build-architectural-plans.py"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def keep_components(mask: np.ndarray, minimum_area: int) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        mask.astype(np.uint8), 8
    )
    output = np.zeros_like(mask, np.uint8)
    for index in range(1, count):
        if stats[index, cv2.CC_STAT_AREA] >= minimum_area:
            output[labels == index] = 1
    return output


def page_rgb(
    path: Path,
    page_number: int,
    clip: tuple[float, float, float, float],
    scale: float,
) -> np.ndarray:
    document = fitz.open(path)
    pixmap = document[page_number - 1].get_pixmap(
        matrix=fitz.Matrix(scale, scale), clip=fitz.Rect(clip), alpha=False
    )
    rgb = np.frombuffer(pixmap.samples, np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3].copy()
    document.close()
    return rgb


def rect_mask(
    shape: tuple[int, int], rectangles: list[tuple[int, int, int, int]]
) -> np.ndarray:
    output = np.zeros(shape, np.uint8)
    for x0, y0, x1, y1 in rectangles:
        output[max(0, y0) : min(shape[0], y1), max(0, x0) : min(shape[1], x1)] = 1
    return output


def polygon_mask(shape: tuple[int, int], polygons: list[list[tuple[int, int]]]) -> np.ndarray:
    output = np.zeros(shape, np.uint8)
    for polygon in polygons:
        cv2.fillPoly(output, [np.asarray(polygon, np.int32)], 1)
    return output


def write_image_pdf(name: str, source: Path) -> dict:
    DERIVED.mkdir(parents=True, exist_ok=True)
    image = Image.open(source)
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=image.width, height=image.height)
    page.insert_image(page.rect, filename=str(source))
    output = DERIVED / f"{name}.pdf"
    document.save(output, deflate=True, no_new_id=True)
    document.close()
    return {"file": str(output.relative_to(SOURCES)), "sha256": digest(output)}


def write_classified_pdf(
    name: str,
    source_rgb: np.ndarray,
    source_ink: np.ndarray,
    walls: np.ndarray,
    details: np.ndarray,
    metadata: dict,
) -> dict:
    if walls.shape != details.shape or walls.shape != source_ink.shape:
        raise ValueError(f"{name}: channel dimensions differ")
    if np.any((walls > 0) & (details > 0)):
        raise ValueError(f"{name}: wall/detail overlap")
    if np.any((walls | details) & (1 - source_ink)):
        raise ValueError(f"{name}: classifier emitted pixels outside source ink")

    DERIVED.mkdir(parents=True, exist_ok=True)
    venue_qa = QA / name
    venue_qa.mkdir(parents=True, exist_ok=True)
    semantic = np.full((*walls.shape, 3), 255, np.uint8)
    semantic[details > 0] = (128, 128, 128)
    semantic[walls > 0] = (0, 0, 0)
    semantic_path = venue_qa / "classified-source-pixels.png"
    Image.fromarray(semantic).save(semantic_path, compress_level=9)

    overlay = source_rgb.copy()
    overlay[details > 0] = (40, 105, 220)
    overlay[walls > 0] = (220, 45, 45)
    overlay_path = venue_qa / "source-classification-overlay.png"
    Image.fromarray(overlay).save(overlay_path, compress_level=9)
    Image.fromarray(source_rgb).save(venue_qa / "authoritative-source-crop.png", compress_level=9)

    height, width = walls.shape
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=width, height=height)
    page.insert_image(page.rect, filename=str(semantic_path))
    output = DERIVED / f"{name}.pdf"
    document.save(output, deflate=True, no_new_id=True)
    document.close()

    check = fitz.open(output)
    xref = check[0].get_images(full=True)[0][0]
    check.close()
    return {
        "file": str(output.relative_to(SOURCES)),
        "sha256": digest(output),
        "width": width,
        "height": height,
        "imageXref": xref,
        "sourceInkPixels": int(np.count_nonzero(source_ink)),
        "wallPixels": int(np.count_nonzero(walls)),
        "detailPixels": int(np.count_nonzero(details)),
        "excludedPixels": int(np.count_nonzero(source_ink & (1 - (walls | details)))),
        "sourceSubset": bool(not np.any((walls | details) & (1 - source_ink))),
        **metadata,
    }


def cathedral() -> dict:
    parent = SOURCES / "soane-pisa-cathedral-plan-high.jpg"
    source_rgb = np.asarray(Image.open(parent).convert("RGB"))[18:735, 23:527].copy()
    gray = cv2.cvtColor(source_rgb, cv2.COLOR_RGB2GRAY)
    source_ink = keep_components((gray < 174).astype(np.uint8), 3)

    # The union is only a classifier scope around the cruciform plan. It emits
    # no polygon geometry and keeps the original wall/pier pixels unchanged.
    scope = rect_mask(
        source_ink.shape,
        [
            (118, 35, 386, 674),
            (0, 180, 504, 336),
            (180, 35, 325, 210),
        ],
    )
    core = cv2.morphologyEx(source_ink, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    core &= source_ink
    walls = source_ink & scope & cv2.dilate(core, np.ones((5, 5), np.uint8))
    details = source_ink & scope & cv2.dilate(walls, np.ones((9, 9), np.uint8))
    details &= 1 - walls

    restored_region = np.zeros_like(source_ink)
    restored_region[410:705, 350:504] = 1
    restored = source_ink & walls & restored_region
    if np.count_nonzero(restored) < 1900:
        raise ValueError("Cathedral south wall restoration lost the audited source component")
    audit = write_image_pdf("pisa-cathedral-soane-sheet", parent)
    return write_classified_pdf(
        "pisa-cathedral-ground-plan-strict",
        source_rgb,
        source_ink,
        walls,
        details,
        {
            "parentFile": str(parent.relative_to(SOURCES)),
            "parentSha256": digest(parent),
            "parentCrop": [23, 18, 527, 735],
            "auditSheet": audit,
            "restoredAuditedRegionPixels": int(np.count_nonzero(restored)),
            "method": "Source grayscale <174; source components >=3 px; reviewed cruciform scope; 3 px structural cores select only original wall/pier pixels; nearby original hatching remains flat; handwritten legends and scale are excluded.",
        },
    )


def baptistery() -> dict:
    parent = SOURCES / "pisa-baptistery-hbim-figure6.png"
    source_rgb = np.asarray(Image.open(parent).convert("RGB"))[1040:1938, 1265:2160].copy()
    gray = cv2.cvtColor(source_rgb, cv2.COLOR_RGB2GRAY)
    source_ink = keep_components((gray < 210).astype(np.uint8), 4)
    yy, xx = np.ogrid[: source_ink.shape[0], : source_ink.shape[1]]
    center = (454, 486)
    radius = np.hypot(xx - center[0], yy - center[1])
    scope = radius <= 410

    # Published section A-A is an overprint across the plan. Remove the exact
    # source corridor; do not infer or redraw the obscured plan pixels below it.
    x1, y1, x2, y2 = 19, 583, 888, 350
    line_distance = np.abs(
        (y2 - y1) * xx - (x2 - x1) * yy + x2 * y1 - y2 * x1
    ) / math.hypot(y2 - y1, x2 - x1)
    section = line_distance <= 8.0
    architectural = source_ink & scope.astype(np.uint8) & (1 - section.astype(np.uint8))

    core = cv2.morphologyEx(architectural, cv2.MORPH_OPEN, np.ones((4, 4), np.uint8))
    core &= architectural
    wall_zone = (((radius >= 255) & (radius <= 345)) | ((radius >= 160) & (radius <= 225)))
    walls = architectural & wall_zone.astype(np.uint8) & cv2.dilate(core, np.ones((5, 5), np.uint8))
    details = architectural & (1 - walls)

    audit = write_image_pdf("pisa-baptistery-hbim-figure6", parent)
    return write_classified_pdf(
        "pisa-baptistery-ground-plan-strict",
        source_rgb,
        source_ink,
        walls,
        details,
        {
            "parentFile": str(parent.relative_to(SOURCES)),
            "parentSha256": digest(parent),
            "parentCrop": [1265, 1040, 2160, 1938],
            "auditSheet": audit,
            "sectionPixelsExcluded": int(np.count_nonzero(source_ink & section.astype(np.uint8))),
            "outerEnvelopePixelsRetained": int(np.count_nonzero(details & (radius >= 345) & (radius <= 410))),
            "method": "Source grayscale <210; source components >=4 px; complete 410 px plan scope; exact A-A overprint corridor excluded; annular masonry and true supports are walls; dodecagonal envelope, radial vault traces, font and pulpit stay flat source detail.",
        },
    )


def camposanto() -> dict:
    parent = SOURCES / "camposanto-unifi-survey.pdf"
    source_rgb = page_rgb(parent, 19, (48, 58, 548, 253), 4)
    gray = cv2.cvtColor(source_rgb, cv2.COLOR_RGB2GRAY)
    source_ink = keep_components((gray < 235).astype(np.uint8), 2)
    scope = rect_mask(source_ink.shape, [(105, 140, 1905, 715)])

    # Remove printed level targets and their short numeric readings. Candidate
    # windows are discovered from the target's actual dark 8-11 px symbol; the
    # colonnade bands are explicitly protected from this annotation detector.
    dark = (gray < 125).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(dark, 8)
    annotation = np.zeros_like(source_ink)
    target_windows: list[list[int]] = []
    for index in range(1, count):
        x, y, width, height, area = map(int, stats[index])
        fill = area / max(1, width * height)
        center_x, center_y = x + width / 2, y + height / 2
        protected = (
            276 <= center_y <= 304
            or 540 <= center_y <= 570
            or (245 <= center_x <= 280 and 275 <= center_y <= 570)
            or (1595 <= center_x <= 1630 and 275 <= center_y <= 570)
        )
        in_level_band = (
            175 <= center_y <= 225
            or 390 <= center_y <= 470
            or 515 <= center_y <= 545
            or 600 <= center_y <= 680
        )
        if (
            not protected
            and in_level_band
            and 105 <= center_x <= 1905
            and 8 <= width <= 12
            and 8 <= height <= 12
            and 20 <= area <= 70
            and 0.25 <= fill <= 0.75
        ):
            x0, y0 = max(0, x - 7), max(0, y - 6)
            x1, y1 = min(source_ink.shape[1], x + 58), min(source_ink.shape[0], y + 16)
            annotation[y0:y1, x0:x1] = 1
            target_windows.append([x0, y0, x1, y1])

    structural_horizontal = rect_mask(
        source_ink.shape,
        [(105, 145, 1775, 190), (125, 665, 1750, 715), (245, 275, 1630, 305), (245, 535, 1630, 570)],
    )
    structural_vertical = rect_mask(
        source_ink.shape,
        [(105, 145, 155, 715), (1695, 145, 1775, 715), (245, 275, 285, 570), (1590, 275, 1630, 570)],
    )
    annex_horizontal = rect_mask(
        source_ink.shape,
        [(1680, 340, 1905, 390), (1680, 480, 1905, 525), (1680, 585, 1905, 650)],
    )
    annex_vertical = rect_mask(
        source_ink.shape,
        [(1680, 340, 1765, 650), (1840, 340, 1905, 650)],
    )
    horizontal = cv2.morphologyEx(source_ink, cv2.MORPH_OPEN, np.ones((1, 13), np.uint8))
    vertical = cv2.morphologyEx(source_ink, cv2.MORPH_OPEN, np.ones((13, 1), np.uint8))
    structural_seed = (
        (horizontal & structural_horizontal)
        | (vertical & structural_vertical)
        | (horizontal & annex_horizontal)
        | (vertical & annex_vertical)
    )

    # Actual circular colonnade profiles are independently detected, then only
    # the source ink inside their local source-sized windows is selected.
    circles = cv2.HoughCircles(
        cv2.GaussianBlur(gray, (3, 3), 0.8),
        cv2.HOUGH_GRADIENT,
        dp=1,
        minDist=35,
        param1=90,
        param2=15,
        minRadius=4,
        maxRadius=9,
    )
    supports = np.zeros_like(source_ink)
    support_records: list[list[int]] = []
    for x, y, detected_radius in ([] if circles is None else np.round(circles[0]).astype(int)):
        in_band = (
            (250 <= x <= 1625 and (280 <= y <= 296 or 548 <= y <= 565))
            or (275 <= y <= 570 and (254 <= x <= 273 or 1600 <= x <= 1618))
        )
        if not in_band:
            continue
        half = detected_radius + 4
        x0, x1 = max(0, x - half), min(source_ink.shape[1], x + half + 1)
        y0, y1 = max(0, y - half), min(source_ink.shape[0], y + half + 1)
        supports[y0:y1, x0:x1] |= source_ink[y0:y1, x0:x1]
        support_records.append([int(x), int(y), int(detected_radius)])

    walls = source_ink & scope & cv2.dilate(structural_seed | supports, np.ones((3, 3), np.uint8))
    clean = source_ink & scope & (1 - annotation)
    walls &= 1 - annotation
    details = clean & (1 - walls)

    return write_classified_pdf(
        "camposanto-ground-plan-strict",
        source_rgb,
        source_ink,
        walls,
        details,
        {
            "parentFile": str(parent.relative_to(SOURCES)),
            "parentSha256": digest(parent),
            "parentPage": 19,
            "parentCrop": [48, 58, 548, 253],
            "targetWindows": target_windows,
            "surveyTargetsExcluded": len(target_windows),
            "supportProfilesDetected": len(support_records),
            "supportProfiles": support_records,
            "method": "Source grayscale <235; source components >=2 px; directional source-line classifiers select only actual perimeter/annex walls; local Hough windows select actual support ink; level-target symbols and their readings are excluded; tomb slabs and paving remain flat detail.",
        },
    )


def opera() -> dict:
    parent = SOURCES / "opera-pisa-architect-project.pdf"
    source_rgb = page_rgb(parent, 3, (98, 340, 555, 730), 4)
    red = source_rgb[:, :, 0].astype(np.int16)
    green = source_rgb[:, :, 1].astype(np.int16)
    blue = source_rgb[:, :, 2].astype(np.int16)
    source_ink = (
        (blue > red + 35) & (blue > green + 20) & (red < 180)
    ).astype(np.uint8)
    source_ink = keep_components(source_ink, 2)

    # Reviewed plan scope is a union of the museum wings and cloister walks.
    # It rejects the Tower inset, scale, roads, trees and planted courts.
    scope = polygon_mask(
        source_ink.shape,
        [
            [(930, 390), (1785, 390), (1785, 790), (1280, 790), (1280, 620), (930, 620)],
            [(910, 560), (1325, 560), (1325, 1480), (910, 1480)],
            [(1480, 430), (1795, 430), (1795, 1470), (1450, 1470)],
            [(175, 1140), (1740, 1140), (1740, 1490), (175, 1490)],
            [(170, 635), (1085, 635), (1085, 760), (170, 760)],
            [(170, 635), (260, 635), (260, 1260), (170, 1260)],
            [(875, 620), (1100, 620), (1100, 1260), (875, 1260)],
        ],
    )

    dark = source_ink & (red < 105).astype(np.uint8)
    core = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    core &= source_ink
    core = keep_components(core, 100)
    support_zones = rect_mask(
        source_ink.shape,
        [
            (245, 1135, 985, 1190),
            (930, 745, 995, 1135),
            (1270, 675, 1665, 735),
        ],
    )
    support_core = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    core |= support_core & support_zones
    walls = source_ink & scope & cv2.dilate(core, np.ones((5, 5), np.uint8))

    # Door leaves/arcs adjacent to wall gaps remain flat. Explicit stair/ramp
    # and cloister-bay windows retain all source pixels as flat detail.
    detail_scope = cv2.dilate(walls, np.ones((49, 49), np.uint8))
    detail_scope |= rect_mask(
        source_ink.shape,
        [
            (850, 650, 1045, 780),
            (1060, 455, 1320, 620),
            (980, 1080, 1160, 1275),
            (1500, 760, 1705, 930),
            (170, 1080, 1100, 1280),
            (930, 500, 1300, 1030),
        ],
    )
    details = source_ink & scope & detail_scope & (1 - walls)

    return write_classified_pdf(
        "opera-pisa-ground-plan-strict",
        source_rgb,
        source_ink,
        walls,
        details,
        {
            "parentFile": str(parent.relative_to(SOURCES)),
            "parentSha256": digest(parent),
            "parentPage": 3,
            "parentCrop": [98, 340, 555, 730],
            "method": "Architect blue source ink isolated without warp; reviewed wing/cloister scope excludes Tower/site graphics; connected 3 px dark structural cores and actual support-row source pixels form walls; original door arcs, stair treads, ramp edges, route traces and cloister diagonals remain flat detail.",
        },
    )


def tower_base() -> dict:
    parent = SOURCES / "opera-pisa-architect-project.pdf"
    source_rgb = page_rgb(parent, 3, (24, 346, 172, 500), 4)
    red = source_rgb[:, :, 0].astype(np.int16)
    green = source_rgb[:, :, 1].astype(np.int16)
    blue = source_rgb[:, :, 2].astype(np.int16)
    source_ink = (
        (blue > red + 35) & (blue > green + 20) & (red < 145)
    ).astype(np.uint8)
    yy, xx = np.ogrid[: source_ink.shape[0], : source_ink.shape[1]]
    source_ink &= (((xx - 292) ** 2 + (yy - 308) ** 2) <= 286**2).astype(np.uint8)
    source_ink = keep_components(source_ink, 4)
    core = cv2.morphologyEx(source_ink, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    walls = source_ink & core
    details = source_ink & (1 - walls)
    return write_classified_pdf(
        "leaning-tower-base-plan-strict",
        source_rgb,
        source_ink,
        walls,
        details,
        {
            "parentFile": str(parent.relative_to(SOURCES)),
            "parentSha256": digest(parent),
            "parentPage": 3,
            "parentCrop": [24, 346, 172, 500],
            "method": "Architect blue source pixels within the reviewed Tower inset; 3 px structural cores are walls and thinner original plan lines remain flat detail. No regularization or new geometry; the source carries no exterior-arcade route assertion.",
        },
    )


def derive() -> dict:
    records = {
        "pisa-cathedral": cathedral(),
        "pisa-baptistery": baptistery(),
        "camposanto": camposanto(),
        "opera-pisa": opera(),
        "leaning-tower-base": tower_base(),
    }
    REPORTS.mkdir(parents=True, exist_ok=True)
    manifest = REPORTS / "strict-five-derivation.json"
    manifest.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    return records


def run_tower_producers() -> None:
    for profile in ["entry-first", "galleries-1-3", "upper"]:
        subprocess.run(
            [
                sys.executable,
                str(ROOT / "scripts/rebuild-pisa-tower-source-pixels-v7.py"),
                "derive",
                profile,
                "--root",
                str(ROOT),
            ],
            cwd=ROOT,
            check=True,
        )
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/rebuild-pisa-tower-v4.py"), "derive"],
        cwd=ROOT,
        check=True,
    )
    subprocess.run(
        [sys.executable, str(ROOT / "scripts/rebuild-pisa-baptistery-upper.py"), "--derive-only"],
        cwd=ROOT,
        check=True,
    )


def build() -> None:
    specification = importlib.util.spec_from_file_location("pisa_strict_builder", BUILDER)
    if specification is None or specification.loader is None:
        raise RuntimeError("Cannot load pinned builder")
    module = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(module)
    module.ROOT = ROOT
    for slug in ["leaning-tower", "pisa-cathedral", "pisa-baptistery", "camposanto", "opera-pisa"]:
        config = json.loads((SOURCES / "venues" / f"{slug}.json").read_text())
        module.build(config)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--derive-only", action="store_true")
    parser.add_argument("--build-only", action="store_true")
    args = parser.parse_args()
    if not args.build_only:
        run_tower_producers()
        records = derive()
        print(json.dumps(records, ensure_ascii=False, indent=2))
    if not args.derive_only:
        build()


if __name__ == "__main__":
    main()
