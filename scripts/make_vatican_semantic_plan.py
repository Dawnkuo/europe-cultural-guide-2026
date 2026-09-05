#!/usr/bin/env python3
"""Classify Vatican plan pixels and derive reviewed source-bounded spaces."""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw
from shapely.affinity import affine_transform
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union


FLOORS = [
    {
        "id": "first",
        "page": 1,
        "crop": [20, 90, 825, 555],
        "retainGardenContext": True,
        "flatDetails": [
            {
                "id": "west-small-stair",
                "kind": "polygon",
                "points": [[65.6, 198.2], [68.6, 200.5], [61.2, 210.8], [59.2, 209.2]],
                "wallCheckpoints": [
                    ["curved-head", [64.0, 193.0, 69.2, 197.2]],
                    ["west-stringer", [56.8, 207.0, 61.0, 214.5]],
                    ["east-stringer", [69.8, 199.5, 73.8, 216.5]],
                ],
            },
            {
                "id": "pinecone-east-stair",
                "kind": "polygon",
                "points": [[315.0, 180.0], [321.5, 180.0], [321.5, 197.8], [315.0, 197.8]],
                "wallCheckpoints": [
                    ["north-perimeter", [312.5, 176.8, 324.2, 180.0]],
                    ["west-perimeter", [312.5, 178.0, 315.0, 200.0]],
                    ["east-perimeter", [321.5, 178.0, 324.2, 200.0]],
                    ["south-perimeter", [312.5, 197.8, 324.2, 201.0]],
                ],
            },
            {
                "id": "far-east-standalone-stair",
                "kind": "polygon",
                "points": [[746.0, 176.5], [763.2, 176.5], [763.2, 232.2], [746.0, 232.2]],
                "wallCheckpoints": [
                    ["north-perimeter", [742.4, 172.2, 767.2, 176.3]],
                    ["west-perimeter", [742.4, 173.0, 745.8, 235.2]],
                    ["east-perimeter", [763.5, 173.0, 767.7, 235.2]],
                    ["south-perimeter", [742.4, 232.5, 767.7, 236.0]],
                ],
            },
            {
                "id": "south-spiral-stair",
                "kind": "annulus",
                "center": [183.0, 526.5],
                "innerRadius": 14.0,
                "outerRadius": 19.0,
                "wallCheckpoints": [
                    ["north-outer-arc", [173.0, 500.0, 194.0, 505.0]],
                    ["west-outer-arc", [160.0, 513.0, 165.0, 536.0]],
                    ["south-outer-arc", [171.0, 544.0, 199.0, 551.2]],
                    ["east-outer-arc", [201.0, 514.0, 205.0, 539.0]],
                ],
            },
        ],
        "spaces": [
            {"id": "gregorian-egyptian", "label": "格里高利埃及博物馆", "placeId": "first-1-1", "seed": [162.338501, 236.838989], "kernel": 7},
            {"id": "chiaramonti", "label": "基亚拉蒙蒂博物馆", "placeId": "first-2-1", "seed": [228.636505, 128.123508], "kernel": 7},
            {"id": "braccio-nuovo", "label": "新翼陈列馆", "placeId": "first-3-1", "seed": [339.606995, 156.313507], "kernel": 7},
            {"id": "pio-clementino", "label": "庇护-克莱孟博物馆", "placeId": "first-4-1", "seed": [119.281998, 150.032501], "kernel": 7},
            {"id": "borgia-west", "label": "波吉亚寓所西段", "placeId": "first-11-1", "seed": [660.408508, 200.856491], "kernel": 7},
            {"id": "borgia-central", "label": "波吉亚寓所中段", "placeId": "first-11-2", "seed": [660.408508, 227.107498], "kernel": 7},
            {"id": "borgia-east", "label": "波吉亚寓所东段", "placeId": "first-11-3", "seed": [767.921997, 164.053497], "kernel": 7},
            {"id": "sistine-chapel", "label": "西斯廷礼拜堂", "placeId": "first-西斯廷室内-1", "seed": [710, 230], "kernel": 7},
            {"id": "aldobrandini-wedding", "label": "阿尔多布兰迪尼婚礼厅", "placeId": "first-13-1", "seed": [628.783997, 266.844482], "kernel": 7},
            {"id": "christian-museum", "label": "基督教博物馆", "placeId": "first-14-1", "seed": [475.105011, 249.662506], "kernel": 7},
            {"id": "vatican-library-museums", "label": "梵蒂冈图书馆博物馆", "placeId": "first-图书馆室内-1", "seed": [403.0, 220.0], "kernel": 7},
            {"id": "profane-museum", "label": "世俗博物馆", "placeId": "first-16-1", "seed": [324.232513, 249.661987], "kernel": 7},
            {"id": "gregorian-profane", "label": "格里高利世俗博物馆", "placeId": "first-17-1", "seed": [138.054504, 409.967499], "kernel": 7},
            {"id": "pinacoteca-north", "label": "梵蒂冈绘画馆北段", "placeId": "first-19-1", "seed": [217.250504, 408.805481], "kernel": 7},
            {"id": "pinacoteca-central", "label": "梵蒂冈绘画馆中段", "placeId": "first-19-2", "seed": [231.829498, 408.805481], "kernel": 7},
            {"id": "pinacoteca-south", "label": "梵蒂冈绘画馆南段", "placeId": "first-19-3", "seed": [237.625, 479.66449], "kernel": 7},
            {"id": "pinecone-courtyard", "label": "松果庭院", "placeId": "first-松果庭院-1", "seed": [246.125, 188.910988], "kernel": 7},
        ],
    },
    {
        "id": "second",
        "page": 2,
        "crop": [25, 40, 570, 285],
        "retainGardenContext": False,
        "omitContextRects": [
            [117, 76, 211, 146],
            [119, 170, 236, 221],
            [120, 221, 239, 324],
        ],
        "spaces": [
            {"id": "etruscan-west", "label": "格里高利伊特鲁里亚博物馆西段", "placeId": "second-5-2", "seed": [64.681, 112.617996], "kernel": 7},
            {"id": "immaculate-conception", "label": "圣母无染原罪厅", "placeId": "second-9-1", "seed": [503.931503, 134.003006], "kernel": 7},
            {"id": "raphael-rooms", "label": "拉斐尔画室", "placeId": "second-10-1", "seed": [509.764526, 110.081985], "kernel": 7},
        ],
    },
    {
        "id": "basement",
        "page": 3,
        "crop": [15, 330, 342, 570],
        "retainGardenContext": True,
        "spaces": [
            {"id": "ethnological-philatelic-shared", "label": "20／21 地下展区", "placeId": "basement-20-1", "seed": [85.431198, 423.995987], "kernel": 7},
            {"id": "carriage-pavilion", "label": "马车馆", "placeId": "basement-22-1", "seed": [263.812988, 432.964005], "kernel": 7},
        ],
    },
]


def pixel_runs(mask: np.ndarray):
    for y, row in enumerate(mask):
        padded = np.pad(row.astype(np.int8), (1, 1))
        changes = np.flatnonzero(np.diff(padded))
        for x0, x1 in changes.reshape(-1, 2):
            yield box(int(x0), y, int(x1), y + 1)


def mask_geometry(mask: np.ndarray, matrix: fitz.Matrix, width: int, height: int):
    geometry = unary_union(list(pixel_runs(mask)))
    geometry = geometry.simplify(0.75, preserve_topology=True)
    return affine_transform(
        geometry,
        [
            matrix.a / width,
            matrix.c / height,
            matrix.b / width,
            matrix.d / height,
            matrix.e,
            matrix.f,
        ],
    )


def polygon_record(polygon: Polygon) -> dict:
    def ring(coords):
        return [[round(x, 4), round(y, 4)] for x, y in coords]

    return {
        "outer": ring(polygon.exterior.coords),
        "holes": [ring(interior.coords) for interior in polygon.interiors],
    }


def page_polygon_mask(size: tuple[int, int], inverse: fitz.Matrix, points: list[list[float]]) -> np.ndarray:
    width, height = size
    mapped = []
    for x, y in points:
        point = fitz.Point(x, y) * inverse
        mapped.append((round(point.x * width), round(point.y * height)))
    canvas = Image.new("1", size, 0)
    ImageDraw.Draw(canvas).polygon(mapped, fill=1)
    return np.asarray(canvas, dtype=bool)


def page_annulus_mask(
    size: tuple[int, int],
    inverse: fitz.Matrix,
    center: list[float],
    inner_radius: float,
    outer_radius: float,
) -> np.ndarray:
    width, height = size
    center_px = fitz.Point(*center) * inverse
    edge_x = fitz.Point(center[0] + 1, center[1]) * inverse
    edge_y = fitz.Point(center[0], center[1] + 1) * inverse
    scale_x = abs(edge_x.x - center_px.x) * width
    scale_y = abs(edge_y.y - center_px.y) * height
    yy, xx = np.indices((height, width))
    dx = (xx - center_px.x * width) / scale_x
    dy = (yy - center_px.y * height) / scale_y
    radius = np.sqrt(dx * dx + dy * dy)
    return (radius >= inner_radius) & (radius <= outer_radius)


def page_rect_mask(size: tuple[int, int], inverse: fitz.Matrix, rect: list[float]) -> np.ndarray:
    width, height = size
    mapped = fitz.Rect(rect) * inverse
    x0 = max(0, int(np.floor(mapped.x0 * width)))
    y0 = max(0, int(np.floor(mapped.y0 * height)))
    x1 = min(width, int(np.ceil(mapped.x1 * width)))
    y1 = min(height, int(np.ceil(mapped.y1 * height)))
    mask = np.zeros((height, width), dtype=bool)
    mask[y0:y1, x0:x1] = True
    return mask


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    source_path = root / "sources/floorplans/vatican-museums-registered-plans.pdf"
    output_path = root / "sources/floorplans/vatican-museums-semantic-plans.pdf"
    space_path = root / "sources/floorplans/vatican-museums-source-spaces.json"
    qa_dir = root / "work/vatican-semantic-qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    for generated_dir in (qa_dir / "space-door-closures", qa_dir / "stair-review"):
        generated_dir.mkdir(exist_ok=True)
        for stale in generated_dir.glob("*.png"):
            stale.unlink()

    source = fitz.open(source_path)
    output = fitz.open()
    spaces = {floor["id"]: [] for floor in FLOORS}
    audit = {}
    door_closure_audit = {}

    for floor in FLOORS:
        page = source[floor["page"] - 1]
        images = page.get_images(full=True)
        if len(images) != 1:
            raise ValueError(f"{floor['id']}: expected one independently registered image")
        xref = images[0][0]
        extracted = source.extract_image(xref)
        image = Image.open(io.BytesIO(extracted["image"])).convert("RGB")
        rgb = np.asarray(image)
        image_rect, matrix = page.get_image_rects(xref, transform=True)[0]

        spread = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
        neutral = (spread <= 18) & (rgb.max(axis=2) <= 245)
        # The registered source has pale neutral drop-shadows and antialias
        # halos around the plan. Visual threshold review on all three native
        # images found that 220 retains the continuous architectural strokes;
        # 221..245 introduces detached shadow speckle and must not become wall.
        structural = (spread <= 18) & (rgb.max(axis=2) <= 220)
        green = (
            (rgb[:, :, 1].astype(np.int16) - rgb[:, :, 0] >= 24)
            & (rgb[:, :, 1].astype(np.int16) - rgb[:, :, 2] >= 24)
            & (rgb[:, :, 1] >= 175)
        )
        garden_neighborhood = cv2.dilate(green.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
        garden_outline = structural & garden_neighborhood
        walls = structural & ~garden_neighborhood
        details = (green | garden_outline) if floor["retainGardenContext"] else np.zeros_like(green)
        inverse = ~matrix
        stair_audit = []
        stair_detail_mask = np.zeros_like(green)
        stair_review_masks: list[tuple[str, np.ndarray]] = []
        stair_checkpoint_masks: list[tuple[str, str, np.ndarray]] = []
        for spec in floor.get("flatDetails", []):
            if spec["kind"] == "polygon":
                selector = page_polygon_mask(image.size, inverse, spec["points"])
            elif spec["kind"] == "annulus":
                selector = page_annulus_mask(
                    image.size,
                    inverse,
                    spec["center"],
                    spec["innerRadius"],
                    spec["outerRadius"],
                )
            else:
                raise ValueError(f"{floor['id']} {spec['id']}: unsupported flat-detail selector")
            selected = structural & selector
            if not selected.any():
                raise ValueError(f"{floor['id']} {spec['id']}: no source ink selected")
            stair_detail_mask |= selected
            stair_review_masks.append((spec["id"], selector))
            for checkpoint_name, checkpoint_rect in spec["wallCheckpoints"]:
                stair_checkpoint_masks.append(
                    (spec["id"], checkpoint_name, page_rect_mask(image.size, inverse, checkpoint_rect))
                )
            stair_audit.append({
                "id": spec["id"],
                "kind": spec["kind"],
                "selector": {key: spec[key] for key in ("points", "center", "innerRadius", "outerRadius") if key in spec},
                "sourceStructuralPixelsReclassifiedFlat": int(selected.sum()),
                "syntheticDetailPixels": int((selected & ~structural).sum()),
                "wallCheckpoints": [],
            })
        walls[stair_detail_mask] = False
        details |= stair_detail_mask
        explicit_context = np.zeros_like(green)
        for context_rect in floor.get("omitContextRects", []):
            mapped = fitz.Rect(context_rect) * inverse
            x0 = max(0, round(mapped.x0 * image.width))
            y0 = max(0, round(mapped.y0 * image.height))
            x1 = min(image.width, round(mapped.x1 * image.width))
            y1 = min(image.height, round(mapped.y1 * image.height))
            explicit_context[y0:y1, x0:x1] = True
        walls[explicit_context] = False
        details[explicit_context] = False
        source_wall_pixels_before_noise_filter = int(walls.sum())
        component_count, component_labels, component_stats, _ = cv2.connectedComponentsWithStats(
            walls.astype(np.uint8), 8
        )
        retained_labels = np.flatnonzero(component_stats[:, cv2.CC_STAT_AREA] >= 9)
        retained_labels = retained_labels[retained_labels != 0]
        walls = np.isin(component_labels, retained_labels)
        omitted_wall_noise_pixels = source_wall_pixels_before_noise_filter - int(walls.sum())
        if np.any(walls & ~structural):
            raise RuntimeError(f"{floor['id']}: wall classification added non-structural pixels")
        if np.any((walls | details) & ~(neutral | green)):
            raise RuntimeError(f"{floor['id']}: semantic classification added non-source pixels")
        stair_audit_by_id = {record["id"]: record for record in stair_audit}
        for stair_id, checkpoint_name, checkpoint_mask in stair_checkpoint_masks:
            source_pixels = int((structural & checkpoint_mask).sum())
            wall_pixels = int((walls & checkpoint_mask).sum())
            detail_pixels = int((details & checkpoint_mask).sum())
            if source_pixels == 0 or wall_pixels == 0:
                raise RuntimeError(
                    f"{floor['id']} {stair_id} {checkpoint_name}: perimeter wall missing "
                    f"(source={source_pixels}, wall={wall_pixels}, detail={detail_pixels})"
                )
            stair_audit_by_id[stair_id]["wallCheckpoints"].append({
                "id": checkpoint_name,
                "sourceStructuralPixels": source_pixels,
                "retainedWallPixels": wall_pixels,
                "flatDetailPixels": detail_pixels,
            })

        clean = np.full(rgb.shape, 255, dtype=np.uint8)
        clean[details] = 128
        clean[walls] = 0
        buffer = io.BytesIO()
        Image.fromarray(clean, "RGB").save(buffer, format="PNG", optimize=True)
        new_page = output.new_page(width=page.rect.width, height=page.rect.height)
        new_page.insert_image(image_rect, stream=buffer.getvalue(), keep_proportion=False)

        comparison_scale = 1
        source_panel = Image.fromarray(rgb, "RGB")
        semantic_panel = Image.fromarray(clean, "RGB")
        removed = np.full(rgb.shape, 255, dtype=np.uint8)
        removed[walls] = 0
        removed[details] = 128
        removed[(neutral | green) & ~(walls | details)] = [205, 45, 45]
        removed_panel = Image.fromarray(removed, "RGB")
        comparison = Image.new("RGB", (source_panel.width * 3, source_panel.height + 28), "white")
        draw = ImageDraw.Draw(comparison)
        for index, (label, panel) in enumerate((
            ("SOURCE", source_panel),
            ("SEMANTIC WALL/DETAIL", semantic_panel),
            ("OMITTED CONTEXT IN RED", removed_panel),
        )):
            comparison.paste(panel, (index * source_panel.width, 28))
            draw.text((index * source_panel.width + 6, 6), label, fill="black")
        comparison.save(qa_dir / f"{floor['id']}-semantic-comparison.png")

        floor_space_audit = []
        floor_space_geometries = []
        floor_door_closure_audit = []
        for spec in floor["spaces"]:
            barrier = cv2.dilate(
                structural.astype(np.uint8),
                np.ones((spec["kernel"], spec["kernel"]), np.uint8),
            ).astype(bool)
            count, labels, stats, _ = cv2.connectedComponentsWithStats((~barrier).astype(np.uint8), 8)
            seed = fitz.Point(*spec["seed"]) * inverse
            px = min(image.width - 1, max(0, round(seed.x * image.width)))
            py = min(image.height - 1, max(0, round(seed.y * image.height)))
            label = int(labels[py, px])
            if label == 0:
                raise ValueError(f"{floor['id']} {spec['id']}: seed is on source wall ink")
            component = labels == label
            geometry = mask_geometry(component, matrix, image.width, image.height)
            geometry = geometry.intersection(box(*floor["crop"]))
            polygons = [geometry] if geometry.geom_type == "Polygon" else list(geometry.geoms)
            polygons = [polygon for polygon in polygons if polygon.area > 0.1]
            if not polygons:
                raise ValueError(f"{floor['id']} {spec['id']}: empty source-bounded space")
            seed_point = Point(*spec["seed"])
            seeded = [polygon for polygon in polygons if polygon.buffer(0.6).covers(seed_point)]
            selected = max(seeded or polygons, key=lambda polygon: polygon.area)
            discarded_area = sum(polygon.area for polygon in polygons if polygon is not selected)
            records = [polygon_record(selected)]
            spaces[floor["id"]].append({
                "id": spec["id"],
                "label": spec["label"],
                "placeId": spec["placeId"],
                "polygons": records,
                "sourcePaths": [f"registered-raster-component:{floor['id']}:{label}"],
                "evidence": f"官方平面墙线经 {spec['kernel']}x{spec['kernel']} 像素障碍闭合后，由审阅种子点 {spec['seed']} 提取的封闭内部面；仅用于可选地面，不增加墙体。",
                "tone": "neutral",
            })
            floor_space_geometries.append((spec["id"], spec["seed"], selected))
            closure_only = barrier & ~structural
            component_neighborhood = cv2.dilate(component.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
            reviewed_closure = closure_only & component_neighborhood
            source_wall_overlap = int((component & structural).sum())
            closure_overlap = int((component & closure_only).sum())
            if source_wall_overlap or closure_overlap:
                raise RuntimeError(f"{floor['id']} {spec['id']}: extracted interior crosses barrier pixels")
            space_record = {
                "id": spec["id"],
                "placeId": spec["placeId"],
                "seed": spec["seed"],
                "kernel": spec["kernel"],
                "componentLabel": label,
                "sourcePixelArea": int(stats[label, cv2.CC_STAT_AREA]),
                "bounds": [round(value, 4) for value in selected.bounds],
                "polygonCount": 1,
                "discardedSatellitePolygonCount": len(polygons) - 1,
                "discardedSatelliteArea": round(discarded_area, 6),
                "sourceWallPixelsInsideFloodComponent": source_wall_overlap,
                "dilationPixelsInsideFloodComponent": closure_overlap,
                "reviewedBoundaryClosurePixels": int(reviewed_closure.sum()),
                "emittedWallPixelsAddedByClosure": 0,
            }
            floor_space_audit.append(space_record)
            floor_door_closure_audit.append(space_record)

            qa = np.asarray(image).copy()
            qa_rgba = Image.fromarray(qa, "RGB").convert("RGBA")
            tint = np.zeros((image.height, image.width, 4), dtype=np.uint8)
            tint[component] = [0, 126, 167, 72]
            tint[reviewed_closure] = [215, 48, 39, 220]
            qa_rgba = Image.alpha_composite(qa_rgba, Image.fromarray(tint, "RGBA"))
            bounds = fitz.Rect(selected.bounds).include_point(fitz.Point(*spec["seed"]))
            bounds.x0 -= 8
            bounds.y0 -= 8
            bounds.x1 += 8
            bounds.y1 += 8
            mapped_bounds = bounds * inverse
            crop_box = (
                max(0, round(mapped_bounds.x0 * image.width)),
                max(0, round(mapped_bounds.y0 * image.height)),
                min(image.width, round(mapped_bounds.x1 * image.width)),
                min(image.height, round(mapped_bounds.y1 * image.height)),
            )
            space_qa_dir = qa_dir / "space-door-closures"
            qa_rgba.crop(crop_box).save(space_qa_dir / f"{floor['id']}-{spec['id']}.png")

        page_pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        overlay_base = Image.frombytes("RGB", [page_pixmap.width, page_pixmap.height], page_pixmap.samples).convert("RGBA")
        overlay = Image.new("RGBA", overlay_base.size, (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay, "RGBA")
        palette = [(0, 126, 167, 70), (226, 90, 25, 70), (94, 60, 153, 70), (0, 140, 90, 70)]
        for index, (space_id, seed_at, geometry) in enumerate(floor_space_geometries):
            color = palette[index % len(palette)]
            exterior = [(round(x * 2), round(y * 2)) for x, y in geometry.exterior.coords]
            overlay_draw.polygon(exterior, fill=color, outline=(*color[:3], 255), width=2)
            overlay_draw.text((round(seed_at[0] * 2 + 4), round(seed_at[1] * 2 + 4)), space_id, fill=(*color[:3], 255))
        composed = Image.alpha_composite(overlay_base, overlay)
        crop_pixels = tuple(round(value * 2) for value in floor["crop"])
        composed.crop(crop_pixels).save(qa_dir / f"{floor['id']}-spaces-overlay.png")

        if floor.get("flatDetails"):
            stair_overlay = np.asarray(image).copy()
            stair_overlay[stair_detail_mask] = [220, 50, 47]
            stair_overlay[walls & cv2.dilate(stair_detail_mask.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)] = [0, 92, 190]
            Image.fromarray(stair_overlay, "RGB").save(qa_dir / f"{floor['id']}-stair-source-overlay.png")
            stair_review_dir = qa_dir / "stair-review"
            for stair_id, selector in stair_review_masks:
                ys, xs = np.nonzero(selector)
                x0 = max(0, int(xs.min()) - 16)
                y0 = max(0, int(ys.min()) - 16)
                x1 = min(image.width, int(xs.max()) + 17)
                y1 = min(image.height, int(ys.max()) + 17)
                panels = [
                    ("SOURCE", Image.fromarray(rgb[y0:y1, x0:x1], "RGB")),
                    ("SEMANTIC", Image.fromarray(clean[y0:y1, x0:x1], "RGB")),
                    ("RED FLAT / BLUE WALL", Image.fromarray(stair_overlay[y0:y1, x0:x1], "RGB")),
                ]
                panel_width = panels[0][1].width
                panel_height = panels[0][1].height
                comparison = Image.new("RGB", (panel_width * 3, panel_height + 24), "white")
                comparison_draw = ImageDraw.Draw(comparison)
                for panel_index, (label, panel) in enumerate(panels):
                    comparison.paste(panel, (panel_index * panel_width, 24))
                    comparison_draw.text((panel_index * panel_width + 4, 5), label, fill="black")
                comparison.resize((comparison.width * 3, comparison.height * 3)).save(
                    stair_review_dir / f"{floor['id']}-{stair_id}.png"
                )

        audit[floor["id"]] = {
            "sourceImageXref": xref,
            "sourceImageSize": list(image.size),
            "sourcePlacementRect": [round(value, 6) for value in image_rect],
            "sourceNeutralPixels": int(neutral.sum()),
            "sourceStructuralPixels": int(structural.sum()),
            "wallMaxChannel": 220,
            "omittedNeutralShadowPixels": int((neutral & ~structural).sum()),
            "sourceGreenPixels": int(green.sum()),
            "sourceWallPixelsBeforeNoiseFilter": source_wall_pixels_before_noise_filter,
            "wallPixels": int(walls.sum()),
            "retainedWallComponentMinimumPixels": 9,
            "omittedWallNoisePixels": omitted_wall_noise_pixels,
            "flatDetailPixels": int(details.sum()),
            "flatStairDetailPixels": int(stair_detail_mask.sum()),
            "reviewedStairs": stair_audit,
            "omittedSourceContextPixels": int(((neutral | green) & ~(walls | details)).sum()),
            "syntheticGeometryPixels": 0,
            "retainGardenContext": floor["retainGardenContext"],
            "omitContextRects": floor.get("omitContextRects", []),
            "retainedPixelsInsideOmitContextRects": int(((walls | details) & explicit_context).sum()),
            "spaces": floor_space_audit,
        }
        door_closure_audit[floor["id"]] = floor_door_closure_audit

    output.save(output_path, deflate=True, no_new_id=True)
    output.close()
    source.close()
    space_path.write_text(json.dumps(spaces, ensure_ascii=False, indent=2) + "\n")
    (qa_dir / "semantic-audit.json").write_text(
        json.dumps(audit, ensure_ascii=False, indent=2) + "\n"
    )
    (qa_dir / "space-door-closure-checkpoints.json").write_text(
        json.dumps(door_closure_audit, ensure_ascii=False, indent=2) + "\n"
    )
    print(output_path)
    print(space_path)
    print(qa_dir / "semantic-audit.json")
    print(qa_dir / "space-door-closure-checkpoints.json")


if __name__ == "__main__":
    main()
