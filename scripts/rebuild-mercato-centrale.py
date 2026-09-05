#!/usr/bin/env python3
"""Derive the historic Mercato ground plan, then run the shared builder."""

from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import os
import re
import subprocess
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "sources/floorplans/venues/mercato-centrale.json"
GENERATOR_PATH = ROOT / "scripts/build-architectural-plans.py"
MODEL_PATH = ROOT / "app/data/architectural-plans/mercato-centrale.json"
EVIDENCE_PATH = ROOT / "sources/floorplans/evidence/mercato-centrale.json"
ORIGINAL_PATH = ROOT / "sources/floorplans/mercato-centrale-comune-historic.pdf"
DERIVED_PDF_PATH = ROOT / "sources/floorplans/mercato-centrale-comune-historic-reviewed.pdf"
DERIVED_MASK_PATH = ROOT / "work/renders/mercato-historic-ground-reviewed-mask.png"
SOURCE_OVERLAY_PATH = ROOT / "work/renders/mercato-historic-ground-source-overlay.png"
MODEL_PREVIEW_PATH = ROOT / "work/renders/generated-mercato-historic-ground.png"
VALIDATION_PATH = ROOT / "work/validation-mercato-ground.json"
ORIGINAL_SHA256 = "b248daf2d9e2acfc5293dc167b9db806d52fa5f6aa12a65d06bd385c0b05b680"
ORIGINAL_URL = "https://cultura.comune.fi.it/system/files/2018-12/Dal_mercato_vecchio_ai_nuovi_mercati.pdf"
SOURCE_ID = "historic-ground-reviewed"
HAN = re.compile(r"[\u4e00-\u9fff]")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_generator():
    spec = importlib.util.spec_from_file_location("architectural_plan_generator", GENERATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load shared generator: {GENERATOR_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def validate_runtime_schema(model_path: Path):
    validator = Path(
        os.environ.get(
            "ARCHITECTURAL_PLAN_VALIDATOR",
            ROOT / "app/lib/architectural-plan.ts",
        )
    ).resolve()
    if not validator.is_file():
        raise FileNotFoundError(
            "Set ARCHITECTURAL_PLAN_VALIDATOR to the main checkout's "
            "app/lib/architectural-plan.ts when rebuilding from a scratch root"
        )
    program = """
import fs from 'node:fs';
const { validateArchitecturalPlan } = await import(process.argv[1]);
const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const errors = validateArchitecturalPlan(plan);
console.log(JSON.stringify(errors));
if (errors.length) process.exit(1);
"""
    result = subprocess.run(
        [
            "node",
            "--experimental-strip-types",
            "--input-type=module",
            "-e",
            program,
            validator.as_uri(),
            str(model_path),
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    errors = json.loads(result.stdout.strip() or "[]")
    if result.returncode or errors:
        raise RuntimeError(f"validateArchitecturalPlan rejected model: {errors}\n{result.stderr}")
    return {"path": str(validator), "sha256": sha256(validator), "errors": errors}


def source_image() -> np.ndarray:
    if sha256(ORIGINAL_PATH) != ORIGINAL_SHA256:
        raise ValueError("Historic Comune source changed; review required")
    document = fitz.open(ORIGINAL_PATH)
    page = document[55]
    images = {item[0]: item for item in page.get_images(full=True)}
    if 140 not in images or images[140][2:4] != (638, 598):
        raise ValueError("Expected page-56 xref 140 at 638 by 598 pixels")
    pixmap = fitz.Pixmap(document, 140)
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3].copy()
    document.close()
    return rgb


def reviewed_masks(rgb: np.ndarray):
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    background = cv2.GaussianBlur(grey, (0, 0), 5)
    contrast = background.astype(np.int16) - grey.astype(np.int16)
    detail = (contrast >= 8).astype(np.uint8)
    footprint = np.zeros_like(detail)
    footprint[85:525, 65:565] = 1
    detail &= footprint

    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    red_supports = (
        ((hsv[:, :, 0] <= 12) | (hsv[:, :, 0] >= 170))
        & (hsv[:, :, 1] >= 125)
        & (hsv[:, :, 2] <= 245)
    ).astype(np.uint8)
    red_supports &= footprint

    perimeter = np.zeros_like(detail)
    perimeter[85:118, 65:565] = 1
    perimeter[488:525, 65:565] = 1
    perimeter[85:525, 65:92] = 1
    perimeter[85:525, 542:565] = 1
    wall = cv2.morphologyEx(
        detail & perimeter,
        cv2.MORPH_OPEN,
        np.ones((2, 2), np.uint8),
    )
    wall &= detail
    wall |= red_supports

    flat = detail & (1 - wall)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(flat, connectivity=8)
    removed = np.zeros_like(flat)
    removed_components = 0
    for index in range(1, count):
        x, y, width, height, area = stats[index]
        inside_stalls = 90 <= x and x + width <= 545 and 115 <= y and y + height <= 500
        glyph_sized = area <= 80 and width <= 20 and height <= 16
        if inside_stalls and glyph_sized:
            removed[labels == index] = 1
            removed_components += 1
    flat &= 1 - removed
    horizontal = cv2.morphologyEx(flat, cv2.MORPH_OPEN, np.ones((1, 5), np.uint8))
    vertical = cv2.morphologyEx(flat, cv2.MORPH_OPEN, np.ones((5, 1), np.uint8))
    flat = (horizontal | vertical) & (1 - wall)

    count, labels, stats, _ = cv2.connectedComponentsWithStats(flat, connectivity=8)
    line_prune = np.zeros_like(flat)
    for index in range(1, count):
        x, y, width, height, area = stats[index]
        inside_stalls = 90 <= x and x + width <= 545 and 115 <= y and y + height <= 500
        glyph_fragment = area <= 100 and width <= 25 and height <= 20
        if inside_stalls and glyph_fragment:
            line_prune[labels == index] = 1
            removed_components += 1
    flat &= 1 - line_prune
    return wall, flat, removed | line_prune, removed_components


def write_derived_source(rgb: np.ndarray, wall: np.ndarray, detail: np.ndarray):
    derived = np.full_like(rgb, 255)
    derived[detail.astype(bool)] = 150
    derived[wall.astype(bool)] = 35
    DERIVED_MASK_PATH.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(derived).save(DERIVED_MASK_PATH)
    buffer = io.BytesIO()
    Image.fromarray(derived).save(buffer, format="PNG")
    document = fitz.open()
    page = document.new_page(width=rgb.shape[1], height=rgb.shape[0])
    page.insert_image(page.rect, stream=buffer.getvalue())
    if DERIVED_PDF_PATH.exists():
        DERIVED_PDF_PATH.unlink()
    # The reviewed pixel sheet is a pinned build input. Omit PyMuPDF's random
    # trailer ID so identical source masks produce byte-identical PDFs.
    document.save(
        DERIVED_PDF_PATH,
        garbage=4,
        deflate=True,
        no_new_id=True,
        preserve_metadata=False,
    )
    document.close()
    check = fitz.open(DERIVED_PDF_PATH)
    images = check[0].get_images(full=True)
    if len(images) != 1:
        raise ValueError("Derived source must contain exactly one image")
    xref = images[0][0]
    if images[0][2:4] != (638, 598):
        raise ValueError("Derived source image dimensions changed")
    check.close()
    return xref, sha256(DERIVED_PDF_PATH)


def write_config(config: dict, xref: int, derived_sha: str):
    source = {
        "id": SOURCE_ID,
        "file": DERIVED_PDF_PATH.name,
        "url": ORIGINAL_URL,
        "sha256": derived_sha,
        "sourceProjection": {
            "kind": "orthographic",
            "pages": [1],
            "basis": "One-page reviewed pixel extraction of the direct top-view 1:100 historic ground plan printed on official Comune di Firenze publication page 56. Source pixels are classified without perspective transformation; numbered glyph islands are removed, while stall boundaries, perimeter structure and iron supports retain their original image coordinates.",
        },
        "derivedFrom": {
            "file": ORIGINAL_PATH.name,
            "url": ORIGINAL_URL,
            "sha256": ORIGINAL_SHA256,
            "page": 56,
            "imageXref": 140,
            "imageSize": [638, 598],
        },
    }
    config["sourceFiles"] = [
        item for item in config.get("sourceFiles", []) if item["id"] != SOURCE_ID
    ] + [source]
    ground = {
        "id": "ground-historic",
        "label": "底层 · 1869年历史摊位平面",
        "order": 0,
        "sourceId": SOURCE_ID,
        "page": 1,
        "crop": [65, 95, 570, 520],
        "rules": [],
        "spaces": [
            {
                "id": "historic-market-floor",
                "label": "历史市场大厅平面范围",
                "placeId": "ground-historic-历史摊位网格-1",
                "tone": "neutral",
                "outer": [[74, 102], [555, 102], [555, 513], [74, 513], [74, 102]],
                "sourcePaths": [],
                "evidence": "Reviewed rectangular inner market footprint follows the continuous perimeter of the official 1869 ground plan. It is a historical hall surface beneath the stall grid, not a claim about current merchant access.",
            }
        ],
        "rasterLayers": [
            {
                "xref": xref,
                "rgbRange": [[0, 0, 0], [70, 70, 70]],
                "wallKernel": 1,
                "includeKinds": ["wall"],
                "tolerancePixels": 0.15,
                "minAreaPixels": 0.5,
                "tone": "stone",
                "reason": "Black reviewed channel in the derived source: exact original red iron-support pixels plus thick perimeter structural ink selected from the official historic plan.",
            },
            {
                "xref": xref,
                "rgbRange": [[120, 120, 120], [180, 180, 180]],
                "wallKernel": 1,
                "allInkIsDetail": True,
                "includeKinds": ["detail"],
                "tolerancePixels": 0.15,
                "minAreaPixels": 0.5,
                "tone": "stone",
                "reason": "Grey reviewed channel in the derived source: locally contrasted horizontal and vertical historic stall boundaries after individual small numeral, letter and residual glyph-stroke components are removed; retained flat, never extruded as walls.",
            },
        ],
        "places": [
            {
                "label": "历史摊位网格",
                "name": "1869年历史底层摊位网格",
                "at": [315, 305],
                "kind": "area",
                "evidence": "Anchor in the central cross aisle of the official plan, whose caption identifies assigned vendor-category positions on the 1869 ground floor.",
                "precision": "reviewed-historic-plan-zone-center-not-current-stall-location",
            }
        ],
    }
    config["floors"] = [item for item in config["floors"] if item["id"] != ground["id"]] + [ground]
    config["floors"].sort(key=lambda item: item["order"])
    config["stopBindings"] = [
        item for item in config.get("stopBindings", []) if item["stopIndex"] != 1
    ] + [{"stopIndex": 1, "placeId": "ground-historic-历史摊位网格-1"}]
    config["review"] = (
        "Two independent orthographic sources are used without geometric stacking. Archea Associati page 2 supplies the contemporary reuse-project upper hall. "
        "Comune di Firenze publication page 56 reproduces the 1869 ground-floor construction plan at 1:100, captioned as vendor-category positions. "
        "The historic page's native 638 by 598 raster is converted reproducibly into a two-channel reviewed source: exact red iron supports and thick perimeter ink are walls; local-contrast stall boundaries survive horizontal or vertical length filtering as flat detail; isolated numeral, letter and residual glyph-stroke components are removed. "
        "The historical plan is not represented as the present-day merchant layout."
    )
    config["limitations"] = [
        "底层采用佛罗伦萨市政府出版物所载1869年1:100历史平面；它证明历史摊位网格与结构，不代表当前商户、铺位编号或开放范围。",
        "历史原图的红色铁构件与外圈粗结构线归为墙；摊位边界保留为平面细节，独立的小型数字与文字连通块已剔除，不把房号字形当作几何。",
        "历史底层与改造后的上层项目图比例彼此独立，只作分层显示，不做测量配准，也不生成推测性跨层连接。",
        "停点1绑定历史底层摊位网格；停点2和3仍绑定上层项目平面。停点0外立面没有室内平面锚点，保持未解决。",
        "两份图源均不能证明现行参观路线、临时关闭或商户布置；不据此推断现场运营状态。",
    ]
    context = {
        "authority": "Comune di Firenze",
        "title": "Dal mercato vecchio ai nuovi mercati — Mercato Centrale construction plan",
        "url": ORIGINAL_URL + "#page=56",
        "finding": "Printed page 52 / PDF page 56 captions the plate as the ground floor with positions assigned to vendor categories, construction project 1869, scale 1:100, ASCFi Fondo disegni car. 003/003.",
    }
    config["contextSources"] = [
        item for item in config.get("contextSources", []) if item["url"] != context["url"]
    ] + [context]
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")


def polygon_mask(size: tuple[int, int], polygon: dict) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon([tuple(point) for point in polygon["outer"]], fill=255)
    for hole in polygon.get("holes", []):
        draw.polygon([tuple(point) for point in hole], fill=0)
    return mask


def render_model(model: dict) -> None:
    floor = next(item for item in model["floors"] if item["id"] == "ground-historic")
    min_x, min_y, max_x, max_y = floor["bounds"]
    margin = 35
    scale = min((1200 - margin * 2) / (max_x - min_x), (900 - margin * 2) / (max_y - min_y))
    size = (1200, 900)
    canvas = Image.new("RGBA", size, (248, 246, 241, 255))
    colors = {"surface": (211, 220, 211, 255), "detail": (151, 126, 75, 150), "wall": (58, 56, 51, 255)}

    def translated(poly: dict):
        def point(value):
            return [margin + (value[0] - min_x) * scale, margin + (value[1] - min_y) * scale]
        return {
            "outer": [point(item) for item in poly["outer"]],
            "holes": [[point(item) for item in ring] for ring in poly.get("holes", [])],
        }

    for feature in floor["features"]:
        for polygon in feature["polygons"]:
            screen = translated(polygon)
            layer = Image.new("RGBA", size, colors[feature["kind"]])
            canvas = Image.composite(layer, canvas, polygon_mask(size, screen))
    canvas.convert("RGB").save(MODEL_PREVIEW_PATH)


def render_source_overlay(rgb: np.ndarray, wall: np.ndarray, detail: np.ndarray) -> None:
    base = Image.fromarray(rgb).convert("RGBA")
    floor_mask = Image.new("L", base.size, 0)
    ImageDraw.Draw(floor_mask).polygon([(74, 102), (555, 102), (555, 513), (74, 513)], fill=255)
    floor_layer = Image.new("RGBA", base.size, (18, 170, 125, 85))
    transparent = Image.new("RGBA", base.size, (0, 0, 0, 0))
    base = Image.alpha_composite(base, Image.composite(floor_layer, transparent, floor_mask))
    detail_layer = Image.new("RGBA", base.size, (26, 88, 180, 0))
    detail_layer.putalpha(Image.fromarray((detail * 185).astype(np.uint8)))
    base = Image.alpha_composite(base, detail_layer)
    wall_layer = Image.new("RGBA", base.size, (198, 39, 45, 0))
    wall_layer.putalpha(Image.fromarray((wall * 220).astype(np.uint8)))
    base = Image.alpha_composite(base, wall_layer)
    base.save(SOURCE_OVERLAY_PATH)


def main() -> None:
    generator = load_generator()
    rgb = source_image()
    wall, detail, removed, removed_components = reviewed_masks(rgb)
    xref, derived_sha = write_derived_source(rgb, wall, detail)
    config = json.loads(CONFIG_PATH.read_text())
    write_config(config, xref, derived_sha)
    config = json.loads(CONFIG_PATH.read_text())
    generator.build(config)
    first_hashes = (sha256(MODEL_PATH), sha256(EVIDENCE_PATH))
    generator.build(config)
    stable = first_hashes == (sha256(MODEL_PATH), sha256(EVIDENCE_PATH))
    runtime = validate_runtime_schema(MODEL_PATH)
    model = json.loads(MODEL_PATH.read_text())
    evidence = json.loads(EVIDENCE_PATH.read_text())
    ground = next(item for item in model["floors"] if item["id"] == "ground-historic")
    checks = {
        "originalSourceHashMatches": sha256(ORIGINAL_PATH) == ORIGINAL_SHA256,
        "derivedSourceHashMatches": sha256(DERIVED_PDF_PATH) == derived_sha,
        "builderHash": sha256(GENERATOR_PATH),
        "normalSharedBuilderRebuildStable": stable,
        "postBuildModelMutation": False,
        "runtimeValidator": runtime,
        "floorCount": len(model["floors"]),
        "featureCount": evidence["coverage"]["features"],
        "groundWallFeatureCount": sum(item["kind"] == "wall" for item in ground["features"]),
        "groundSurfaceFeatureCount": sum(item["kind"] == "surface" for item in ground["features"]),
        "groundDetailFeatureCount": sum(item["kind"] == "detail" for item in ground["features"]),
        "removedGlyphLikeComponentCount": removed_components,
        "removedGlyphLikePixelCount": int(removed.sum()),
        "spaceCount": len(model.get("spaces", [])),
        "resolvedStops": [item["stopIndex"] for item in model["stopBindings"]],
        "unresolvedStops": [0],
        "allPublicFloorLabelsChinese": all(HAN.search(item["label"]) for item in model["floors"]),
        "allPlaceLabelsChinese": all(HAN.search(item["label"]) for item in model["places"]),
    }
    checks["pass"] = all(
        [
            checks["originalSourceHashMatches"],
            checks["derivedSourceHashMatches"],
            checks["normalSharedBuilderRebuildStable"],
            checks["runtimeValidator"]["errors"] == [],
            checks["floorCount"] == 2,
            checks["groundWallFeatureCount"] > 0,
            checks["groundSurfaceFeatureCount"] == 1,
            checks["groundDetailFeatureCount"] > 0,
            checks["removedGlyphLikeComponentCount"] > 1000,
            checks["spaceCount"] == 2,
            checks["allPublicFloorLabelsChinese"],
            checks["allPlaceLabelsChinese"],
        ]
    )
    VALIDATION_PATH.write_text(json.dumps(checks, ensure_ascii=False, indent=2) + "\n")
    render_source_overlay(rgb, wall, detail)
    render_model(model)
    if not checks["pass"]:
        raise SystemExit("Mercato ground validation failed")
    print(json.dumps(checks, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
