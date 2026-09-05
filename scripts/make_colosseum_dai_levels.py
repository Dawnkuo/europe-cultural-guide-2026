#!/usr/bin/env python3
"""Register and classify the DAI Colosseum Level 2 / Level 3 plate."""
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


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans"
PLATE = SOURCE / "research/colosseum-dai-podium-plan-2022.pdf"
OUTPUT = SOURCE / "colosseum-dai-reviewed-levels.pdf"
QA = ROOT / "work/colosseum-dai-levels-qa"
EXPECTED_SHA256 = "194075112aea65e2b0a9f6c8f5f6cbf07a0ce91129307978b063b5601a2806f3"
EXPECTED_IMAGES = {
    2: {"xref": 126, "size": [5819, 4050]},
    3: {"xref": 6, "size": [5878, 4050]},
}

# Page 3 image coordinates mapped into the page 2 image coordinate system.
PAGE3_TO_MOSAIC = np.array([
    [0.999800349, -0.0000114083, 4393.81962],
    [0.0000114083, 0.999800349, 25.5078654],
], dtype=np.float64)
CONTROL_POINTS = [
    [[345.966, 530.756], [4739.740, 556.195]],
    [[659.328, 612.306], [5052.991, 637.791]],
    [[1011.995, 289.057], [5405.624, 314.528]],
    [[1194.841, 554.872], [5588.413, 580.309]],
    [[260.719, 1426.233], [4654.561, 1451.392]],
    [[397.359, 1409.005], [4791.113, 1434.249]],
    [[838.868, 1802.540], [5232.309, 1827.679]],
    [[1328.105, 1143.051], [5721.655, 1168.167]],
    [[245.283, 2652.008], [4638.978, 2677.052]],
    [[387.276, 2250.854], [4780.895, 2275.895]],
    [[1034.109, 2934.545], [5428.021, 2959.781]],
    [[299.704, 3396.156], [4693.391, 3420.982]],
    [[469.645, 3586.353], [4863.325, 3611.270]],
    [[847.304, 3572.762], [5240.846, 3597.573]],
    [[1196.388, 3305.197], [5589.930, 3329.989]],
]

CANVAS_SIZE = [10275, 4077]
SEAM_X = 5100
DOWNSAMPLE = 4
REVIEWED_CHECKPOINTS = {
    "hypogeum-level-2": {
        "central-corridor-network": {"rect": [1180, 420, 1380, 600], "minWallPixels": 500, "minDetailPixels": 5000},
        "west-corridors": {"rect": [600, 420, 800, 600], "minWallPixels": 250, "minDetailPixels": 5000},
        "east-corridors": {"rect": [1750, 420, 1950, 600], "minWallPixels": 100, "minDetailPixels": 4000},
        "north-short-axis": {"rect": [1180, 150, 1380, 330], "minWallPixels": 800, "minDetailPixels": 5000},
        "south-short-axis": {"rect": [1180, 690, 1380, 870], "minWallPixels": 600, "minDetailPixels": 4000},
    },
    "podium-level-3": {
        "north-podium-arc": {"rect": [1050, 80, 1500, 260], "minWallPixels": 2000, "minDetailPixels": 7000},
        "south-podium-arc": {"rect": [1050, 760, 1500, 940], "minWallPixels": 2000, "minDetailPixels": 7000},
        "west-podium-sector": {"rect": [300, 350, 650, 680], "minWallPixels": 1200, "minDetailPixels": 7000},
        "east-podium-sector": {"rect": [1900, 350, 2250, 680], "minWallPixels": 1200, "minDetailPixels": 3500},
        "open-arena-core": {"rect": [850, 300, 1700, 720], "maxWallRatio": 0.002},
    },
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_images() -> dict[int, np.ndarray]:
    document = fitz.open(PLATE)
    output = {}
    for page_number, expected in EXPECTED_IMAGES.items():
        page = document[page_number - 1]
        images = page.get_images(full=True)
        if len(images) != 1 or images[0][0] != expected["xref"]:
            raise ValueError(f"DAI plate page {page_number} image xref changed")
        extracted = document.extract_image(expected["xref"])
        image = np.array(Image.open(io.BytesIO(extracted["image"])).convert("RGB"))
        if list(image.shape[1::-1]) != expected["size"]:
            raise ValueError(f"DAI plate page {page_number} dimensions changed")
        output[page_number] = image
    document.close()
    return output


def registration_audit() -> dict:
    residuals = []
    for source, target in CONTROL_POINTS:
        source_h = np.array([source[0], source[1], 1.0])
        mapped = PAGE3_TO_MOSAIC @ source_h
        residuals.append(float(np.linalg.norm(mapped - np.array(target))))
    rms = math.sqrt(sum(value * value for value in residuals) / len(residuals))
    maximum = max(residuals)
    if rms > 0.2 or maximum > 0.5:
        raise ValueError(f"DAI plate registration residual changed: {rms=} {maximum=}")
    return {
        "page3ToMosaicAffine": PAGE3_TO_MOSAIC.round(10).tolist(),
        "controlPointCount": len(CONTROL_POINTS),
        "controlPoints": [
            {"page3": source, "page2": target, "residualPixels": round(residual, 6)}
            for (source, target), residual in zip(CONTROL_POINTS, residuals)
        ],
        "rmsResidualPixels": round(rms, 6),
        "maxResidualPixels": round(maximum, 6),
        "canvasSize": CANVAS_SIZE,
        "reviewedSeamX": SEAM_X,
        "downsampleFactor": DOWNSAMPLE,
    }


def source_masks(image: np.ndarray, page_number: int) -> tuple[np.ndarray, np.ndarray]:
    values = image.astype(np.int16)
    r, g, b = values[:, :, 0], values[:, :, 1], values[:, :, 2]
    podium = ((r - g >= 7) & (b - g >= 2) & (r <= 250) & (b <= 250)).astype(np.uint8)
    spread = values.max(axis=2) - values.min(axis=2)
    hypogeum = ((spread <= 12) & (values.max(axis=2) <= 230)).astype(np.uint8)

    for mask in (podium, hypogeum):
        mask[:12] = 0
        mask[-12:] = 0
        mask[:, :12] = 0
        mask[:, -12:] = 0
    if page_number == 2:
        for mask in (podium, hypogeum):
            mask[:650, :1700] = 0
            mask[3550:, :1100] = 0
    else:
        for mask in (podium, hypogeum):
            mask[:650, 4200:] = 0
            mask[3550:, 4650:] = 0
    return podium, hypogeum


def stitch(left: np.ndarray, right: np.ndarray, interpolation: int) -> np.ndarray:
    width, height = CANVAS_SIZE
    if left.ndim == 3:
        canvas = np.full((height, width, left.shape[2]), 255, dtype=left.dtype)
        canvas[: left.shape[0], : left.shape[1]] = left
        border = (255, 255, 255)
    else:
        canvas = np.zeros((height, width), dtype=left.dtype)
        canvas[: left.shape[0], : left.shape[1]] = left
        border = 0
    warped = cv2.warpAffine(
        right,
        PAGE3_TO_MOSAIC,
        (width, height),
        flags=interpolation,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=border,
    )
    canvas[:, SEAM_X:] = warped[:, SEAM_X:]
    return canvas


def retain_source_components(raw: np.ndarray, minimum_area: int) -> tuple[np.ndarray, dict]:
    selector = cv2.morphologyEx(raw, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(selector, 8)
    retained = []
    rejected_text_like = []
    for index in range(1, count):
        x, y, width, height, area = [int(value) for value in stats[index]]
        ratio = max(width / max(height, 1), height / max(width, 1))
        text_like = ratio > 5 and min(width, height) < 30
        if area >= minimum_area and width >= 3 and height >= 3 and not text_like:
            retained.append(index)
        elif text_like:
            rejected_text_like.append(index)
    output = raw & np.isin(labels, retained).astype(np.uint8)
    return output, {
        "selectorComponents": count - 1,
        "retainedComponents": len(retained),
        "rejectedTextLikeComponents": len(rejected_text_like),
        "retainedPixels": int(output.sum()),
        "selectorAddsNoOutputPixels": int((output & (1 - raw)).sum()) == 0,
    }


def classify_theme(raw: np.ndarray, minimum_area: int) -> tuple[np.ndarray, np.ndarray, dict]:
    retained, component_audit = retain_source_components(raw, minimum_area)
    core = cv2.morphologyEx(retained, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    walls = retained & cv2.dilate(core, np.ones((3, 3), np.uint8))
    details = retained & (1 - walls)
    if int(((walls | details) & (1 - raw)).sum()):
        raise ValueError("Theme classification emitted pixels outside source theme")
    return walls, details, {
        **component_audit,
        "sourceThemePixels": int(raw.sum()),
        "wallPixels": int(walls.sum()),
        "flatDetailPixels": int(details.sum()),
        "emittedPixelsOutsideSourceTheme": 0,
    }


def pool(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    out_height = math.ceil(height / DOWNSAMPLE)
    out_width = math.ceil(width / DOWNSAMPLE)
    padded = np.zeros((out_height * DOWNSAMPLE, out_width * DOWNSAMPLE), np.uint8)
    padded[:height, :width] = mask
    return padded.reshape(out_height, DOWNSAMPLE, out_width, DOWNSAMPLE).max(axis=(1, 3))


def comparison(
    name: str,
    source: np.ndarray,
    walls: np.ndarray,
    details: np.ndarray,
) -> None:
    source_small = cv2.resize(
        source, (walls.shape[1], walls.shape[0]), interpolation=cv2.INTER_AREA
    )
    semantic = np.full(source_small.shape, 255, np.uint8)
    semantic[details.astype(bool)] = 128
    semantic[walls.astype(bool)] = 0
    overlay = source_small.copy()
    red = np.array([220, 42, 42], dtype=np.float32)
    blue = np.array([24, 107, 210], dtype=np.float32)
    wall_pixels = walls.astype(bool)
    detail_pixels = details.astype(bool)
    overlay[wall_pixels] = (overlay[wall_pixels] * 0.42 + red * 0.58).astype(np.uint8)
    overlay[detail_pixels] = (overlay[detail_pixels] * 0.42 + blue * 0.58).astype(np.uint8)
    canvas = Image.new(
        "RGB", (source_small.shape[1] * 3, source_small.shape[0] + 42), "white"
    )
    for index, image in enumerate((source_small, semantic, overlay)):
        canvas.paste(Image.fromarray(image), (index * source_small.shape[1], 42))
    draw = ImageDraw.Draw(canvas)
    for index, title in enumerate(("REGISTERED SOURCE", "SEMANTIC", "SOURCE OVERLAY")):
        draw.text((index * source_small.shape[1] + 10, 12), title, fill="black")
    canvas.resize((math.ceil(canvas.width / 2), math.ceil(canvas.height / 2))).save(
        QA / f"{name}-source-semantic-comparison.jpg", quality=92
    )


def save_pdf(levels: list[tuple[str, np.ndarray, np.ndarray]]) -> None:
    document = fitz.open()
    for _, walls, details in levels:
        semantic = np.full((walls.shape[0], walls.shape[1], 3), 255, np.uint8)
        semantic[details.astype(bool)] = 128
        semantic[walls.astype(bool)] = 0
        buffer = io.BytesIO()
        Image.fromarray(semantic).save(buffer, format="PNG", optimize=True)
        page = document.new_page(width=walls.shape[1], height=walls.shape[0])
        page.insert_image(page.rect, stream=buffer.getvalue())
    document.save(OUTPUT, deflate=True, no_new_id=True)
    document.close()


def checkpoint_audit(levels: list[tuple[str, np.ndarray, np.ndarray]]) -> dict:
    result = {}
    signatures = {}
    for name, walls, details in levels:
        signatures[name] = hashlib.sha256(
            np.stack((walls, details), axis=2).tobytes()
        ).hexdigest()
        floor_result = {}
        for checkpoint, spec in REVIEWED_CHECKPOINTS[name].items():
            x0, y0, x1, y1 = spec["rect"]
            wall_pixels = int(walls[y0:y1, x0:x1].sum())
            detail_pixels = int(details[y0:y1, x0:x1].sum())
            area = (x1 - x0) * (y1 - y0)
            wall_ratio = wall_pixels / area
            if wall_pixels < spec.get("minWallPixels", 0):
                raise ValueError(f"Wall checkpoint failed: {name} {checkpoint}")
            if detail_pixels < spec.get("minDetailPixels", 0):
                raise ValueError(f"Detail checkpoint failed: {name} {checkpoint}")
            if wall_ratio > spec.get("maxWallRatio", 1):
                raise ValueError(f"Open-area checkpoint failed: {name} {checkpoint}")
            floor_result[checkpoint] = {
                "rect": spec["rect"],
                "wallPixels": wall_pixels,
                "flatDetailPixels": detail_pixels,
                "wallRatio": round(wall_ratio, 6),
                "review": (
                    "窗口由 DAI 图版语义叠图人工审阅；仅检查来源主题在关键结构区的保留，"
                    "不把窗口本身解释为房间边界。"
                ),
            }
        result[name] = floor_result
    if len(set(signatures.values())) != len(signatures):
        raise ValueError("Colosseum source levels collapsed to duplicate semantic geometry")
    return {
        "floors": result,
        "semanticSignatures": signatures,
        "duplicateSemanticGeometry": False,
    }


def main() -> None:
    if digest(PLATE) != EXPECTED_SHA256:
        raise ValueError("DAI supplementary plate checksum changed")
    QA.mkdir(parents=True, exist_ok=True)
    images = load_images()
    registration = registration_audit()
    page_masks = {page: source_masks(image, page) for page, image in images.items()}
    podium_raw = stitch(page_masks[2][0], page_masks[3][0], cv2.INTER_NEAREST)
    hypogeum_raw = stitch(page_masks[2][1], page_masks[3][1], cv2.INTER_NEAREST)
    source_mosaic = stitch(images[2], images[3], cv2.INTER_LINEAR)

    podium_walls, podium_details, podium_audit = classify_theme(podium_raw, 100)
    hypogeum_walls, hypogeum_details, hypogeum_audit = classify_theme(hypogeum_raw, 120)
    pooled_levels = []
    for name, walls, details in (
        ("hypogeum-level-2", hypogeum_walls, hypogeum_details),
        ("podium-level-3", podium_walls, podium_details),
    ):
        pooled_walls = pool(walls)
        pooled_details = pool(details) & (1 - pooled_walls)
        pooled_levels.append((name, pooled_walls, pooled_details))
        comparison(name, source_mosaic, pooled_walls, pooled_details)

    save_pdf(pooled_levels)
    checkpoints = checkpoint_audit(pooled_levels)
    preview = cv2.resize(
        source_mosaic,
        (math.ceil(source_mosaic.shape[1] / 4), math.ceil(source_mosaic.shape[0] / 4)),
        interpolation=cv2.INTER_AREA,
    )
    Image.fromarray(preview).save(QA / "registered-source-mosaic.jpg", quality=92)
    audit = {
        "source": {
            "file": str(PLATE.relative_to(ROOT)),
            "sha256": digest(PLATE),
            "pages": [2, 3],
            "imageXrefs": {str(page): spec["xref"] for page, spec in EXPECTED_IMAGES.items()},
            "nativeImageSizes": {str(page): spec["size"] for page, spec in EXPECTED_IMAGES.items()},
            "plateLegend": {
                "hypogeum": "Theme IPOGEI Ebene 2 / Livello 2",
                "podium": "Theme PODIO Ebene 3 PODIO / Livello 3 PODIO",
            },
        },
        "registration": registration,
        "classification": {
            "hypogeum-level-2": hypogeum_audit,
            "podium-level-3": podium_audit,
        },
        "semanticOutput": {
            "file": str(OUTPUT.relative_to(ROOT)),
            "sha256": digest(OUTPUT),
            "pageOrder": ["hypogeum-level-2", "podium-level-3"],
            "size": [int(pooled_levels[0][1].shape[1]), int(pooled_levels[0][1].shape[0])],
            "downsampleRule": "Each semantic output cell is a 4x4 source-theme pixel union; wall wins over detail within a cell.",
            "generatedFootprints": 0,
        },
    }
    (QA / "registration.json").write_text(
        json.dumps(registration, ensure_ascii=False, indent=2) + "\n"
    )
    (QA / "classification-audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n"
    )
    (QA / "critical-wall-checkpoints.json").write_text(
        json.dumps(checkpoints, ensure_ascii=False, indent=2) + "\n"
    )
    print(OUTPUT)
    print(QA / "registration.json")
    print(QA / "classification-audit.json")


if __name__ == "__main__":
    main()
