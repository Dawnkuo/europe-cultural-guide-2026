#!/usr/bin/env python3
"""Trace Santa Maria delle Grazie semantic faces from Pica's 1937 source pixels."""

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely.affinity import affine_transform
from shapely.geometry import Point


SOURCE_SHA256 = "9ffc21b257440d523715954e7bb830cc19baee7e81981c3870540912b8e6966a"
IMAGE_XREF = 8
IMAGE_SIZE = (1420, 885)
IMAGE_MATRIX = (479.29998779296875, 0.0, -0.0, 298.8599853515625, 58.75899887084961, 471.49798583984375)
SOURCE_KEYS = {str(number) for number in range(1, 14)}

# These lines close source openings for connected-component selection only.
# They never replace, erase, or add to the model's source wall layer.
CUTS = []


def segment(id_, start, end, reason):
    CUTS.append({"id": id_, "segment": [start, end], "reason": reason})


def boundary(id_, x0, y0, x1, y1, reason):
    segment(f"{id_}-top", (x0, y0), (x1, y0), reason)
    segment(f"{id_}-right", (x1, y0), (x1, y1), reason)
    segment(f"{id_}-bottom", (x1, y1), (x0, y1), reason)
    segment(f"{id_}-left", (x0, y1), (x0, y0), reason)


PHYSICAL_GAP = "沿源墙中心补齐门窗或柱间缺口，仅用于选择面闭合；原墙像素保持不变。"
SEMANTIC_CUT = "沿源柱列或开敞阈线划分语义选区；不是墙、门或通行状态。"

boundary("zone-6", 700, 80, 884, 178, PHYSICAL_GAP)
boundary("zone-5-outer", 850, 30, 1090, 226, PHYSICAL_GAP)
boundary("zone-5-court", 900, 58, 1057, 198, PHYSICAL_GAP)
boundary("zone-7-outer", 758, 205, 902, 318, PHYSICAL_GAP)
boundary("zone-7-court", 792, 235, 876, 306, PHYSICAL_GAP)
boundary("zone-8", 897, 225, 1090, 318, PHYSICAL_GAP)
boundary("zone-9", 850, 318, 928, 382, PHYSICAL_GAP)
boundary("zone-10", 762, 318, 850, 382, PHYSICAL_GAP)
boundary("zone-1", 928, 318, 1090, 382, PHYSICAL_GAP)
boundary("zone-11-outer", 760, 382, 1060, 675, PHYSICAL_GAP)
boundary("zone-11-court", 798, 410, 1028, 644, PHYSICAL_GAP)
boundary("zone-12-outer", 700, 382, 760, 675, PHYSICAL_GAP)
segment("zone-12-spine", (726, 400), (726, 650), PHYSICAL_GAP)
for y in (451, 501, 551, 601, 651):
    segment(f"zone-12-partition-{y}", (726, y), (760, y), PHYSICAL_GAP)
boundary("zone-13", 735, 675, 1035, 752, PHYSICAL_GAP)
boundary("zone-2-outer", 1059, 382, 1320, 706, PHYSICAL_GAP)
segment("zone-2-west-column-axis", (1112, 382), (1112, 706), SEMANTIC_CUT)
segment("zone-2-east-column-axis", (1248, 382), (1248, 706), SEMANTIC_CUT)
segment("zone-3-north-threshold", (1090, 195), (1265, 195), SEMANTIC_CUT)
segment("zone-3-south-threshold", (1090, 358), (1265, 358), SEMANTIC_CUT)
boundary("review-crop", 650, 1, 1380, 760, "封闭审核裁切边缘，防止选区泄漏到图外背景。")


FACES = [
    {"id": "rosary-chapel", "label": "1 · 玫瑰圣母小堂", "placeId": "church-1-1", "sourceKeys": ["1"], "seeds": [(1000, 345)], "scope": "room"},
    {"id": "solari-west-aisle", "label": "2 · 索拉里教堂图面左侧廊", "placeId": "church-索拉里教堂图面左侧廊-1", "sourceKeys": ["2"], "seeds": [(1085, 394), (1085, 432), (1086, 481), (1080, 600)], "selectionOnly": True},
    {"id": "solari-central-nave", "label": "2 · 索拉里教堂中央中殿", "placeId": "church-2-1", "sourceKeys": ["2"], "seeds": [(1180, 500)], "selectionOnly": True},
    {"id": "solari-east-aisle", "label": "2 · 索拉里教堂图面右侧廊", "placeId": "church-索拉里教堂图面右侧廊-1", "sourceKeys": ["2"], "seeds": [(1282, 543)], "selectionOnly": True},
    {"id": "tribune-core", "label": "3 · Tribune主体与侧向半圆空间", "placeId": "church-3-1", "sourceKeys": ["3"], "seeds": [(1160, 280)], "selectionOnly": True, "local": "tribune-core"},
    {"id": "tribune-apse", "label": "3 · Tribune后殿", "placeId": "church-Tribune后殿-1", "sourceKeys": ["3"], "seeds": [(1170, 140)], "selectionOnly": True, "local": "tribune-apse"},
    {"id": "small-sacristy", "label": "4 · 小圣器室", "placeId": "church-4-1", "sourceKeys": ["4"], "seeds": [(1115, 130)], "scope": "room", "local": "small-sacristy"},
    {"id": "frogs-cloister", "label": "5 · 青蛙回廊环带", "placeId": "church-青蛙回廊环带-1", "sourceKeys": ["5"], "seeds": [(985, 40), (866, 130)], "scope": "room"},
    {"id": "old-sacristy", "label": "6 · 旧圣器室", "placeId": "church-6-1", "sourceKeys": ["6"], "seeds": [(785, 125)], "scope": "room"},
    {"id": "prior-cloister", "label": "7 · 院长回廊环带", "placeId": "church-院长回廊环带-1", "sourceKeys": ["7"], "seeds": [(830, 215)], "scope": "room"},
    {"id": "new-sacristy", "label": "8 · 新圣器室", "placeId": "church-8-1", "sourceKeys": ["8"], "seeds": [(980, 270)], "scope": "room"},
    {"id": "chapter-house", "label": "9 · 会士厅", "placeId": "church-9-1", "sourceKeys": ["9"], "seeds": [(880, 345)], "scope": "room"},
    {"id": "locutory", "label": "10 · 会客厅", "placeId": "church-10-1", "sourceKeys": ["10"], "seeds": [(805, 345)], "scope": "room"},
    {"id": "dead-cloister", "label": "11 · 亡者回廊环带", "placeId": "church-亡者回廊环带-1", "sourceKeys": ["11"], "seeds": [(900, 390)], "scope": "room"},
    {"id": "northern-wing", "label": "12 · 亡者回廊北翼（历史图注：其上为图书馆）", "placeId": "church-12-1", "sourceKeys": ["12"], "seeds": [(715, 545), (740, 396), (743, 432), (743, 476), (743, 513), (743, 539), (743, 576), (743, 624)], "scope": "room"},
    {"id": "refectory", "label": "13 · 食堂", "placeId": "church-13-1", "sourceKeys": ["13"], "seeds": [(900, 710)], "scope": "room"},
]

# Filled after visual inspection. Each item is [pixel area, [x, y, width, height]].
EXPECTED = {
    "rosary-chapel": [[8248, [945, 320, 144, 61]]],
    "solari-west-aisle": [[13985, [1062, 384, 49, 321]]],
    "solari-central-nave": [[42130, [1114, 384, 133, 321]]],
    "solari-east-aisle": [[18198, [1250, 384, 69, 321]]],
    "tribune-core": [[26869, [1070, 197, 226, 160]]],
    "tribune-apse": [[7732, [1144, 80, 77, 114]]],
    "small-sacristy": [[4402, [1091, 81, 49, 110]]],
    "frogs-cloister": [[16431, [852, 32, 237, 192]], [2534, [852, 88, 31, 86]]],
    "old-sacristy": [[12672, [702, 82, 147, 93]]],
    "prior-cloister": [[6674, [760, 207, 136, 110]]],
    "new-sacristy": [[12816, [904, 228, 180, 89]]],
    "chapter-house": [[4297, [852, 320, 75, 61]]],
    "locutory": [[4785, [764, 320, 85, 61]]],
    "dead-cloister": [[28379, [762, 384, 296, 290]]],
    "northern-wing": [[7331, [702, 384, 57, 290]], [1050, [728, 415, 31, 35]], [1457, [728, 453, 31, 47]], [1457, [728, 503, 31, 47]], [1457, [728, 553, 31, 47]], [1457, [728, 603, 31, 47]]],
    "refectory": [[20702, [739, 677, 286, 74]]],
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_builder(root):
    path = root / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_plan_builder", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def pixel_rect(rect, inverse, width, height):
    transformed = fitz.Rect(rect) * inverse
    return (
        max(0, round(transformed.x0 * width)),
        max(0, round(transformed.y0 * height)),
        min(width, round(transformed.x1 * width)),
        min(height, round(transformed.y1 * height)),
    )


def component_mask(barrier, seeds):
    count, labels, stats, _ = cv2.connectedComponentsWithStats(1 - barrier, connectivity=4)
    component_ids = []
    inventory = []
    for seed in seeds:
        x, y = seed
        component = int(labels[y, x])
        if component == 0:
            raise ValueError(f"Reviewed seed lies on a selection barrier: {seed}")
        if component not in component_ids:
            component_ids.append(component)
            inventory.append([int(stats[component, 4]), [int(value) for value in stats[component, :4]]])
    mask = np.isin(labels, component_ids).astype(np.uint8)
    return mask, inventory


def local_barrier(kind, structural):
    closed = cv2.morphologyEx(structural, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    barrier = structural | closed
    roi = np.zeros_like(barrier)
    if kind == "tribune-core":
        cv2.rectangle(roi, (1045, 195), (1305, 358), 1, -1)
        for start, end in (
            ((1045, 195), (1305, 195)),
            ((1045, 358), (1305, 358)),
            ((1045, 195), (1045, 358)),
            ((1305, 195), (1305, 358)),
            ((1090, 195), (1090, 220)),
            ((1090, 330), (1090, 358)),
            ((1265, 195), (1265, 220)),
            ((1265, 330), (1265, 358)),
        ):
            cv2.line(barrier, start, end, 1, 2, cv2.LINE_8)
    elif kind == "tribune-apse":
        cv2.rectangle(roi, (1088, 65), (1240, 198), 1, -1)
        cv2.line(barrier, (1090, 195), (1238, 195), 1, 2, cv2.LINE_8)
    elif kind == "small-sacristy":
        barrier = structural.copy()
        cv2.rectangle(roi, (1088, 78), (1142, 198), 1, -1)
        for start, end in (((1089, 79), (1141, 79)), ((1141, 79), (1141, 197)), ((1141, 197), (1089, 197)), ((1089, 197), (1089, 79))):
            cv2.line(barrier, start, end, 1, 2, cv2.LINE_8)
    else:
        raise ValueError(f"Unknown local face mode: {kind}")
    barrier[roi == 0] = 1
    return barrier


def source_geometry(builder, mask, matrix, width, height):
    transform = [matrix.a / width, matrix.c / height, matrix.b / width, matrix.d / height, matrix.e, matrix.f]
    geometry = affine_transform(builder.trace_pixel_ink(mask, tolerance=0.05), transform)
    if geometry.is_empty or not geometry.is_valid or geometry.area <= 0:
        raise ValueError("Invalid source-pixel face geometry")
    return geometry


def place_lookup(floor):
    result = {}
    counts = {}
    for place in [*floor.get("places", []), *floor.get("servicePlaces", [])]:
        label = place["label"]
        counts[label] = counts.get(label, 0) + 1
        result[f"{floor['id']}-{label.replace(' ', '-')}-{counts[label]}"] = place
    return result


def write_overlay(path, rgb, masks, wall_mask, cuts, faces):
    output = rgb.copy()
    palette = [(222, 178, 76), (73, 160, 118), (84, 138, 206), (190, 96, 154), (118, 95, 196)]
    for index, face in enumerate(faces):
        selected = masks[face["id"]] == 1
        colour = np.asarray(palette[index % len(palette)], np.uint8)
        output[selected] = (output[selected] * 0.60 + colour * 0.40).astype(np.uint8)
    output[wall_mask == 1] = (30, 30, 30)
    for cut in cuts:
        cv2.line(output, tuple(cut["segment"][0]), tuple(cut["segment"][1]), (255, 0, 255), 1, cv2.LINE_8)
    for face in faces:
        for x, y in face["seeds"]:
            cv2.circle(output, (x, y), 3, (255, 0, 0), -1)
    cv2.imwrite(str(path), cv2.cvtColor(output[0:761, 650:1381], cv2.COLOR_RGB2BGR))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--discover", action="store_true", help="Print component signatures without changing config files")
    args = parser.parse_args()
    root = args.root.resolve()
    config_path = root / "sources/floorplans/venues/santa-maria-grazie.json"
    config = json.loads(config_path.read_text())
    source = root / "sources/floorplans" / config["file"]
    if digest(source) != SOURCE_SHA256 or config["sha256"] != SOURCE_SHA256:
        raise ValueError("Pinned Pica source bytes changed")
    floor = config["floors"][0]
    if {place["label"] for place in floor["places"]} != SOURCE_KEYS:
        raise ValueError("Printed source key inventory is no longer exactly 1-13")
    builder = load_builder(root)

    with fitz.open(source) as document:
        page = document[floor["page"] - 1]
        pixmap = fitz.Pixmap(document, IMAGE_XREF)
        if pixmap.colorspace != fitz.csRGB:
            pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
        if (pixmap.width, pixmap.height) != IMAGE_SIZE:
            raise ValueError("Pinned embedded image dimensions changed")
        matrix = page.get_image_rects(IMAGE_XREF, transform=True)[0][1]
        actual_matrix = (matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f)
        if any(abs(a - b) > 1e-6 for a, b in zip(actual_matrix, IMAGE_MATRIX)):
            raise ValueError(f"Pinned embedded image transform changed: {actual_matrix}")
        rgb = np.frombuffer(pixmap.samples, np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)[:, :, :3].copy()

    raster = floor["rasterLayers"][0]
    low, high = raster["rgbRange"]
    ink = np.all((rgb >= low) & (rgb <= high), axis=2).astype(np.uint8)
    inverse = ~matrix
    for exclusion in raster.get("excludeRects", []):
        x0, y0, x1, y1 = pixel_rect(exclusion["rect"], inverse, pixmap.width, pixmap.height)
        ink[y0:y1, x0:x1] = 0
    model_walls = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((raster["wallKernel"], raster["wallKernel"]), np.uint8)) & ink
    structural = model_walls.copy()
    barrier = structural.copy()
    for cut in CUTS:
        cv2.line(barrier, tuple(cut["segment"][0]), tuple(cut["segment"][1]), 1, 2, cv2.LINE_8)

    masks = {}
    records = []
    spaces = []
    source_key_coverage = set()
    place_by_id = place_lookup(floor)
    for face in FACES:
        selected_barrier = local_barrier(face["local"], structural) if "local" in face else barrier
        mask, inventory = component_mask(selected_barrier, face["seeds"])
        masks[face["id"]] = mask
        source_key_coverage.update(face["sourceKeys"])
        expected = EXPECTED.get(face["id"])
        if not args.discover and inventory != expected:
            raise ValueError(f"Source face inventory changed for {face['id']}: {inventory} != {expected}")
        geometry = source_geometry(builder, mask, matrix, pixmap.width, pixmap.height)
        wall_intersection_pixels = int(np.count_nonzero(mask & model_walls))
        if wall_intersection_pixels:
            raise ValueError(f"Source face overlaps source wall pixels: {face['id']} {wall_intersection_pixels}")
        place = place_by_id[face["placeId"]]
        if face["id"] == "prior-cloister":
            representative = geometry.representative_point()
            place["at"] = [round(representative.x, 4), round(representative.y, 4)]
            place["evidence"] = "非印刷辅助锚点，取原生像素追踪所得院长回廊白区的内部代表点。"
            place["precision"] = "source-white-component-representative-point"
        contains_anchor = geometry.covers(Point(place["at"]))
        if not contains_anchor:
            raise ValueError(f"Place anchor is outside source face: {face['id']} {face['placeId']}")
        space = {
            "id": face["id"],
            "label": face["label"],
            "placeId": face["placeId"],
            "polygons": builder.polygons(geometry, [0, 0]),
            "sourcePaths": [f"image:{IMAGE_XREF}:reviewed-white-components"],
            "sourceKeys": face["sourceKeys"],
            "evidence": "原生嵌图中由源墙像素及经审核选择闭合段围成的白区；闭合段不进入墙层，也不表示通行状态。",
        }
        if face.get("scope"):
            space["scope"] = face["scope"]
        if face.get("selectionOnly"):
            space["selectionOnly"] = True
        spaces.append(space)
        records.append({
            "id": face["id"],
            "sourceKeys": face["sourceKeys"],
            "selectionOnly": bool(face.get("selectionOnly")),
            "components": inventory,
            "pixelArea": int(mask.sum()),
            "polygonCount": len(space["polygons"]),
            "holes": sum(len(polygon["holes"]) for polygon in space["polygons"]),
            "containsPlaceAnchor": contains_anchor,
            "wallIntersectionPixels": wall_intersection_pixels,
        })

    if source_key_coverage != SOURCE_KEYS or len(spaces) != 16:
        raise ValueError(f"Incomplete source-key/space coverage: {source_key_coverage}, {len(spaces)}")
    for index, left in enumerate(FACES):
        for right in FACES[index + 1:]:
            overlap = int(np.count_nonzero(masks[left["id"]] & masks[right["id"]]))
            if overlap:
                raise ValueError(f"Source faces overlap: {left['id']} / {right['id']} = {overlap} pixels")

    if args.discover:
        print(json.dumps({record["id"]: record["components"] for record in records}, indent=2))
        return

    floor["spaces"] = spaces
    floor.pop("selectionSpaces", None)
    floor["selectionCuts"] = [
        {
            "id": cut["id"],
            "sourcePixelSegment": [list(cut["segment"][0]), list(cut["segment"][1])],
            "reason": cut["reason"],
        }
        for cut in CUTS
    ]
    for place in floor["places"]:
        if place["label"] == "12":
            place["displayLabel"] = "12 · 亡者回廊北翼（历史图注：其上为图书馆）"
            place["name"] = "亡者回廊北翼（皮卡1937年图注：其上为图书馆）"
            place["evidence"] = "原图编号12中心；图例原文说明该北翼上方为图书馆，未提供上层平面，也不证明现状用途。"
    config["limitations"] = [
        "本图依据皮卡1937年历史测绘，完整保留图例编号1至13；它不是现行访客通行图，也不表示战后改建、围栏或开放状态。",
        "十六个语义空间由原生像素白区追踪；门窗与柱间闭合只用于选区，原墙像素未删除或增补。",
        "索拉里教堂三廊及Tribune与后殿之间的划分为语义选区，不作为实体地板边界或新墙。",
        "编号12保留1937年图例所述的北翼历史方位及其上方图书馆说明；没有制造图书馆上层，也不声称当前用途。",
        "停靠点0、1、3、4仅具入口轴线或区域级定位；停靠点2与5仍缺可核对的精确现状位置。",
    ]
    config["review"] = "Pica 1937 plan reproduced on PDF page 3 was inspected from its native 1420 x 885 embedded image. Sixteen semantic faces are deterministic connected source-white components bounded by source structural pixels and recorded selection-only closures. Curved Tribune and apse interiors come from source pixels, not idealized arcs. Printed keys 1-13 remain at their original positions."
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")

    qa = root / "work/grazie-source-faces-v3"
    qa.mkdir(parents=True, exist_ok=True)
    write_overlay(qa / "source-faces-selection-cuts-overlay.png", rgb, masks, model_walls, CUTS, FACES)
    intersection = np.full_like(rgb, 255)
    intersection[model_walls == 1] = (25, 25, 25)
    for face in FACES:
        intersection[masks[face["id"]] == 1] = (190, 220, 205)
    intersection[(model_walls == 1) & (sum(masks.values()) > 0)] = (255, 0, 0)
    cv2.imwrite(str(qa / "source-face-wall-intersection.png"), cv2.cvtColor(intersection[0:761, 650:1381], cv2.COLOR_RGB2BGR))

    report = {
        "status": "皮卡1937年原生像素白区追踪候选；等待主线浏览器验收",
        "source": {"sha256": SOURCE_SHA256, "page": 3, "imageXref": IMAGE_XREF, "pixels": list(IMAGE_SIZE)},
        "method": "选区障碍直接使用配置的5像素源墙分类。审核闭合段只参与连通域选择，不写入墙层。",
        "printedSourceKeys": sorted(SOURCE_KEYS, key=int),
        "spaces": records,
        "selectionCuts": floor["selectionCuts"],
        "checks": {
            "spaceCount": len(spaces),
            "sourceKeyCoverage": sorted(source_key_coverage, key=int),
            "pairwiseFaceOverlapPixels": 0,
            "faceWallIntersectionPixels": 0,
            "zone12": "地面层北翼白区；保留1937年图注‘其上为图书馆’，不生成上层或现状用途。",
        },
    }
    report_path = root / "sources/floorplans/rebuild-reports/north-incremental-grazie-pica-1937-source-faces-v3.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(report["checks"], ensure_ascii=False))


if __name__ == "__main__":
    main()
