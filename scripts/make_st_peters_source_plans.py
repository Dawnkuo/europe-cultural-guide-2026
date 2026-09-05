#!/usr/bin/env python3
"""Build source-pixel St Peter plans and audit the partial 1966 slide."""
from __future__ import annotations

import hashlib
import io
import json
import math
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from st_peters_inventory import load_inventory


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans"
COR_PDF = SOURCE / "st-peters-churches-of-rome-127.pdf"
MILLON_JPEG = SOURCE / "st-peters-basilica-plan-1966.jpg"
REVIEWED_PDF = SOURCE / "st-peters-reviewed-plans.pdf"
MILLON_PDF = SOURCE / "st-peters-1966-rectified.pdf"
SPACES_JSON = SOURCE / "st-peters-source-spaces.json"
NUMBER_INVENTORY_JSON = SOURCE / "st-peters-number-inventory.json"
QA = ROOT / "work/st-peters-source-qa"

EXPECTED_COR_SHA256 = "6a1dc0f4506c0dc2364a80812d21e8713f1c57771905299fa2ba9849d811e429"
EXPECTED_MILLON_SHA256 = "36ecedb8b637608338ca6bc4de06b155a63135128d8481675d08e0b4ce79d6e5"
EXPECTED_COR_IMAGES = {
    "basilica": {"page": 15, "xref": 99, "size": [483, 479]},
    "grottoes": {"page": 63, "xref": 261, "size": [880, 784]},
}

BASILICA_DETAIL_CIRCLES = [
    {"id": "northwest-stair", "center": [190, 123], "radius": 8},
    {"id": "northeast-stair", "center": [412, 125], "radius": 8},
    {"id": "southwest-crossing-stair", "center": [190, 215], "radius": 8},
    {"id": "southeast-crossing-stair", "center": [412, 215], "radius": 8},
]

GROTTO_DETAIL_CIRCLES = [
    {"id": "northwest-stair", "center": [300, 73], "radius": 21},
    {"id": "northeast-stair", "center": [545, 74], "radius": 21},
    {"id": "southwest-stair", "center": [285, 333], "radius": 21},
    {"id": "southeast-stair", "center": [557, 334], "radius": 21},
]

WALL_CHECKPOINTS = {
    "basilica": [
        {"id": "apse-crown", "at": [303, 8], "expected": "wall"},
        {"id": "apse-room", "at": [303, 55], "expected": "open"},
        {"id": "west-transept-shell", "at": [151, 170], "expected": "wall"},
        {"id": "west-transept-room", "at": [188, 168], "expected": "open"},
        {"id": "east-transept-shell", "at": [453, 170], "expected": "wall"},
        {"id": "east-transept-room", "at": [410, 173], "expected": "open"},
        {"id": "crossing-source-label-53", "at": [272, 200], "expected": "open"},
        {"id": "southwest-pier", "at": [250, 211], "expected": "wall"},
        {"id": "southeast-pier", "at": [350, 205], "expected": "wall"},
        {"id": "nave-west-wall", "at": [218, 330], "expected": "wall"},
        {"id": "nave-east-wall", "at": [368, 330], "expected": "wall"},
        {"id": "nave-core", "at": [300, 370], "expected": "open"},
        {"id": "narthex-north-wall-body", "at": [312, 420], "expected": "wall"},
        {"id": "narthex", "at": [294, 439], "expected": "open"},
        {"id": "pieta-chapel-label-6", "at": [360, 399], "expected": "open"},
    ],
    "grottoes": [
        {"id": "north-crown-wall", "at": [405, 20], "expected": "wall"},
        {"id": "north-crown-room", "at": [419, 42], "expected": "open"},
        {"id": "confessio-west-wall", "at": [397, 181], "expected": "wall"},
        {"id": "confessio", "at": [423, 207], "expected": "open"},
        {"id": "west-room-shell", "at": [160, 480], "expected": "wall"},
        {"id": "west-room", "at": [214, 481], "expected": "open"},
        {"id": "south-corridor-west-wall", "at": [345, 620], "expected": "wall"},
        {"id": "south-corridor", "at": [423, 647], "expected": "open"},
        {"id": "east-exit-wall", "at": [790, 702], "expected": "wall"},
    ],
}

SPACE_SPECS = {
    "basilica": [
        {"id": "narthex", "label": "门廊", "placeId": "basilica-1-1", "seed": [294, 444], "kernel": 17},
        {"id": "nave", "label": "中央中殿", "placeId": "basilica-5-1", "seed": [298, 370], "kernel": 7},
        {"id": "right-transept", "label": "右耳堂", "placeId": "basilica-23-1", "seed": [411, 166], "kernel": 7},
        {"id": "apse", "label": "圣彼得宝座与后殿", "placeId": "basilica-35-1", "seed": [304, 42], "kernel": 3},
        {"id": "crossing", "label": "穹顶下方与华盖", "placeId": "basilica-52-1", "seed": [318, 170], "kernel": 3},
    ],
    "grottoes": [
        {"id": "peter-chapel", "label": "圣彼得小堂", "placeId": "grottoes-5-1", "seed": [420, 154], "kernel": 13},
        {"id": "confessio", "label": "告解祭台", "placeId": "grottoes-12-1", "seed": [430, 213], "kernel": 15},
        {"id": "central-passage", "label": "告解祭台前通道", "placeId": "grottoes-23-1", "seed": [423, 310], "kernel": 25},
    ],
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def pixel_runs(mask: np.ndarray):
    for y, row in enumerate(mask):
        padded = np.pad(row.astype(np.int8), (1, 1))
        changes = np.flatnonzero(np.diff(padded))
        for x0, x1 in changes.reshape(-1, 2):
            yield box(int(x0), y, int(x1), y + 1)


def rings(mask: np.ndarray) -> tuple[list[dict], Polygon]:
    shape = unary_union(list(pixel_runs(mask)))
    if shape.geom_type == "Polygon":
        polygons = [shape]
    else:
        polygons = list(shape.geoms)
    polygons.sort(key=lambda item: item.area, reverse=True)
    primary = polygons[0]
    serialized = [{
        "outer": [[round(x, 4), round(y, 4)] for x, y in primary.exterior.coords],
        "holes": [
            [[round(x, 4), round(y, 4)] for x, y in interior.coords]
            for interior in primary.interiors
        ],
    }]
    return serialized, primary


def derive_spaces(
    floor_id: str, walls: np.ndarray, source: np.ndarray
) -> tuple[list[dict], list[dict]]:
    spaces = []
    audit = []
    for spec in SPACE_SPECS[floor_id]:
        kernel = spec["kernel"]
        barrier = walls
        if kernel > 1:
            barrier = cv2.morphologyEx(
                walls, cv2.MORPH_CLOSE, np.ones((kernel, kernel), np.uint8)
            )
        # Open arches between source piers delimit selection regions only.
        # These temporary cuts never become masonry in the semantic image.
        cuts = []
        if floor_id == "basilica" and spec["id"] == "nave":
            cuts = [((263, 263), (331, 263))]
            for start, end in [(282, 322), (334, 371), (382, 419)]:
                cuts.extend([((270, start), (270, end)), ((326, start), (326, end))])
        elif floor_id == "basilica" and spec["id"] == "right-transept":
            cuts = [((395, 138), (395, 200))]
        elif floor_id == "basilica" and spec["id"] == "apse":
            cuts = [((272, 71), (329, 71))]
        elif floor_id == "basilica" and spec["id"] == "crossing":
            cuts = [((272, 121), (329, 121)), ((271, 216), (329, 216)), ((251, 138), (251, 197)), ((344, 140), (344, 199))]
        for start, end in cuts:
            cv2.line(barrier, start, end, 1, 2)
        barrier = barrier.astype(bool)
        wall_pixels_missing_from_barrier = int((walls.astype(bool) & ~barrier).sum())
        if wall_pixels_missing_from_barrier:
            raise ValueError(f"Space barrier removed source wall pixels: {floor_id}-{spec['id']}")
        count, labels, stats, _ = cv2.connectedComponentsWithStats((~barrier).astype(np.uint8), 8)
        x, y = spec["seed"]
        component = int(labels[y, x])
        if component == 0:
            raise ValueError(f"Space seed entered a barrier: {floor_id}-{spec['id']}")
        mask = (labels == component).astype(np.uint8)
        closure_only = barrier & ~walls.astype(bool)
        source_wall_overlap = int((mask.astype(bool) & walls.astype(bool)).sum())
        closure_overlap = int((mask.astype(bool) & closure_only).sum())
        if source_wall_overlap or closure_overlap:
            raise ValueError(f"Space component crossed its barrier: {floor_id}-{spec['id']}")
        serialized, shape = rings(mask)
        if not shape.covers(box(x, y, x + 1, y + 1).centroid):
            raise ValueError(f"Space seed escaped polygon: {floor_id}-{spec['id']}")
        source_path = (
            f"source-raster:{floor_id}:opening-closure-selector-{kernel}px"
            if kernel > 1 else f"source-raster:{floor_id}:closed-source-component"
        )
        spaces.append({
            "id": spec["id"],
            "label": spec["label"],
            "placeId": spec["placeId"],
            "polygons": serialized,
            "sourcePaths": [source_path],
            "evidence": "来源墙体像素包围的连通空间；门洞闭合仅用于生成平面选区，不生成墙体。",
            "tone": "neutral",
            "scope": "room",
        })
        component_neighborhood = cv2.dilate(mask, np.ones((7, 7), np.uint8)).astype(bool)
        reviewed_closure = closure_only & component_neighborhood
        audit.append({
            "id": spec["id"],
            "placeId": spec["placeId"],
            "seed": spec["seed"],
            "selectorKernelPixels": kernel,
            "sourceThresholdCuts": cuts,
            "componentLabel": component,
            "pixelArea": int(stats[component, cv2.CC_STAT_AREA]),
            "bounds": [round(value, 4) for value in shape.bounds],
            "sourceWallPixelsMissingFromBarrier": wall_pixels_missing_from_barrier,
            "sourceWallPixelsInsideComponent": source_wall_overlap,
            "closurePixelsInsideComponent": closure_overlap,
            "reviewedBoundaryClosurePixels": int(reviewed_closure.sum()),
            "emittedWallPixelsAddedBySelector": 0,
        })

        overlay = Image.fromarray(source.copy()).convert("RGBA")
        tint = np.zeros((source.shape[0], source.shape[1], 4), dtype=np.uint8)
        tint[mask.astype(bool)] = [0, 126, 167, 72]
        tint[reviewed_closure] = [215, 48, 39, 220]
        overlay = Image.alpha_composite(overlay, Image.fromarray(tint, "RGBA"))
        x0, y0, x1, y1 = shape.bounds
        crop = (
            max(0, math.floor(x0) - 12),
            max(0, math.floor(y0) - 12),
            min(source.shape[1], math.ceil(x1) + 12),
            min(source.shape[0], math.ceil(y1) + 12),
        )
        selector_dir = QA / "space-selectors"
        selector_dir.mkdir(exist_ok=True)
        overlay.crop(crop).save(selector_dir / f"{floor_id}-{spec['id']}.png")
    return spaces, audit


def compare(
    name: str,
    source: np.ndarray,
    semantic: np.ndarray,
    walls: np.ndarray,
    details: np.ndarray,
    spaces: list[dict],
) -> None:
    overlay = source.copy()
    red = np.zeros_like(source)
    red[:, :] = [220, 42, 42]
    blue = np.zeros_like(source)
    blue[:, :] = [28, 108, 214]
    wall_mask = walls.astype(bool)
    detail_mask = details.astype(bool)
    overlay[wall_mask] = (0.45 * overlay[wall_mask] + 0.55 * red[wall_mask]).astype(np.uint8)
    overlay[detail_mask] = (0.45 * overlay[detail_mask] + 0.55 * blue[detail_mask]).astype(np.uint8)
    wall_only = np.full_like(source, 255)
    wall_only[wall_mask] = 0
    canvas = Image.new("RGB", (source.shape[1] * 4, source.shape[0] + 34), "white")
    for index, array in enumerate((source, wall_only, semantic, overlay)):
        canvas.paste(Image.fromarray(array), (index * source.shape[1], 34))
    draw = ImageDraw.Draw(canvas)
    for index, label in enumerate(("SOURCE", "WALL BODY", "WALL + FLAT DETAIL", "SOURCE OVERLAY")):
        draw.text((index * source.shape[1] + 8, 10), label, fill="black")
    canvas.save(QA / f"{name}-wall-comparison.png")

    space_overlay = Image.fromarray(source.copy())
    draw = ImageDraw.Draw(space_overlay, "RGBA")
    for space in spaces:
        for polygon in space["polygons"]:
            draw.polygon([tuple(point) for point in polygon["outer"]], fill=(43, 125, 214, 75), outline=(15, 75, 145, 255), width=2)
        seed = next(item["seed"] for item in SPACE_SPECS[name] if item["id"] == space["id"])
        draw.ellipse((seed[0] - 4, seed[1] - 4, seed[0] + 4, seed[1] + 4), fill=(220, 42, 42, 255))
        draw.text((seed[0] + 6, seed[1] - 7), space["id"], fill=(0, 0, 0, 255))
    space_overlay.save(QA / f"{name}-spaces-overlay.png")


def reviewed_circle_mask(shape: tuple[int, int], circles: list[dict]) -> np.ndarray:
    yy, xx = np.indices(shape)
    output = np.zeros(shape, dtype=np.uint8)
    for item in circles:
        cx, cy = item["center"]
        output[np.hypot(xx - cx, yy - cy) <= item["radius"]] = 1
    return output


def checkpoint_audit(floor_id: str, walls: np.ndarray) -> list[dict]:
    output = []
    for item in WALL_CHECKPOINTS[floor_id]:
        x, y = item["at"]
        actual = "wall" if walls[y, x] else "open"
        if actual != item["expected"]:
            raise ValueError(
                f"Wall checkpoint failed: {floor_id}-{item['id']} "
                f"expected {item['expected']} got {actual}"
            )
        output.append({**item, "actual": actual, "passed": True})
    return output


def number_inventory_audit(
    floor_id: str, source: np.ndarray, places: list[dict]
) -> dict:
    expected_max = 84 if floor_id == "basilica" else 68
    labels = [int(item["label"]) for item in places]
    unlocated = {82} if floor_id == "basilica" else set()
    missing = sorted(set(range(1, expected_max + 1)) - set(labels) - unlocated)
    extras = sorted(set(labels) - set(range(1, expected_max + 1)))
    if missing or extras:
        raise ValueError(f"Number inventory mismatch for {floor_id}: {missing=} {extras=}")

    overlay = Image.fromarray(source.copy()).convert("RGBA")
    draw = ImageDraw.Draw(overlay, "RGBA")
    samples = []
    crops = []
    for occurrence, item in enumerate(places, 1):
        x, y = item["at"]
        if not (0 <= x < source.shape[1] and 0 <= y < source.shape[0]):
            raise ValueError(f"Number anchor outside source: {floor_id}-{item['label']}")
        x0 = max(0, x - 10)
        y0 = max(0, y - 8)
        x1 = min(source.shape[1], x + 11)
        y1 = min(source.shape[0], y + 9)
        crop = source[y0:y1, x0:x1]
        if floor_id == "basilica":
            evidence_pixels = int((cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY) <= 105).sum())
        else:
            r = crop[:, :, 0].astype(np.int16)
            g = crop[:, :, 1].astype(np.int16)
            b = crop[:, :, 2].astype(np.int16)
            evidence_pixels = int(((r > 120) & (r - g > 18) & (r - b > 18)).sum())
        if evidence_pixels < 2:
            raise ValueError(
                f"Number anchor lacks source glyph pixels: {floor_id}-{item['label']} at {item['at']}"
            )
        draw.ellipse((x - 5, y - 5, x + 5, y + 5), outline=(0, 93, 220, 255), width=1)
        draw.text((x + 6, y - 7), item["label"], fill=(0, 62, 170, 255))
        samples.append({
            "label": item["label"],
            "at": item["at"],
            "sourceInkPixelsWithin21x17": evidence_pixels,
            "precision": item.get("precision", "source-red-glyph-center"),
            "inventoryOccurrence": occurrence,
        })
        crop_image = Image.fromarray(crop).resize(
            (126, 102), Image.Resampling.NEAREST
        )
        crop_canvas = Image.new("RGB", (140, 126), "white")
        crop_canvas.paste(crop_image, (7, 22))
        crop_draw = ImageDraw.Draw(crop_canvas)
        crop_draw.text((7, 4), f"{item['label']} @ {x},{y}", fill="black")
        crop_draw.line((70, 54, 70, 96), fill=(0, 93, 220), width=1)
        crop_draw.line((49, 75, 91, 75), fill=(0, 93, 220), width=1)
        crops.append(crop_canvas)
    overlay.resize(
        (source.shape[1] * 3, source.shape[0] * 3), Image.Resampling.NEAREST
    ).save(QA / f"{floor_id}-number-anchor-overlay.png")
    columns = 10
    rows = math.ceil(len(crops) / columns)
    contact = Image.new("RGB", (columns * 140, rows * 126), "white")
    for index, crop in enumerate(crops):
        contact.paste(crop, ((index % columns) * 140, (index // columns) * 126))
    contact.save(QA / f"{floor_id}-number-anchor-crops.png")
    return {
        "expectedLabels": [1, expected_max],
        "uniqueLabels": len(set(labels)),
        "placeOccurrences": len(places),
        "missingLabels": missing,
        "unlocatedLabels": sorted(unlocated),
        "extraLabels": extras,
        "duplicateLabels": sorted(label for label in set(labels) if labels.count(label) > 1),
        "samples": samples,
    }


def semantic_cor_plans() -> dict:
    document = fitz.open(COR_PDF)
    output = fitz.open()
    number_inventory = load_inventory(SOURCE)
    spaces_by_floor = {}
    review = {}
    for floor_id in ("basilica", "grottoes"):
        source_spec = EXPECTED_COR_IMAGES[floor_id]
        page = document[source_spec["page"] - 1]
        image_refs = page.get_images(full=True)
        if not image_refs or image_refs[0][0] != source_spec["xref"]:
            raise ValueError(f"Unexpected CoR image xref for {floor_id}")
        extracted = document.extract_image(source_spec["xref"])
        source = np.array(Image.open(io.BytesIO(extracted["image"])).convert("RGB"))
        if list(source.shape[1::-1]) != source_spec["size"]:
            raise ValueError(f"Unexpected CoR source size for {floor_id}")
        if floor_id == "basilica":
            gray = cv2.cvtColor(source, cv2.COLOR_RGB2GRAY)
            gray_fill_seed = ((gray >= 90) & (gray <= 225)).astype(np.uint8)
            density = cv2.boxFilter(
                gray_fill_seed.astype(np.float32), -1, (3, 3), normalize=True
            )
            source_supported_body = (density >= 0.4).astype(np.uint8)
            selector = cv2.morphologyEx(
                source_supported_body, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)
            )
            count, labels, stats, _ = cv2.connectedComponentsWithStats(selector, 8)
            retained = [
                index
                for index in range(1, count)
                if stats[index, cv2.CC_STAT_AREA] >= 35
            ]
            walls = np.isin(labels, retained).astype(np.uint8)
            # Restore adjacent native dark boundary pixels, not whitespace.
            # The previous broad density filter merged the Pieta label and
            # vault projection lines into the surrounding masonry.
            walls |= cv2.dilate(walls, np.ones((3, 3), np.uint8)) & (gray <= 225).astype(np.uint8)

            neutral_line = (gray <= 205).astype(np.uint8)
            reviewed_detail = reviewed_circle_mask(
                walls.shape, BASILICA_DETAIL_CIRCLES
            )
            walls &= 1 - reviewed_detail
            details = neutral_line & reviewed_detail

            nearby_seed = cv2.dilate(
                gray_fill_seed, np.ones((7, 7), np.uint8)
            )
            unsupported = int((walls & (1 - nearby_seed)).sum())
            if unsupported:
                raise ValueError(
                    f"Basilica wall-body pixels without 7x7 source gray support: {unsupported}"
                )
            classification = {
                "method": "3x3 local density of native gray-fill pixels, threshold 0.4; 3x3 closing and 35-pixel component filter, plus adjacent native dark boundary pixels only",
                "sourceGrayFillSeedPixels": int(gray_fill_seed.sum()),
                "sourceSupportedCandidatePixels": int(source_supported_body.sum()),
                "wallBodyPixels": int(walls.sum()),
                "wallBodyPixelsNotDirectGraySeed": int((walls & (1 - gray_fill_seed)).sum()),
                "wallBodyPixelsWithoutGraySeedWithin7x7": unsupported,
                "reviewedFlatDetailPixels": int(details.sum()),
                "sourceBoundaryTolerancePixels": 3,
                "syntheticFootprints": 0,
            }
        else:
            channel_span = np.max(source, axis=2) - np.min(source, axis=2)
            source_ink = (
                (np.max(source, axis=2) <= 205) & (channel_span <= 18)
            ).astype(np.uint8)
            source_ink[50:140, 70:180] = 0
            source_ink[740:, :600] = 0
            selector = cv2.morphologyEx(
                source_ink, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)
            )
            count, labels, stats, _ = cv2.connectedComponentsWithStats(selector, 8)
            retained = []
            for index in range(1, count):
                x, y, width, height, area = stats[index]
                if area >= 12 and (width >= 5 or height >= 5):
                    retained.append(index)
            retained_ink = source_ink & np.isin(labels, retained).astype(np.uint8)
            core = cv2.morphologyEx(
                retained_ink, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)
            )
            walls = retained_ink & cv2.dilate(
                core, np.ones((3, 3), np.uint8)
            )
            reviewed_detail = reviewed_circle_mask(
                walls.shape, GROTTO_DETAIL_CIRCLES
            )
            exit_stair_interior = np.zeros_like(walls)
            exit_stair_interior[690:716, 808:852] = 1
            reviewed_detail |= exit_stair_interior
            walls &= 1 - reviewed_detail
            details = retained_ink & (1 - walls)
            classification = {
                "method": "native neutral source ink; 3x3 opening identifies thick wall cores, dilation is intersected with retained source ink; all remaining source ink is flat detail",
                "sourceInkPixels": int(source_ink.sum()),
                "retainedSourceInkPixels": int(retained_ink.sum()),
                "wallPixels": int(walls.sum()),
                "flatDetailPixels": int(details.sum()),
                "reviewedStairInteriorSourcePixels": int((retained_ink & reviewed_detail).sum()),
                "emittedPixelsOutsideSourceInk": int(((walls | details) & (1 - source_ink)).sum()),
                "syntheticFootprints": 0,
            }

        semantic = np.full(source.shape, 255, np.uint8)
        semantic[walls.astype(bool)] = 0
        semantic[details.astype(bool)] = 128

        buffer = io.BytesIO()
        Image.fromarray(semantic).save(buffer, format="PNG", optimize=True)
        out_page = output.new_page(width=source.shape[1], height=source.shape[0])
        out_page.insert_image(out_page.rect, stream=buffer.getvalue())

        spaces, space_audit = derive_spaces(floor_id, walls, source)
        spaces_by_floor[floor_id] = spaces
        compare(floor_id, source, semantic, walls, details, spaces)
        checkpoints = checkpoint_audit(floor_id, walls)
        number_audit = number_inventory_audit(
            floor_id, source, number_inventory[floor_id]
        )
        review[floor_id] = {
            "sourcePage": source_spec["page"],
            "sourceXref": source_spec["xref"],
            "nativeSize": [int(source.shape[1]), int(source.shape[0])],
            "classification": classification,
            "wallCheckpoints": checkpoints,
            "numberInventory": number_audit,
            "spaces": space_audit,
        }

    output.save(REVIEWED_PDF, deflate=True, no_new_id=True)
    output.close()
    document.close()
    SPACES_JSON.write_text(json.dumps(spaces_by_floor, ensure_ascii=False, indent=2) + "\n")
    return review


def order_corners(points: np.ndarray) -> np.ndarray:
    ordered = np.zeros((4, 2), dtype=np.float32)
    total = points.sum(axis=1)
    delta = np.diff(points, axis=1).reshape(-1)
    ordered[0] = points[np.argmin(total)]
    ordered[2] = points[np.argmax(total)]
    ordered[1] = points[np.argmin(delta)]
    ordered[3] = points[np.argmax(delta)]
    return ordered


def rectified_millon() -> dict:
    source_bgr = cv2.imread(str(MILLON_JPEG))
    if source_bgr is None or list(source_bgr.shape[1::-1]) != [2953, 2944]:
        raise ValueError("Unexpected Millon source dimensions")
    gray = cv2.cvtColor(source_bgr, cv2.COLOR_BGR2GRAY)
    paper = (gray > 30).astype(np.uint8) * 255
    paper = cv2.morphologyEx(paper, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    contours, _ = cv2.findContours(paper, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contour = max(contours, key=cv2.contourArea)
    approximation = cv2.approxPolyDP(contour, 0.01 * cv2.arcLength(contour, True), True)
    if len(approximation) != 4:
        raise ValueError("Millon paper boundary is no longer quadrilateral")
    corners = order_corners(approximation.reshape(4, 2).astype(np.float32))
    expected = np.array([[69, 585], [2831, 562], [2866, 2369], [136, 2397]], np.float32)
    if float(np.max(np.linalg.norm(corners - expected, axis=1))) > 10:
        raise ValueError("Millon paper corners changed; rectify again")

    width = round((np.linalg.norm(corners[1] - corners[0]) + np.linalg.norm(corners[2] - corners[3])) / 2)
    height = round((np.linalg.norm(corners[3] - corners[0]) + np.linalg.norm(corners[2] - corners[1])) / 2)
    target = np.array([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]], np.float32)
    matrix = cv2.getPerspectiveTransform(corners, target)
    warped = cv2.warpPerspective(source_bgr, matrix, (width, height), borderValue=(255, 255, 255))
    rectified_bgr = cv2.rotate(warped, cv2.ROTATE_90_COUNTERCLOCKWISE)
    rectified = cv2.cvtColor(rectified_bgr, cv2.COLOR_BGR2RGB)

    rectified_gray = cv2.cvtColor(rectified_bgr, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(rectified_gray, 80, 180)
    cx = round(rectified.shape[1] * 0.725)
    cy = round(rectified.shape[0] * 0.465)
    radius = rectified.shape[0] * 0.129
    yy, xx = np.indices(rectified_gray.shape)
    distance = np.hypot(xx - cx, yy - cy)
    edge_y, edge_x = np.where((edges > 0) & (distance >= radius - 18) & (distance <= radius + 18))
    ellipse = cv2.fitEllipse(np.column_stack([edge_x, edge_y]).astype(np.float32).reshape(-1, 1, 2))
    ellipse_axes = sorted([float(ellipse[1][0]), float(ellipse[1][1])])
    axis_ratio = ellipse_axes[1] / ellipse_axes[0]
    if axis_ratio > 1.015:
        raise ValueError("Millon dome-circle constraint no longer supports equal axes")

    neutral = (
        (rectified_gray <= 130)
        & ((rectified.max(axis=2).astype(np.int16) - rectified.min(axis=2)) <= 20)
    ).astype(np.uint8)
    density = cv2.boxFilter(neutral.astype(np.float32), -1, (15, 15), normalize=True)
    zone = cv2.dilate((density >= 0.42).astype(np.uint8), np.ones((9, 9), np.uint8))
    candidate = neutral & zone
    count, labels, stats, centroids = cv2.connectedComponentsWithStats(candidate, 8)
    retained = []
    for index in range(1, count):
        x, y, component_width, component_height, area = stats[index]
        centroid_x, centroid_y = centroids[index]
        border = x == 0 or y == 0 or x + component_width == candidate.shape[1] or y + component_height == candidate.shape[0]
        legend = centroid_x < 340 and centroid_y > 1500
        altar_detail = 1190 <= x <= 1210 and 190 <= y <= 210
        if area >= 1000 and not border and not legend and not altar_detail:
            retained.append(index)
    walls = neutral & np.isin(labels, retained).astype(np.uint8)
    semantic = np.full(rectified.shape, 255, np.uint8)
    semantic[walls.astype(bool)] = 0

    Image.fromarray(rectified).save(QA / "millon-1966-rectified.png")
    compare(
        "millon-1966",
        rectified,
        semantic,
        walls,
        np.zeros_like(walls),
        [],
    )
    pdf = fitz.open()
    buffer = io.BytesIO()
    Image.fromarray(rectified).save(buffer, format="PNG", optimize=True)
    page = pdf.new_page(width=rectified.shape[1], height=rectified.shape[0])
    page.insert_image(page.rect, stream=buffer.getvalue())
    pdf.save(MILLON_PDF, deflate=True, no_new_id=True)
    pdf.close()

    return {
        "source": "Wikimedia Commons file page backed by Accademia delle Scienze di Torino, Fondo Millon",
        "accession": "48_13_060",
        "photographer": "Henry A. Millon",
        "photographDate": 1966,
        "drawingAuthor": "anonymous",
        "coverage": "partial plan: central longitudinal axis and one side only",
        "paperCorners": [[round(float(x), 3), round(float(y), 3)] for x, y in corners],
        "perspectiveTransform": [[round(float(value), 9) for value in row] for row in matrix],
        "rectifiedSize": [int(rectified.shape[1]), int(rectified.shape[0])],
        "domeCircleEllipseAxes": [round(value, 4) for value in ellipse_axes],
        "domeCircleAxisRatio": round(axis_ratio, 7),
        "wallPixelsForComparisonOnly": int(walls.sum()),
        "syntheticWallPixels": int(np.count_nonzero(walls & (1 - neutral))),
        "geometryUse": "corroboration only; the partial slide is not a model floor",
    }


def main() -> None:
    if sha256(COR_PDF) != EXPECTED_COR_SHA256:
        raise ValueError("Churches of Rome source changed")
    if sha256(MILLON_JPEG) != EXPECTED_MILLON_SHA256:
        raise ValueError("Millon 1966 source changed")
    QA.mkdir(parents=True, exist_ok=True)
    review = {
        "churchesOfRome": semantic_cor_plans(),
        "millon1966": rectified_millon(),
    }
    (QA / "review.json").write_text(json.dumps(review, ensure_ascii=False, indent=2) + "\n")
    (QA / "space-selector-checkpoints.json").write_text(
        json.dumps(
            {
                floor_id: floor_review["spaces"]
                for floor_id, floor_review in review["churchesOfRome"].items()
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n"
    )
    print(REVIEWED_PDF)
    print(MILLON_PDF)
    print(SPACES_JSON)
    print(QA / "review.json")
    print(QA / "space-selector-checkpoints.json")


if __name__ == "__main__":
    main()
