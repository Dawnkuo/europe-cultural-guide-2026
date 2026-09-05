#!/usr/bin/env python3
"""Write source-derived Medici config geometry, then run the shared builder."""

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
from shapely.affinity import affine_transform
from shapely.geometry import Point, Polygon, box


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "sources/floorplans/venues/medici-chapels.json"
GENERATOR_PATH = ROOT / "scripts/build-architectural-plans.py"
MODEL_PATH = ROOT / "app/data/architectural-plans/medici-chapels.json"
EVIDENCE_PATH = ROOT / "sources/floorplans/evidence/medici-chapels.json"
VALIDATION_PATH = ROOT / "work/validation-medici-v11.json"
SOURCE_OVERLAY_PATH = ROOT / "work/renders/medici-crypt-level-source-derived-overlay-v11.png"
MODEL_PREVIEW_PATH = ROOT / "work/renders/generated-medici-chapels-crypt-level-v11.png"
SACRISTY_SOURCE_OVERLAY_PATH = ROOT / "work/renders/medici-new-sacristy-source-derived-overlay-v11.png"
SACRISTY_MODEL_PREVIEW_PATH = ROOT / "work/renders/generated-medici-new-sacristy-v11.png"
LORRAINE_SOURCE_OVERLAY_PATH = ROOT / "work/renders/medici-lorraine-crypt-source-overlay-v11.png"
LORRAINE_MODEL_PREVIEW_PATH = ROOT / "work/renders/generated-medici-lorraine-crypt-v11.png"
PRINCES_SOURCE_OVERLAY_PATH = ROOT / "work/renders/medici-princes-chapel-source-overlay-v11.png"
PRINCES_MODEL_PREVIEW_PATH = ROOT / "work/renders/generated-medici-princes-chapel-v11.png"
SACRISTY_SOURCE_ID = "new-sacristy-survey"
SACRISTY_SOURCE = {
    "id": SACRISTY_SOURCE_ID,
    "file": "medici-new-sacristy-survey.pdf",
    "url": "https://iris.uniroma1.it/retrieve/ae977f6d-b4d7-4fd2-a839-abf57bf1d655/Bianchini_Spazio-rivelato_2023.pdf",
    "sha256": "7c1f1f17a430e62e16907f17bdf1ba142b03d090ede75e0a990ebbcf8ac5b689",
    "sourceProjection": {
        "kind": "orthographic",
        "pages": [18],
        "basis": "Figure 4 is captioned 'Planimetria della Sagrestia Nuova'. It is a direct top view at the article's stated 1:50 architectural analysis scale, produced from the integrated 2019 laser-scanner, photogrammetric and direct survey. The adjacent elevation and coordinate ticks are outside the extraction crop.",
    },
}
PRINCES_SOURCE_ID = "princes-chapel-iccd-historic"
PRINCES_ORIGINAL_PATH = ROOT / "sources/floorplans/medici-princes-iccd-0900335014.jpg"
PRINCES_ORIGINAL_SHA256 = "829fb4c15bb93d1a0c3d08a4c86fc5226eb1e8adeab73307783b3b983d2dd065"
PRINCES_REVIEWED_PATH = ROOT / "sources/floorplans/medici-princes-iccd-reviewed.pdf"
PRINCES_IMAGE_URL = "https://www.sigecweb.beniculturali.it/images/fullsize/ICCD1063173/ICCD14178709_457943.jpg"
PRINCES_RECORD_URL = "https://catalogo.beniculturali.it/detail/HistoricOrArtisticProperty/0900335014"
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
    try:
        errors = json.loads(result.stdout.strip() or "[]")
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Runtime validator did not return JSON: {result.stdout}") from error
    if result.returncode or errors:
        raise RuntimeError(f"validateArchitecturalPlan rejected model: {errors}\n{result.stderr}")
    return {"path": str(validator), "sha256": sha256(validator), "errors": errors}


def pixmap_rgb(document: fitz.Document, xref: int) -> np.ndarray:
    pixmap = fitz.Pixmap(document, xref)
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    return np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3].copy()


def image_matrix(page: fitz.Page, xref: int):
    return page.get_image_rects(xref, transform=True)[0][1]


def source_to_page_coefficients(matrix: fitz.Matrix, width: int, height: int):
    return [
        matrix.a / width,
        matrix.c / height,
        matrix.b / width,
        matrix.d / height,
        matrix.e,
        matrix.f,
    ]


def pixel_rect_to_page(matrix: fitz.Matrix, width: int, height: int, rect: list[int]):
    x0, y0, x1, y1 = rect

    def point(x: float, y: float):
        return (
            matrix.a * x / width + matrix.c * y / height + matrix.e,
            matrix.b * x / width + matrix.d * y / height + matrix.f,
        )

    points = [point(x0, y0), point(x1, y0), point(x1, y1), point(x0, y1)]
    return [
        round(min(item[0] for item in points), 4),
        round(min(item[1] for item in points), 4),
        round(max(item[0] for item in points), 4),
        round(max(item[1] for item in points), 4),
    ]


def pixel_point_to_page(matrix: fitz.Matrix, width: int, height: int, point: list[int]):
    x, y = point
    return [
        round(matrix.a * x / width + matrix.c * y / height + matrix.e, 4),
        round(matrix.b * x / width + matrix.d * y / height + matrix.f, 4),
    ]


def outside_window_exclusions(
    matrix: fitz.Matrix,
    width: int,
    height: int,
    window: list[int],
    reason: str,
):
    x0, y0, x1, y1 = window
    pixel_rects = [
        [0, 0, width, y0],
        [0, y1, width, height],
        [0, y0, x0, y1],
        [x1, y0, width, y1],
    ]
    return [
        {"rect": pixel_rect_to_page(matrix, width, height, rect), "reason": reason}
        for rect in pixel_rects
        if rect[2] > rect[0] and rect[3] > rect[1]
    ]


def select_crypt_surface(rgb: np.ndarray, recipe: dict, generator):
    method = recipe["boundaryMethod"]
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    averaged = cv2.boxFilter(
        grey,
        ddepth=-1,
        ksize=(method["kernelPixels"], method["kernelPixels"]),
        normalize=True,
    )
    barrier = (averaged < method["maxLuminance"]).astype(np.uint8)
    for cut in recipe["reviewedDoorCutsPixels"]:
        x0, y0, x1, y1 = cut["rect"]
        barrier[y0:y1, x0:x1] = 1

    x0, y0, x1, y1 = recipe["imageCropPixels"]
    passable = np.zeros_like(barrier)
    passable[y0:y1, x0:x1] = 1
    passable &= 1 - barrier
    _, labels = cv2.connectedComponents(passable, connectivity=4)
    seed_x, seed_y = recipe["seedPixel"]
    selected = (labels == labels[seed_y, seed_x]).astype(np.uint8)
    if selected[y0, :].any() or selected[y1 - 1, :].any() or selected[:, x0].any() or selected[:, x1 - 1].any():
        raise ValueError("Crypt floor flood reaches the reviewed crop edge")

    traced = generator.trace_pixel_ink(selected, tolerance=0.2)
    parts = [traced] if traced.geom_type == "Polygon" else list(traced.geoms)
    containing = [part for part in parts if part.covers(Point(seed_x, seed_y))]
    if len(containing) != 1:
        raise ValueError("Crypt floor seed does not resolve to one polygon")
    polygon = containing[0]
    retained_holes = []
    for center in recipe["preserveHoleCentersPixels"]:
        point = Point(*center)
        matches = [ring for ring in polygon.interiors if Polygon(ring).covers(point)]
        if len(matches) != 1:
            raise ValueError(f"Expected one source pier hole at {center}, found {len(matches)}")
        retained_holes.append(list(matches[0].coords))
    reviewed = Polygon(polygon.exterior.coords, retained_holes)
    if not reviewed.is_valid or len(reviewed.interiors) != 4:
        raise ValueError("Reviewed crypt floor must retain exactly four source pier holes")
    return reviewed, selected


def select_sacristy_surface(rgb: np.ndarray, recipe: dict, generator):
    method = recipe["boundaryMethod"]
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    barrier = (grey <= method["maxLuminance"]).astype(np.uint8)
    barrier = cv2.morphologyEx(
        barrier,
        cv2.MORPH_CLOSE,
        np.ones((method["closeKernelPixels"], method["closeKernelPixels"]), np.uint8),
    )
    for region in recipe["reviewedInteriorClearPixels"]:
        x0, y0, x1, y1 = region["rect"]
        barrier[y0:y1, x0:x1] = 0
    for cut in recipe["reviewedFloorOnlyCutsPixels"]:
        x0, y0, x1, y1 = cut["rect"]
        barrier[y0:y1, x0:x1] = 1

    x0, y0, x1, y1 = recipe["imageCropPixels"]
    passable = np.zeros_like(barrier)
    passable[y0:y1, x0:x1] = 1
    passable &= 1 - barrier
    _, labels = cv2.connectedComponents(passable, connectivity=4)
    seed_x, seed_y = recipe["seedPixel"]
    selected = (labels == labels[seed_y, seed_x]).astype(np.uint8)
    if (
        selected[y0, :].any()
        or selected[y1 - 1, :].any()
        or selected[:, x0].any()
        or selected[:, x1 - 1].any()
    ):
        raise ValueError("New Sacristy floor flood reaches the reviewed crop edge")

    traced = generator.trace_pixel_ink(selected, tolerance=0.2)
    parts = [traced] if traced.geom_type == "Polygon" else list(traced.geoms)
    containing = [part for part in parts if part.covers(Point(seed_x, seed_y))]
    if len(containing) != 1:
        raise ValueError("New Sacristy seed does not resolve to one polygon")
    # The closed source outlines inside this floor are altar and tomb detail,
    # not piers. Keep the walking surface continuous and render those objects flat.
    reviewed = Polygon(containing[0].exterior.coords)
    if not reviewed.is_valid or reviewed.area < 100_000:
        raise ValueError("New Sacristy reviewed floor surface is invalid or unexpectedly small")
    return reviewed, selected, barrier


def write_derived_config(config: dict, generator):
    floor = config["floors"][0]
    document = fitz.open(ROOT / "sources/floorplans" / config["file"])
    page = document[floor["page"] - 1]
    wall_layer = next(layer for layer in floor["rasterLayers"] if not layer.get("generatedBy"))
    xref = wall_layer["xref"]
    rgb = pixmap_rgb(document, xref)
    matrix = image_matrix(page, xref)
    transform = source_to_page_coefficients(matrix, rgb.shape[1], rgb.shape[0])
    recipe = floor["derivedSpaceMasks"][0]
    source_surface, selected = select_crypt_surface(rgb, recipe, generator)
    page_surface = affine_transform(source_surface, transform).intersection(box(*floor["crop"]))
    rings = generator.polygons(page_surface, [0, 0])
    if len(rings) != 1 or len(rings[0]["holes"]) != 4:
        raise ValueError("PDF-coordinate crypt floor must remain one polygon with four holes")
    floor["spaces"] = [
        {
            "id": recipe["id"],
            "label": recipe["label"],
            "placeId": recipe["placeId"],
            "tone": recipe["tone"],
            "polygons": rings,
            "sourcePaths": [],
            "evidence": recipe["evidence"],
        }
    ]

    generated_layers = []
    for detail in floor["reviewedDetailRects"]:
        generated_layers.append(
            {
                "xref": xref,
                "maxChannel": 170,
                "maxChroma": 12,
                "wallKernel": 1,
                "allInkIsDetail": True,
                "includeKinds": ["detail"],
                "tolerancePixels": 0.15,
                "minAreaPixels": 0.5,
                "tone": "stone",
                "excludeRects": outside_window_exclusions(
                    matrix,
                    rgb.shape[1],
                    rgb.shape[0],
                    detail["rectPixels"],
                    f"Outside reviewed {detail['id']} stair-detail window.",
                ),
                "reason": detail["reason"],
                "generatedBy": "scripts/rebuild-medici-chapels.py",
                "reviewedWindowPixels": detail["rectPixels"],
            }
        )
    floor["rasterLayers"] = [wall_layer, *generated_layers]
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    document.close()
    return rgb, source_surface, selected, wall_layer, recipe


def write_new_sacristy_config(config: dict, generator):
    config["sourceFiles"] = [
        source for source in config.get("sourceFiles", []) if source["id"] != SACRISTY_SOURCE_ID
    ] + [SACRISTY_SOURCE]
    document = fitz.open(ROOT / "sources/floorplans" / SACRISTY_SOURCE["file"])
    page_number = 18
    page = document[page_number - 1]
    xref = 219
    rgb = pixmap_rgb(document, xref)
    matrix = image_matrix(page, xref)
    recipe = {
        "id": "new-sacristy-floor",
        "label": "新圣器室步行面",
        "placeId": "new-sacristy-新圣器室-1",
        "imageXref": xref,
        "imageOccurrence": 0,
        "imageCropPixels": [160, 110, 535, 640],
        "seedPixel": [350, 450],
        "boundaryMethod": {
            "kind": "survey-black-boundary-with-reviewed-floor-only-cuts",
            "maxLuminance": 180,
            "closeKernelPixels": 3,
        },
        "reviewedInteriorClearPixels": [
            {
                "rect": [185, 280, 510, 570],
                "reason": "Remove pale pavement hatching and monuments inside the main chamber from the flood barrier; they remain available only in reviewed flat-detail windows.",
            },
            {
                "rect": [290, 125, 402, 225],
                "reason": "Remove altar and furnishing linework inside the northern recess from the flood barrier without crossing its surveyed boundary.",
            },
            {
                "rect": [280, 260, 415, 300],
                "reason": "Keep the broad surveyed connection between the northern recess and main chamber open during floor selection.",
            },
        ],
        "reviewedFloorOnlyCutsPixels": [
            {
                "rect": [205, 240, 240, 262],
                "reason": "Close the northwest doorway only for semantic floor selection so the adjacent unlabelled room is not merged into the New Sacristy.",
            },
            {
                "rect": [453, 240, 489, 262],
                "reason": "Close the northeast doorway only for semantic floor selection so the adjacent unlabelled room is not merged into the New Sacristy.",
            },
            {
                "rect": [196, 590, 246, 607],
                "reason": "Close the southwest threshold only for floor selection; the cut is not emitted as masonry.",
            },
        ],
        "tone": "neutral",
        "evidence": "Conservative source-derived New Sacristy walking surface from the 1:50 survey plan. The exterior follows the surveyed inner wall boundary, including the south central recess; three reviewed threshold closures prevent adjacent or unresolved spaces from merging, and are floor-selection cuts only, not walls.",
    }
    source_surface, selected, barrier = select_sacristy_surface(rgb, recipe, generator)
    transform = source_to_page_coefficients(matrix, rgb.shape[1], rgb.shape[0])
    page_crop = pixel_rect_to_page(matrix, rgb.shape[1], rgb.shape[0], [125, 90, 558, 630])
    page_surface = affine_transform(source_surface, transform).intersection(box(*page_crop))
    rings = generator.polygons(page_surface, [0, 0])
    if len(rings) != 1 or rings[0]["holes"]:
        raise ValueError("New Sacristy PDF-coordinate floor must be one continuous polygon without holes")

    flat_windows = [
        {
            "id": "north-altar-and-monuments",
            "rectPixels": [285, 125, 405, 230],
            "reason": "The black and grey altar or monument outlines inside the northern recess are flat architectural content, not wall mass.",
        },
        {
            "id": "central-monument",
            "rectPixels": [305, 235, 390, 288],
            "reason": "The central outlined monument and corner markers are furnishings, not wall mass.",
        },
        {
            "id": "west-tomb",
            "rectPixels": [168, 350, 210, 505],
            "reason": "The western wall-tomb drawing is retained as flat detail, not classified as structural wall.",
        },
        {
            "id": "east-tomb",
            "rectPixels": [488, 345, 530, 500],
            "reason": "The eastern wall-tomb drawing is retained as flat detail, not classified as structural wall.",
        },
    ]
    wall_layer = {
        "xref": xref,
        "maxChannel": 180,
        "maxChroma": 12,
        "wallKernel": 2,
        "includeKinds": ["wall"],
        "tolerancePixels": 0.15,
        "minAreaPixels": 1.5,
        "tone": "stone",
        "flatRects": [
            {
                "rect": pixel_rect_to_page(matrix, rgb.shape[1], rgb.shape[0], item["rectPixels"]),
                "reason": item["reason"],
            }
            for item in flat_windows
        ],
        "reason": "Reviewed dark double-line structural boundary channel from the 1:50 New Sacristy survey plan. A two-pixel opening is clamped to exact source pixels; four monument windows are demoted so tombs and altar furniture are never extruded as walls.",
    }
    detail_layers = []
    for item in flat_windows:
        detail_layers.append(
            {
                "xref": xref,
                "maxChannel": 220,
                "maxChroma": 12,
                "wallKernel": 1,
                "allInkIsDetail": True,
                "includeKinds": ["detail"],
                "tolerancePixels": 0.15,
                "minAreaPixels": 0.5,
                "tone": "stone",
                "excludeRects": outside_window_exclusions(
                    matrix,
                    rgb.shape[1],
                    rgb.shape[0],
                    item["rectPixels"],
                    f"Outside reviewed {item['id']} flat-detail window.",
                ),
                "reason": item["reason"],
                "generatedBy": "scripts/rebuild-medici-chapels.py",
                "reviewedWindowPixels": item["rectPixels"],
            }
        )

    floor = {
        "id": "new-sacristy",
        "label": "新圣器室层 · 独立图幅",
        "order": 1,
        "sourceId": SACRISTY_SOURCE_ID,
        "page": page_number,
        "crop": page_crop,
        "rules": [],
        "places": [
            {
                "label": "新圣器室",
                "name": "米开朗基罗新圣器室",
                "at": pixel_point_to_page(matrix, rgb.shape[1], rgb.shape[0], recipe["seedPixel"]),
                "kind": "room",
                "evidence": "Reviewed anchor within the main chamber on Figure 4, explicitly captioned 'Planimetria della Sagrestia Nuova'.",
                "precision": "reviewed-survey-plan-zone-center-not-surveyed-visitor-position",
            }
        ],
        "rasterLayers": [wall_layer, *detail_layers],
        "derivedSpaceMasks": [recipe],
        "reviewedDetailRects": flat_windows,
        "spaces": [
            {
                "id": recipe["id"],
                "label": recipe["label"],
                "placeId": recipe["placeId"],
                "tone": recipe["tone"],
                "polygons": rings,
                "sourcePaths": [],
                "evidence": recipe["evidence"],
            }
        ],
    }
    config["floors"] = [item for item in config["floors"] if item["id"] != floor["id"]] + [floor]
    config["stopBindings"] = [
        item for item in config.get("stopBindings", []) if item["stopIndex"] != 3
    ] + [{"stopIndex": 3, "placeId": recipe["placeId"]}]
    config["review"] = (
        "Two independent orthographic sources are used without geometric stacking. The official competition page 41 supplies the underground Medici crypt. "
        "Barni, Bianchini, Griffo and Inglese (2023), Figure 4, supplies a separately scaled 1:50 New Sacristy plan derived from integrated 2019 laser scanning, photogrammetry and direct survey. "
        "The New Sacristy extraction retains reviewed dark double-line structural boundaries as walls, keeps altar and wall-tomb windows flat, and derives a conservative main walking surface from the surveyed inner boundary. "
        "Three threshold closures are used only to prevent adjacent or unresolved rooms from merging into the semantic floor; they are not emitted as walls. No horizontal registration between the two sheets is claimed."
    )
    config["limitations"] = [
        "地下墓穴与新圣器室来自比例彼此独立的正投影图幅，只按语义层级分组显示；两图没有水平配准，也不声称楼梯井对位。",
        "地下层只复建第41页明确标为地下层的中央梅第奇墓穴；步行面保留四座柱墩孔，西侧相邻房间不并入。",
        "新圣器室采用2019年综合测绘成果的1:50平面；黑色双线结构边界归为墙，祭坛、纪念物和两侧壁墓仅在审核窗内保留为平面细节。",
        "新圣器室步行面沿测绘内墙边界派生，并保留南侧中央凹室；三处门槛只为避免相邻未命名空间并入选择面，不输出为墙，也不表示当前通行状态。",
        "新圣器室文献把图称为新圣器室平面与新圣器室标高层平面，但没有把独立图幅注册到第41页地下图，因此公开层名不编造统一楼层编号。",
        "王公礼拜堂、珍宝区与洛林墓穴尚无已接入的完整独立平面；停点1、2、4仍不绑定。",
        "图源不提供现行开放边界或参观路线，本模型不推断现场开放状态。",
    ]
    article = {
        "authority": "Sapienza Universita di Roma · IRIS",
        "title": "Lo spazio rivelato della Sagrestia Nuova di Michelangelo",
        "url": "https://iris.uniroma1.it/handle/11573/1697085",
        "finding": "Figure 4 is captioned 'Planimetria della Sagrestia Nuova'. The article states a 1:50 architectural analysis and describes the integrated 2019 laser-scanner, photogrammetric and direct survey used to produce the two-dimensional models.",
    }
    config["contextSources"] = [
        item for item in config.get("contextSources", []) if item["url"] != article["url"]
    ] + [article]
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    document.close()
    return rgb, source_surface, selected, barrier, wall_layer, recipe, flat_windows


def write_lorraine_config(config: dict):
    config["sourceProjection"]["pages"] = [33, 41]
    config["sourceProjection"]["basis"] = (
        "Official competition pages 33 and 41 contain direct top-view plans with parallel axes. "
        "Page 33 prints 'PIANTA PIANO TERRA' and 'CRIPTA LORENESE'; only its western neutral structural linework is extracted. "
        "Page 41 prints the separate upper drawing as 'pianta piano interrato'; only that drawing supplies the central crypt geometry. "
        "Photographs, perspectives, coloured project routes and the lower page-41 ground drawing are excluded."
    )
    document = fitz.open(ROOT / "sources/floorplans" / config["file"])
    page_number = 33
    page = document[page_number - 1]
    xref = 225
    rgb = pixmap_rgb(document, xref)
    matrix = image_matrix(page, xref)
    crop_pixels = [200, 550, 680, 850]
    flat_windows = [
        {
            "id": "upper-construction-note",
            "rectPixels": [330, 600, 590, 628],
            "reason": "The Italian project annotation over the crypt is text, not structure.",
        },
        {
            "id": "lorraine-label",
            "rectPixels": [300, 665, 610, 695],
            "reason": "The printed 'CRIPTA LORENESE' title supports the place anchor but its letterforms are excluded from wall geometry.",
        },
        {
            "id": "upper-datum-west",
            "rectPixels": [200, 550, 260, 570],
            "reason": "This horizontal dash-dot segment is drawing annotation rather than a room boundary.",
        },
        {
            "id": "upper-datum-centre-west",
            "rectPixels": [310, 550, 400, 570],
            "reason": "This horizontal dash-dot segment is drawing annotation rather than a room boundary.",
        },
        {
            "id": "upper-datum-centre-east",
            "rectPixels": [410, 550, 520, 570],
            "reason": "This horizontal dash-dot segment is drawing annotation rather than a room boundary.",
        },
        {
            "id": "upper-datum-east",
            "rectPixels": [530, 550, 590, 570],
            "reason": "This horizontal dash-dot segment is drawing annotation rather than a room boundary.",
        },
    ]
    wall_layer = {
        "xref": xref,
        "maxChannel": 210,
        "maxChroma": 12,
        "wallKernel": 2,
        "includeKinds": ["wall"],
        "tolerancePixels": 0.15,
        "minAreaPixels": 1.5,
        "tone": "stone",
        "flatRects": [
            {
                "rect": pixel_rect_to_page(matrix, rgb.shape[1], rgb.shape[0], item["rectPixels"]),
                "reason": item["reason"],
            }
            for item in flat_windows
        ],
        "reason": "Reviewed neutral dark structural-outline channel from the official page-33 ground plan. Two-pixel opening removes thin vault diagonals and is clamped to source pixels; coloured project routes are rejected by the neutral-chroma gate, and reviewed text/datum windows are demoted.",
    }
    floor = {
        "id": "lorraine-crypt-detail",
        "label": "底层总图 · 洛林墓穴（独立图幅）",
        "order": 0.5,
        "page": page_number,
        "crop": pixel_rect_to_page(matrix, rgb.shape[1], rgb.shape[0], crop_pixels),
        "rules": [],
        "places": [
            {
                "label": "洛林墓穴",
                "name": "洛林墓穴",
                "at": pixel_point_to_page(matrix, rgb.shape[1], rgb.shape[0], [455, 675]),
                "kind": "room",
                "evidence": "Anchor at the centre of the printed 'CRIPTA LORENESE' title on the official page-33 plan, not an inferred room centroid.",
                "precision": "printed-place-label-position-without-semantic-area-boundary",
            }
        ],
        "rasterLayers": [wall_layer],
        "reviewedFlatRects": flat_windows,
        "semanticExtent": {
            "status": "not-drawn",
            "reason": "The title identifies the western crypt room group, but the sheet does not print a boundary that distinguishes the named crypt extent from adjoining rooms. Structural walls are retained without inventing a selectable room polygon.",
        },
    }
    config["floors"] = [item for item in config["floors"] if item["id"] != floor["id"]] + [floor]
    config["floors"].sort(key=lambda item: item["order"])
    config["stopBindings"] = [
        item for item in config.get("stopBindings", []) if item["stopIndex"] != 4
    ] + [{"stopIndex": 4, "placeId": "lorraine-crypt-detail-洛林墓穴-1"}]
    config["review"] += (
        " The same official competition document page 33 is independently extracted for the western crypt room group. "
        "It prints both 'PIANTA PIANO TERRA' and 'CRIPTA LORENESE'. Only neutral dark structural outlines survive; thin vault diagonals, coloured project routes, the title letterforms and project annotation are excluded from walls. "
        "Because the title does not demarcate a semantic perimeter around the named room group, the floor supplies verified structure and a printed-label anchor but no invented selectable Lorraine-crypt polygon."
    )
    config["limitations"] = [
        "地下墓穴、新圣器室与洛林墓穴总图来自比例彼此独立的正投影图幅，只按语义层级分组显示；各图没有水平配准，也不声称楼梯井对位。",
        "地下层只复建第41页明确标为地下层的中央梅第奇墓穴；步行面保留四座柱墩孔，西侧相邻房间不并入。",
        "新圣器室采用2019年综合测绘成果的1:50平面；黑色双线结构边界归为墙，祭坛、纪念物和两侧壁墓仅在审核窗内保留为平面细节。",
        "新圣器室步行面沿测绘内墙边界派生，并保留南侧中央凹室；三处门槛只为避免相邻未命名空间并入选择面，不输出为墙，也不表示当前通行状态。",
        "第33页明确印有“底层平面”和“洛林墓穴”；本图保留其西侧房群结构与印刷名称锚点。原图未画出把命名墓穴与相邻房间区分开的语义边界，因此不生成推测性洛林墓穴房面。",
        "第33页的蓝红工程路线、文字和拱顶斜线不归为墙；洛林墓穴停点只绑定到印刷名称位置，不代表入口、中心点或当前开放范围。",
        "王公礼拜堂与珍宝区仍无已接入的可靠完整平面；停点1和2不绑定。",
        "图源不提供现行开放边界或参观路线，本模型不推断现场开放状态。",
    ]
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    document.close()
    return rgb, wall_layer, crop_pixels, flat_windows


def select_princes_surface(rgb: np.ndarray, recipe: dict, generator):
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    method = recipe["boundaryMethod"]
    barrier = (grey <= method["maxLuminance"]).astype(np.uint8)
    barrier = cv2.dilate(
        barrier,
        np.ones((method["dilateKernelPixels"], method["dilateKernelPixels"]), np.uint8),
    )
    x0, y0, x1, y1 = recipe["imageCropPixels"]
    barrier[:y0, :] = 1
    barrier[y1:, :] = 1
    barrier[:, :x0] = 1
    barrier[:, x1:] = 1
    for cut in recipe["reviewedFloorOnlyCutsPixels"]:
        rx0, ry0, rx1, ry1 = cut["rect"]
        barrier[ry0:ry1, rx0:rx1] = 1

    passable = 1 - barrier
    _, labels = cv2.connectedComponents(passable, connectivity=4)
    seed_x, seed_y = recipe["seedPixel"]
    selected = (labels == labels[seed_y, seed_x]).astype(np.uint8)
    if (
        selected[y0, :].any()
        or selected[y1 - 1, :].any()
        or selected[:, x0].any()
        or selected[:, x1 - 1].any()
    ):
        raise ValueError("Princes Chapel floor flood reaches the reviewed crop edge")
    traced = generator.trace_pixel_ink(selected, tolerance=0.2)
    parts = [traced] if traced.geom_type == "Polygon" else list(traced.geoms)
    containing = [part for part in parts if part.covers(Point(seed_x, seed_y))]
    if len(containing) != 1:
        raise ValueError("Princes Chapel seed does not resolve to one polygon")
    # The source has no interior piers in the central chapel. Small dark marks
    # inside the face are drawing wear or fixtures and do not punch floor holes.
    reviewed = Polygon(containing[0].exterior.coords)
    if not reviewed.is_valid or reviewed.area < 200_000:
        raise ValueError("Princes Chapel central floor is invalid or unexpectedly small")
    return reviewed, selected, barrier


def write_princes_reviewed_source():
    if sha256(PRINCES_ORIGINAL_PATH) != PRINCES_ORIGINAL_SHA256:
        raise ValueError("ICCD Princes Chapel image changed; visual review required")
    rgb = np.array(Image.open(PRINCES_ORIGINAL_PATH).convert("RGB"))
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    ink = (grey <= 150).astype(np.uint8)
    wall = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) & ink
    structural_region = np.zeros_like(wall)
    structural_region[70:1200, 50:885] = 1
    wall &= structural_region
    detail_windows = [
        {
            "id": "north-altar",
            "rectPixels": [395, 230, 540, 315],
            "reason": "The altar and paired markers at the north of the historical chapel plan are retained as flat detail, not wall mass.",
        },
        {
            "id": "south-threshold-steps",
            "rectPixels": [400, 1100, 545, 1200],
            "reason": "The entrance threshold and steps at the south of the historical plan are retained as flat detail, not wall mass.",
        },
    ]
    detail = np.zeros_like(wall)
    for item in detail_windows:
        x0, y0, x1, y1 = item["rectPixels"]
        wall[y0:y1, x0:x1] = 0
        detail[y0:y1, x0:x1] = (grey[y0:y1, x0:x1] <= 195).astype(np.uint8)
    detail &= 1 - wall

    reviewed = np.full_like(rgb, 255)
    reviewed[detail.astype(bool)] = 150
    reviewed[wall.astype(bool)] = 35
    buffer = io.BytesIO()
    Image.fromarray(reviewed).save(buffer, format="PNG")
    document = fitz.open()
    page = document.new_page(width=rgb.shape[1], height=rgb.shape[0])
    page.insert_image(page.rect, stream=buffer.getvalue())
    PRINCES_REVIEWED_PATH.write_bytes(
        document.tobytes(
            garbage=4,
            deflate=True,
            no_new_id=True,
            preserve_metadata=False,
        )
    )
    document.close()
    check = fitz.open(PRINCES_REVIEWED_PATH)
    images = check[0].get_images(full=True)
    if len(images) != 1 or images[0][2:4] != (937, 1280):
        raise ValueError("Reviewed Princes Chapel source image inventory changed")
    xref = images[0][0]
    check.close()
    return rgb, wall, detail, detail_windows, xref, sha256(PRINCES_REVIEWED_PATH)


def write_princes_config(config: dict, generator):
    rgb, wall, detail, detail_windows, xref, reviewed_sha = write_princes_reviewed_source()
    source = {
        "id": PRINCES_SOURCE_ID,
        "file": PRINCES_REVIEWED_PATH.name,
        "url": PRINCES_IMAGE_URL,
        "sha256": reviewed_sha,
        "sourceProjection": {
            "kind": "orthographic",
            "pages": [1],
            "basis": "The Italian Ministry of Culture ICCD catalogue identifies the source as a plan of the Chapel of the Princes in San Lorenzo. The image is a direct top view with parallel wall faces and no perspective convergence. The central chapel face is extracted independently from the nineteenth-century historical sheet and is not registered to the crypt plans.",
        },
        "derivedFrom": {
            "file": PRINCES_ORIGINAL_PATH.name,
            "url": PRINCES_IMAGE_URL,
            "recordUrl": PRINCES_RECORD_URL,
            "sha256": PRINCES_ORIGINAL_SHA256,
            "catalogueCode": "0900335014",
            "imageSize": [937, 1280],
        },
    }
    config["sourceFiles"] = [
        item for item in config.get("sourceFiles", []) if item["id"] != PRINCES_SOURCE_ID
    ] + [source]

    recipe = {
        "id": "princes-central-floor",
        "label": "王公礼拜堂中央大厅",
        "placeId": "princes-chapel-historic-王公礼拜堂-1",
        "imageCropPixels": [50, 70, 885, 1200],
        "seedPixel": [470, 550],
        "boundaryMethod": {
            "kind": "historic-plan-inner-wall-flood-with-floor-only-cuts",
            "maxLuminance": 185,
            "dilateKernelPixels": 3,
        },
        "reviewedFloorOnlyCutsPixels": [
            {
                "rect": [340, 285, 585, 302],
                "reason": "Close the altar-side threshold only for selecting the central chapel face; the cut is not emitted as a wall.",
            },
            {
                "rect": [350, 832, 570, 852],
                "reason": "Close the south threshold only for selecting the central chapel face so the adjacent entrance range is not merged; the cut is not emitted as a wall.",
            },
        ],
        "tone": "neutral",
        "evidence": "Source-derived central Chapel of the Princes floor follows the inner edge of the thick historical wall bands. Two reviewed threshold closures isolate the central hall from the altar and entrance ranges for semantic selection only; neither is emitted as masonry.",
    }
    source_surface, selected, barrier = select_princes_surface(rgb, recipe, generator)
    document = fitz.open(PRINCES_REVIEWED_PATH)
    page = document[0]
    matrix = image_matrix(page, xref)
    transform = source_to_page_coefficients(matrix, rgb.shape[1], rgb.shape[0])
    page_crop = pixel_rect_to_page(matrix, rgb.shape[1], rgb.shape[0], recipe["imageCropPixels"])
    page_surface = affine_transform(source_surface, transform).intersection(box(*page_crop))
    rings = generator.polygons(page_surface, [0, 0])
    if len(rings) != 1 or rings[0]["holes"]:
        raise ValueError("Princes Chapel PDF-coordinate floor must be one polygon without holes")
    floor = {
        "id": "princes-chapel-historic",
        "label": "王公礼拜堂 · 19世纪历史平面（独立图幅）",
        "order": 2,
        "sourceId": PRINCES_SOURCE_ID,
        "page": 1,
        "crop": page_crop,
        "rules": [],
        "places": [
            {
                "label": "王公礼拜堂",
                "name": "王公礼拜堂中央大厅",
                "at": pixel_point_to_page(matrix, rgb.shape[1], rgb.shape[0], recipe["seedPixel"]),
                "kind": "room",
                "evidence": "Reviewed central anchor in ICCD catalogue plan 0900335014, explicitly identified as the Chapel of the Princes in San Lorenzo.",
                "precision": "historic-catalogue-plan-central-hall-anchor-not-current-visitor-position",
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
                "reason": "Black reviewed channel derived from five-pixel structural opening of the ICCD source, intersected with the original dark ink. The page frame, handwriting, altar and step windows are excluded from wall mass.",
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
                "reason": "Grey reviewed channel retains only the altar and south threshold or stair windows as flat detail.",
            },
        ],
        "derivedSpaceMasks": [recipe],
        "reviewedDetailRects": detail_windows,
        "spaces": [
            {
                "id": recipe["id"],
                "label": recipe["label"],
                "placeId": recipe["placeId"],
                "tone": recipe["tone"],
                "polygons": rings,
                "sourcePaths": [],
                "evidence": recipe["evidence"],
            }
        ],
    }
    config["floors"] = [item for item in config["floors"] if item["id"] != floor["id"]] + [floor]
    config["floors"].sort(key=lambda item: item["order"])
    config["stopBindings"] = [
        item for item in config.get("stopBindings", []) if item["stopIndex"] != 2
    ] + [{"stopIndex": 2, "placeId": recipe["placeId"]}]
    config["review"] += (
        " A fourth independent orthographic sheet comes from Italian Ministry of Culture ICCD catalogue record 0900335014, titled as a plan of the Chapel of the Princes and dated circa 1800-1849. "
        "Its thick wall bands establish the central hall boundary without the four piers seen in the separate underground crypt. The catalogue notes a relation to the grand-ducal intention for a Lorraine sepulchre below, so the sheet is presented explicitly as historical and is not claimed as a current operations plan. "
        "The central chapel face follows the source inner wall edge; two threshold closures are selection-only and are never emitted as walls."
    )
    config["limitations"] = [
        "地下墓穴、新圣器室、王公礼拜堂历史平面与洛林墓穴总图来自比例彼此独立的正投影图幅，只按语义层级分组显示；各图没有水平配准，也不声称楼梯井对位。",
        "地下层只复建第41页明确标为地下层的中央梅第奇墓穴；步行面保留四座柱墩孔，西侧相邻房间不并入。",
        "新圣器室采用2019年综合测绘成果的1:50平面；黑色双线结构边界归为墙，祭坛、纪念物和两侧壁墓仅在审核窗内保留为平面细节。",
        "王公礼拜堂采用文化部ICCD目录编号0900335014所载约1800至1849年历史平面；它证明无四柱的中央大厅与厚墙轮廓，不代表当前陈设、开放边界或门区状态。",
        "王公礼拜堂中央房面沿历史图内墙边提取；祭坛侧和南门侧两条封口只用于语义选择，不输出为墙。",
        "第33页明确印有“底层平面”和“洛林墓穴”；本图保留其西侧房群结构与印刷名称锚点。原图未画出把命名墓穴与相邻房间区分开的语义边界，因此不生成推测性洛林墓穴房面。",
        "第33页的蓝红工程路线、文字和拱顶斜线不归为墙；洛林墓穴停点只绑定到印刷名称位置，不代表入口、中心点或当前开放范围。",
        "珍宝区仍无已接入的可靠完整平面；停点1不绑定。",
        "图源不提供现行开放边界或参观路线，本模型不推断现场开放状态。",
    ]
    catalogue = {
        "authority": "Ministero della Cultura · Catalogo generale dei Beni Culturali",
        "title": "Pianta della Cappella dei Principi nella chiesa di S. Lorenzo a Firenze",
        "url": PRINCES_RECORD_URL,
        "finding": "ICCD catalogue code 0900335014 identifies the drawing as a plan of the Chapel of the Princes, dates it circa 1800-1849, and records the annotation relating its preparation to a grand-ducal intention for a Lorraine sepulchre in the chapel underground. The historical plan is used only for its directly drawn upper central-hall geometry.",
    }
    config["contextSources"] = [
        item for item in config.get("contextSources", []) if item["url"] != catalogue["url"]
    ] + [catalogue]
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    document.close()
    return rgb, wall, detail, source_surface, recipe


def polygon_mask(size: tuple[int, int], polygon: dict) -> Image.Image:
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon([tuple(point) for point in polygon["outer"]], fill=255)
    for hole in polygon.get("holes", []):
        draw.polygon([tuple(point) for point in hole], fill=0)
    return mask


def render_model(model: dict, floor_id: str, path: Path) -> None:
    floor = next(item for item in model["floors"] if item["id"] == floor_id)
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
    canvas.convert("RGB").save(path)


def render_source_overlay(rgb: np.ndarray, wall_layer: dict, surface: Polygon, recipe: dict, path: Path) -> None:
    low, high = np.array(wall_layer["rgbRange"][0]), np.array(wall_layer["rgbRange"][1])
    chroma = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
    source_wall = (np.all((rgb >= low) & (rgb <= high), axis=2) & (chroma <= wall_layer["maxChroma"])).astype(np.uint8)
    opened = cv2.morphologyEx(
        source_wall,
        cv2.MORPH_OPEN,
        np.ones((wall_layer["wallKernel"], wall_layer["wallKernel"]), np.uint8),
    )
    opened &= source_wall
    x0, y0, x1, y1 = recipe["imageCropPixels"]
    size = (x1 - x0, y1 - y0)
    base = Image.fromarray(rgb[y0:y1, x0:x1]).convert("RGBA")
    surface_local = {
        "outer": [[x - x0, y - y0] for x, y in surface.exterior.coords],
        "holes": [[[x - x0, y - y0] for x, y in ring.coords] for ring in surface.interiors],
    }
    floor_layer = Image.new("RGBA", size, (18, 170, 125, 105))
    transparent = Image.new("RGBA", size, (0, 0, 0, 0))
    base = Image.alpha_composite(
        base,
        Image.composite(floor_layer, transparent, polygon_mask(size, surface_local)),
    )
    wall_alpha = Image.fromarray((opened[y0:y1, x0:x1] * 155).astype(np.uint8))
    wall_color = Image.new("RGBA", size, (198, 39, 45, 0))
    wall_color.putalpha(wall_alpha)
    base = Image.alpha_composite(base, wall_color)
    base.resize((size[0] * 3, size[1] * 3), Image.Resampling.NEAREST).save(path)


def render_sacristy_source_overlay(
    rgb: np.ndarray,
    surface: Polygon,
    wall_layer: dict,
    recipe: dict,
    detail_windows: list[dict],
    path: Path,
) -> None:
    grey = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    source_wall = (grey <= wall_layer["maxChannel"]).astype(np.uint8)
    source_wall &= (
        rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
        <= wall_layer["maxChroma"]
    ).astype(np.uint8)
    source_wall = cv2.morphologyEx(
        source_wall,
        cv2.MORPH_OPEN,
        np.ones((wall_layer["wallKernel"], wall_layer["wallKernel"]), np.uint8),
    ) & source_wall
    for item in detail_windows:
        x0, y0, x1, y1 = item["rectPixels"]
        source_wall[y0:y1, x0:x1] = 0

    x0, y0, x1, y1 = [125, 90, 558, 630]
    size = (x1 - x0, y1 - y0)
    base = Image.fromarray(rgb[y0:y1, x0:x1]).convert("RGBA")
    surface_local = {
        "outer": [[x - x0, y - y0] for x, y in surface.exterior.coords],
        "holes": [],
    }
    floor_layer = Image.new("RGBA", size, (18, 170, 125, 105))
    transparent = Image.new("RGBA", size, (0, 0, 0, 0))
    base = Image.alpha_composite(
        base,
        Image.composite(floor_layer, transparent, polygon_mask(size, surface_local)),
    )
    wall_alpha = Image.fromarray((source_wall[y0:y1, x0:x1] * 185).astype(np.uint8))
    wall_color = Image.new("RGBA", size, (198, 39, 45, 0))
    wall_color.putalpha(wall_alpha)
    base = Image.alpha_composite(base, wall_color)
    draw = ImageDraw.Draw(base)
    for item in detail_windows:
        rx0, ry0, rx1, ry1 = item["rectPixels"]
        draw.rectangle((rx0 - x0, ry0 - y0, rx1 - x0, ry1 - y0), outline=(26, 88, 180, 230), width=2)
    for cut in recipe["reviewedFloorOnlyCutsPixels"]:
        rx0, ry0, rx1, ry1 = cut["rect"]
        draw.rectangle((rx0 - x0, ry0 - y0, rx1 - x0, ry1 - y0), outline=(231, 126, 31, 230), width=2)
    base.resize((size[0] * 2, size[1] * 2), Image.Resampling.NEAREST).save(path)


def render_lorraine_source_overlay(
    rgb: np.ndarray,
    wall_layer: dict,
    crop_pixels: list[int],
    flat_windows: list[dict],
    path: Path,
) -> None:
    chroma = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
    source_wall = (
        (rgb.max(axis=2) <= wall_layer["maxChannel"])
        & (chroma <= wall_layer["maxChroma"])
    ).astype(np.uint8)
    source_wall = cv2.morphologyEx(
        source_wall,
        cv2.MORPH_OPEN,
        np.ones((wall_layer["wallKernel"], wall_layer["wallKernel"]), np.uint8),
    ) & source_wall
    for item in flat_windows:
        x0, y0, x1, y1 = item["rectPixels"]
        source_wall[y0:y1, x0:x1] = 0
    x0, y0, x1, y1 = crop_pixels
    size = (x1 - x0, y1 - y0)
    grey = cv2.cvtColor(rgb[y0:y1, x0:x1], cv2.COLOR_RGB2GRAY)
    base_rgb = np.repeat(grey[:, :, None], 3, axis=2)
    base = Image.fromarray(base_rgb).convert("RGBA")
    wall_alpha = Image.fromarray((source_wall[y0:y1, x0:x1] * 190).astype(np.uint8))
    wall_color = Image.new("RGBA", size, (198, 39, 45, 0))
    wall_color.putalpha(wall_alpha)
    base = Image.alpha_composite(base, wall_color)
    draw = ImageDraw.Draw(base)
    for item in flat_windows:
        rx0, ry0, rx1, ry1 = item["rectPixels"]
        draw.rectangle((rx0 - x0, ry0 - y0, rx1 - x0, ry1 - y0), outline=(26, 88, 180, 230), width=2)
    anchor = (455 - x0, 675 - y0)
    draw.ellipse((anchor[0] - 5, anchor[1] - 5, anchor[0] + 5, anchor[1] + 5), fill=(231, 126, 31, 255))
    base.resize((size[0] * 3, size[1] * 3), Image.Resampling.NEAREST).save(path)


def render_princes_source_overlay(
    rgb: np.ndarray,
    wall: np.ndarray,
    detail: np.ndarray,
    surface: Polygon,
    recipe: dict,
    path: Path,
) -> None:
    x0, y0, x1, y1 = recipe["imageCropPixels"]
    size = (x1 - x0, y1 - y0)
    base = Image.fromarray(rgb[y0:y1, x0:x1]).convert("RGBA")
    surface_local = {
        "outer": [[x - x0, y - y0] for x, y in surface.exterior.coords],
        "holes": [],
    }
    floor_layer = Image.new("RGBA", size, (18, 170, 125, 105))
    transparent = Image.new("RGBA", size, (0, 0, 0, 0))
    base = Image.alpha_composite(
        base,
        Image.composite(floor_layer, transparent, polygon_mask(size, surface_local)),
    )
    wall_alpha = Image.fromarray((wall[y0:y1, x0:x1] * 185).astype(np.uint8))
    wall_color = Image.new("RGBA", size, (198, 39, 45, 0))
    wall_color.putalpha(wall_alpha)
    base = Image.alpha_composite(base, wall_color)
    detail_alpha = Image.fromarray((detail[y0:y1, x0:x1] * 210).astype(np.uint8))
    detail_color = Image.new("RGBA", size, (26, 88, 180, 0))
    detail_color.putalpha(detail_alpha)
    base = Image.alpha_composite(base, detail_color)
    draw = ImageDraw.Draw(base)
    for cut in recipe["reviewedFloorOnlyCutsPixels"]:
        rx0, ry0, rx1, ry1 = cut["rect"]
        draw.rectangle(
            (rx0 - x0, ry0 - y0, rx1 - x0, ry1 - y0),
            outline=(231, 126, 31, 230),
            width=2,
        )
    base.resize((size[0] * 2, size[1] * 2), Image.Resampling.NEAREST).save(path)


def main() -> None:
    generator = load_generator()
    config = json.loads(CONFIG_PATH.read_text())
    rgb, source_surface, _, wall_layer, recipe = write_derived_config(config, generator)
    config = json.loads(CONFIG_PATH.read_text())
    (
        sacristy_rgb,
        sacristy_surface,
        _,
        _,
        sacristy_wall_layer,
        sacristy_recipe,
        sacristy_detail_windows,
    ) = write_new_sacristy_config(config, generator)
    config = json.loads(CONFIG_PATH.read_text())
    lorraine_rgb, lorraine_wall_layer, lorraine_crop, lorraine_flat_windows = (
        write_lorraine_config(config)
    )
    config = json.loads(CONFIG_PATH.read_text())
    princes_rgb, princes_wall, princes_detail, princes_surface, princes_recipe = (
        write_princes_config(config, generator)
    )
    config = json.loads(CONFIG_PATH.read_text())
    generator.build(config)
    first_hashes = (sha256(MODEL_PATH), sha256(EVIDENCE_PATH))
    generator.build(config)
    normal_rebuild_stable = first_hashes == (sha256(MODEL_PATH), sha256(EVIDENCE_PATH))
    runtime_validation = validate_runtime_schema(MODEL_PATH)

    model = json.loads(MODEL_PATH.read_text())
    evidence = json.loads(EVIDENCE_PATH.read_text())
    floor = next(item for item in model["floors"] if item["id"] == "crypt-level")
    sacristy_floor = next(item for item in model["floors"] if item["id"] == "new-sacristy")
    lorraine_floor = next(
        item for item in model["floors"] if item["id"] == "lorraine-crypt-detail"
    )
    princes_floor = next(
        item for item in model["floors"] if item["id"] == "princes-chapel-historic"
    )
    surface = next(feature for feature in floor["features"] if feature["kind"] == "surface")
    sacristy_model_surface = next(
        feature for feature in sacristy_floor["features"] if feature["kind"] == "surface"
    )
    checks = {
        "sourceHashMatches": sha256(ROOT / "sources/floorplans" / config["file"]) == config["sha256"],
        "supplementarySourceHashesMatch": all(
            sha256(ROOT / "sources/floorplans" / source["file"]) == source["sha256"]
            for source in config.get("sourceFiles", [])
        ),
        "builderHash": sha256(GENERATOR_PATH),
        "normalSharedBuilderRebuildStable": normal_rebuild_stable,
        "postBuildModelMutation": False,
        "runtimeValidator": runtime_validation,
        "floorCount": len(model["floors"]),
        "featureCount": evidence["coverage"]["features"],
        "wallFeatureCount": sum(item["kind"] == "wall" for item in floor["features"]),
        "surfaceFeatureCount": sum(item["kind"] == "surface" for item in floor["features"]),
        "detailFeatureCount": sum(item["kind"] == "detail" for item in floor["features"]),
        "newSacristyWallFeatureCount": sum(
            item["kind"] == "wall" for item in sacristy_floor["features"]
        ),
        "newSacristySurfaceFeatureCount": sum(
            item["kind"] == "surface" for item in sacristy_floor["features"]
        ),
        "newSacristyDetailFeatureCount": sum(
            item["kind"] == "detail" for item in sacristy_floor["features"]
        ),
        "lorraineWallFeatureCount": sum(
            item["kind"] == "wall" for item in lorraine_floor["features"]
        ),
        "lorraineNonWallFeatureCount": sum(
            item["kind"] != "wall" for item in lorraine_floor["features"]
        ),
        "princesOriginalSourceHashMatches": sha256(PRINCES_ORIGINAL_PATH)
        == PRINCES_ORIGINAL_SHA256,
        "princesReviewedSourceHashStable": config["sourceFiles"][-1]["sha256"]
        == sha256(PRINCES_REVIEWED_PATH),
        "princesWallFeatureCount": sum(
            item["kind"] == "wall" for item in princes_floor["features"]
        ),
        "princesSurfaceFeatureCount": sum(
            item["kind"] == "surface" for item in princes_floor["features"]
        ),
        "princesDetailFeatureCount": sum(
            item["kind"] == "detail" for item in princes_floor["features"]
        ),
        "spaceCount": len(model["spaces"]),
        "cryptSurfacePierHoleCount": len(surface["polygons"][0]["holes"]),
        "newSacristySurfaceHoleCount": len(sacristy_model_surface["polygons"][0]["holes"]),
        "stairRasterWindowCount": sum(layer.get("generatedBy") is not None for layer in config["floors"][0]["rasterLayers"]),
        "newSacristyDetailWindowCount": len(sacristy_detail_windows),
        "newSacristyFloorOnlyCutCount": len(sacristy_recipe["reviewedFloorOnlyCutsPixels"]),
        "allPublicFloorLabelsChinese": all(HAN.search(item["label"]) for item in model["floors"]),
        "allPlaceLabelsChinese": all(HAN.search(item["label"]) for item in model["places"]),
        "princesFloorOnlyCutCount": len(princes_recipe["reviewedFloorOnlyCutsPixels"]),
        "resolvedStops": sorted(item["stopIndex"] for item in model["stopBindings"]),
        "unresolvedStops": [1],
    }
    checks["pass"] = all(
        [
            checks["sourceHashMatches"],
            checks["supplementarySourceHashesMatch"],
            checks["normalSharedBuilderRebuildStable"],
            checks["runtimeValidator"]["errors"] == [],
            checks["floorCount"] == 4,
            checks["surfaceFeatureCount"] == 1,
            checks["detailFeatureCount"] > 0,
            checks["newSacristyWallFeatureCount"] > 0,
            checks["newSacristySurfaceFeatureCount"] == 1,
            checks["newSacristyDetailFeatureCount"] > 0,
            checks["lorraineWallFeatureCount"] > 0,
            checks["lorraineNonWallFeatureCount"] == 0,
            checks["princesOriginalSourceHashMatches"],
            checks["princesReviewedSourceHashStable"],
            checks["princesWallFeatureCount"] > 0,
            checks["princesSurfaceFeatureCount"] == 1,
            checks["princesDetailFeatureCount"] > 0,
            checks["spaceCount"] == 3,
            checks["cryptSurfacePierHoleCount"] == 4,
            checks["newSacristySurfaceHoleCount"] == 0,
            checks["stairRasterWindowCount"] == 4,
            checks["newSacristyDetailWindowCount"] == 4,
            checks["newSacristyFloorOnlyCutCount"] == 3,
            checks["princesFloorOnlyCutCount"] == 2,
            checks["allPublicFloorLabelsChinese"],
            checks["allPlaceLabelsChinese"],
        ]
    )
    VALIDATION_PATH.write_text(json.dumps(checks, ensure_ascii=False, indent=2) + "\n")
    render_source_overlay(rgb, wall_layer, source_surface, recipe, SOURCE_OVERLAY_PATH)
    render_sacristy_source_overlay(
        sacristy_rgb,
        sacristy_surface,
        sacristy_wall_layer,
        sacristy_recipe,
        sacristy_detail_windows,
        SACRISTY_SOURCE_OVERLAY_PATH,
    )
    render_lorraine_source_overlay(
        lorraine_rgb,
        lorraine_wall_layer,
        lorraine_crop,
        lorraine_flat_windows,
        LORRAINE_SOURCE_OVERLAY_PATH,
    )
    render_princes_source_overlay(
        princes_rgb,
        princes_wall,
        princes_detail,
        princes_surface,
        princes_recipe,
        PRINCES_SOURCE_OVERLAY_PATH,
    )
    render_model(model, "crypt-level", MODEL_PREVIEW_PATH)
    render_model(model, "new-sacristy", SACRISTY_MODEL_PREVIEW_PATH)
    render_model(model, "lorraine-crypt-detail", LORRAINE_MODEL_PREVIEW_PATH)
    render_model(model, "princes-chapel-historic", PRINCES_MODEL_PREVIEW_PATH)
    if not checks["pass"]:
        raise SystemExit("Medici v11 validation failed")
    print(json.dumps(checks, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
