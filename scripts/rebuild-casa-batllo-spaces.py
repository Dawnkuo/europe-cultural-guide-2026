#!/usr/bin/env python3
"""Derive only closed Casa Batllo floor faces from the pinned plan rasters."""

import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely.geometry import Polygon


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/casa-batllo.json"
SOURCE = ROOT / "sources/floorplans/casa-batllo-ar-post-gaudi-plans.pdf"
PRIMARY = ROOT / "sources/floorplans/investigated/casa-batllo-architectural-review-drawings.pdf"
QA = ROOT / "sources/floorplans/qa"
SOURCE_SHA256 = "4da44d67084cd65c7395947142853ae44c2a2cdfcc93967a94dbae2c7fa7c857"
PRIMARY_SHA256 = "bd3d92782bd35d3ab93aa3c55f291cae05163b7742a2ff2269cd16c74343d3ba"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_trace_pixel_ink():
    path = ROOT / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_plan_builder", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.trace_pixel_ink


def ring_points(ring):
    return [[round(x, 4), round(y, 4)] for x, y in ring.coords]


def source_face(rgb, seed, expected_area, expected_bounds):
    ink = (rgb.max(axis=2) <= 235).astype(np.uint8)
    _, labels, stats, _ = cv2.connectedComponentsWithStats(1 - ink, 8)
    x, y = seed
    label = labels[y, x]
    mask = (labels == label).astype(np.uint8)
    if int(mask.sum()) != expected_area or stats[label, :4].tolist() != expected_bounds:
        raise ValueError(
            f"Casa Batllo source face changed at {seed}: "
            f"{int(mask.sum())}, {stats[label, :4].tolist()}"
        )

    geometry = load_trace_pixel_ink()(mask, 0.15)
    parts = list(geometry.geoms) if geometry.geom_type == "MultiPolygon" else [geometry]
    polygon = max(parts, key=lambda item: item.area)
    holes = [Polygon(ring) for ring in polygon.interiors if Polygon(ring).area >= 20]
    filtered = Polygon(polygon.exterior, [hole.exterior.coords for hole in holes])
    if not filtered.is_valid or filtered.area <= 0:
        raise ValueError(f"Invalid source-derived face at {seed}")
    return {
        "outer": ring_points(filtered.exterior),
        "holes": [ring_points(ring) for ring in filtered.interiors],
    }, mask, filtered


def write_overlay(rgb, geometry, output, colour):
    layer = np.zeros(rgb.shape[:2], np.uint8)
    cv2.fillPoly(layer, [np.asarray(geometry.exterior.coords, np.int32)], 255)
    for hole in geometry.interiors:
        cv2.fillPoly(layer, [np.asarray(hole.coords, np.int32)], 0)
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    tint = np.empty_like(bgr)
    tint[:] = colour
    selected = layer > 0
    bgr[selected] = (bgr[selected] * 0.55 + tint[selected] * 0.45).astype(np.uint8)
    cv2.imwrite(str(output), bgr)


def source_masks(rgb):
    ink = (rgb.max(axis=2) <= 235).astype(np.uint8)
    walls = cv2.morphologyEx(ink, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    walls &= ink
    return ink, walls


def reviewed_first_floor_flat_rects(rgb):
    _ink, walls = source_masks(rgb)
    _, _labels, stats, _ = cv2.connectedComponentsWithStats(walls, 8)
    regions = [
        {
            "id": "rear-terrace-paving-intersections",
            "bounds": (110, 32, 120, 42),
            "maxArea": 20,
            "maxWidth": 4,
            "maxHeight": 5,
            "reason": "Three isolated 3-4 pixel paving-grid intersections are flat source detail, not masonry.",
        },
        {
            "id": "rear-terrace-paving-intersections",
            "bounds": (259, 58, 270, 69),
            "maxArea": 20,
            "maxWidth": 4,
            "maxHeight": 5,
            "reason": "Three isolated 3-4 pixel paving-grid intersections are flat source detail, not masonry.",
        },
        {
            "id": "rear-terrace-paving-intersections",
            "bounds": (85, 159, 96, 171),
            "maxArea": 20,
            "maxWidth": 4,
            "maxHeight": 5,
            "reason": "Three isolated 3-4 pixel paving-grid intersections are flat source detail, not masonry.",
        },
        {
            "id": "central-hatching-and-stair-treads",
            "bounds": (755, 150, 1090, 258),
            "maxArea": 100,
            "maxWidth": 25,
            "maxHeight": 25,
            "reason": "Small disconnected morphology remnants inside the reviewed hatch and stair-tread fields are flat source detail; connected enclosure walls remain structural.",
        },
        {
            "id": "spiral-stair-interior",
            "bounds": (676, 300, 724, 352),
            "maxArea": 200,
            "maxWidth": 25,
            "maxHeight": 40,
            "reason": "Disconnected line intersections inside the spiral-stair symbol are flat stair detail; the enclosing wall components are outside this locked region.",
        },
        {
            "id": "curved-stair-treads",
            "bounds": (890, 330, 1030, 386),
            "maxArea": 100,
            "maxWidth": 25,
            "maxHeight": 25,
            "reason": "Disconnected remnants wholly inside the curved-stair tread field are flat detail; the source outer curve and south perimeter are excluded from this region.",
        },
    ]
    selected = []
    selected_components = set()
    for region in regions:
        rx0, ry0, rx1, ry1 = region["bounds"]
        for component in range(1, len(stats)):
            x, y, width, height, area = (int(value) for value in stats[component])
            if component in selected_components:
                continue
            if not (rx0 <= x and ry0 <= y and x + width <= rx1 and y + height <= ry1):
                continue
            if area > region["maxArea"] or width > region["maxWidth"] or height > region["maxHeight"]:
                continue
            selected_components.add(component)
            selected.append({
                "rect": [x, y, x + width, y + height],
                "reason": region["reason"],
                "reviewRegion": region["id"],
                "sourceComponent": component,
                "sourceInkPixels": area,
            })

    expected_counts = {
        "rear-terrace-paving-intersections": 3,
        "central-hatching-and-stair-treads": 57,
        "spiral-stair-interior": 5,
        "curved-stair-treads": 8,
    }
    actual_counts = {
        id_: sum(item["reviewRegion"] == id_ for item in selected)
        for id_ in expected_counts
    }
    if actual_counts != expected_counts:
        raise ValueError(f"Casa Batllo semantic component inventory changed: {actual_counts}")

    flattened = walls.copy()
    for item in selected:
        x0, y0, x1, y1 = item["rect"]
        flattened[y0:y1, x0:x1] = 0
    structural_probes = [
        ("terrace north perimeter", (180, 20, 320, 30), 300),
        ("terrace south perimeter", (180, 380, 320, 390), 300),
        ("terrace east curved wall", (374, 120, 470, 290), 500),
        ("central enclosure", (740, 142, 955, 265), 1200),
        ("street facade", (1340, 25, 1410, 385), 500),
    ]
    for label, (x0, y0, x1, y1), minimum in structural_probes:
        remaining = int(flattened[y0:y1, x0:x1].sum())
        if remaining < minimum:
            raise ValueError(f"Structural probe failed for {label}: {remaining}")
    return selected, flattened


def write_wall_detail_contact(rgb, ink, walls, output):
    source = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    wall = np.full_like(source, 255)
    wall[walls > 0] = 0
    detail = np.full_like(source, 255)
    detail[(ink & (1 - walls)) > 0] = 0
    separator = np.full((8, source.shape[1], 3), 220, np.uint8)
    cv2.imwrite(str(output), np.vstack((source, separator, wall, separator, detail)))


def main():
    if digest(SOURCE) != SOURCE_SHA256 or digest(PRIMARY) != PRIMARY_SHA256:
        raise ValueError("Pinned Casa Batllo source bytes changed")
    document = fitz.open(SOURCE)
    try:
        rasters = {}
        for name, xref in (("first", 11), ("second", 15)):
            pixmap = fitz.Pixmap(document, xref)
            rasters[name] = np.frombuffer(pixmap.samples, np.uint8).reshape(
                pixmap.height, pixmap.width, pixmap.n
            )[:, :, :3]
    finally:
        document.close()

    first_ring, first_mask, first_geometry = source_face(
        rasters["first"], (1308, 202), 238490, [432, 28, 954, 366]
    )
    second_ring, second_mask, second_geometry = source_face(
        rasters["second"], (548, 103), 234605, [54, 26, 907, 363]
    )
    cv2.imwrite(str(QA / "casa-batllo-first-source-face-mask.png"), first_mask * 255)
    cv2.imwrite(str(QA / "casa-batllo-second-source-face-mask.png"), second_mask * 255)
    write_overlay(
        rasters["first"], first_geometry,
        QA / "casa-batllo-first-source-face-overlay.png", (220, 140, 70),
    )
    write_overlay(
        rasters["second"], second_geometry,
        QA / "casa-batllo-second-source-face-overlay.png", (80, 180, 110),
    )

    config = json.loads(CONFIG.read_text())
    floors = {floor["id"]: floor for floor in config["floors"]}
    first_flat_rects, first_walls = reviewed_first_floor_flat_rects(rasters["first"])
    first_ink, _ = source_masks(rasters["first"])
    write_wall_detail_contact(
        rasters["first"], first_ink, first_walls,
        QA / "casa-batllo-first-source-wall-detail-semantic-contact.png",
    )
    floors["historic-first-floor"]["rasterLayers"][0]["flatRects"] = first_flat_rects
    floors["historic-ground-floor"]["spaces"] = []
    floors["historic-first-floor"]["spaces"] = [{
        "id": "closed-interior-floor",
        "label": "历史主层闭合室内面",
        "placeId": "historic-first-floor-5-1",
        "tone": "neutral",
        "polygons": [first_ring],
        "sourcePaths": [11],
        "scope": "floor",
        "evidence": "Exact white connected component bounded by ink in native first-floor raster xref 11. It contains published anchors 5, 6 and 7, follows the irregular room walls, and excludes the central stair/light-well core; the gridded rear terrace is not inferred as a filled slab.",
    }]
    floors["historic-second-floor"]["spaces"] = [{
        "id": "closed-interior-floor",
        "label": "历史二层闭合室内面",
        "placeId": "historic-second-floor-9-1",
        "tone": "neutral",
        "polygons": [second_ring],
        "sourcePaths": [15],
        "scope": "floor",
        "evidence": "Exact white connected component bounded by ink in native second-floor raster xref 15. It contains both distinct printed 9 anchors and follows room, light-well, stair and facade recesses without an approximate footprint polygon.",
    }]
    classification_note = (
            " A source/wall/detail contact render verifies the 3 by 3 source-only opening: "
            "only ink surviving the kernel remains structural, while all rejected ink remains flat detail."
    )
    for floor in config["floors"]:
        reason = floor["rasterLayers"][0]["reason"]
        if classification_note.strip() not in reason:
            floor["rasterLayers"][0]["reason"] = reason + classification_note

    review_note = (
        " Native source/wall/detail contacts were reviewed after the shared source-only morphology fix. "
        "The main- and second-floor surfaces are exact locked white connected components from the source rasters; no ground-floor surface is asserted because its entry/lobby whites connect to the page exterior, and no terrace surface is asserted through the paving grid. "
        "On the main floor, 73 disconnected morphology remnants inside four locked paving, hatching and stair-detail regions are reclassified as flat detail using their exact source-component bounds. Five retained-wall probes lock the terrace perimeter, curved east wall, central enclosure and street facade."
    )
    base_review = config["review"].split(" Native source/wall/detail contacts were reviewed")[0].rstrip()
    config["review"] = base_review + review_note
    config["limitations"] = [
        "本模型仅重建来源明确绘出的底层、主层与二层；它们是高迪改造后的历史建筑平面，不是当前访客地图。",
        "阁楼、龙脊屋顶、现行三层住宅、地下 Gaudi Cube 与 Gaudi Dome 均缺少可核验的完整正投影平面，因此不绘制、不绑定。",
        "主层与二层只填充来源实际闭合的室内连通面；底层入口/门厅与页外白底相连，主层后露台被铺地网格分割，均不封口补面。",
        "铺地、楼梯踏步、家具及装饰线保持为平面细节；主层 73 个误入墙类的孤立细线交点已按来源连通分量精确降为细部，露台边墙、中央楼梯围护与街道立面仍由锁定采样保留。",
        "母页嵌图变换支持三层采用近似相同出版比例，但裁切范围与轻微旋转不同；各层保持独立原点，不宣称测量级竖向配准。",
    ]
    if "Closed ground-floor entry/lobby floor faces without inventing closures at exterior-connected door openings" not in config["unresolved"]:
        config["unresolved"].append(
            "Closed ground-floor entry/lobby floor faces without inventing closures at exterior-connected door openings"
        )
    event_url = "https://www.casabatllo.es/en/events/"
    if not any(item["url"] == event_url for item in config["research"]):
        config["research"].append({
            "url": event_url,
            "status": "semantic-only",
            "finding": "The current official events page confirms the attic and Dragon Rooftop as a paired venue offer, but supplies photographs and capacity context rather than an orthographic floor plan or boundary drawing.",
        })
    reference_url = "https://books.google.com/books/about/Gaud%C3%AD_1852_1926.html?id=HLUyAQAAIAAJ"
    if not any(item["url"] == reference_url for item in config["research"]):
        config["research"].append({
            "url": reference_url,
            "status": "bibliographic-lead-not-used",
            "finding": "Google Books verifies Rainer Zerbst's illustrated Taschen monograph bibliographically, but the accessible record does not expose the Casa Batllo plan plate at usable resolution or establish its survey date.",
        })
    slides_url = "https://www.slideshare.net/slideshow/gaudi-125265899/125265899"
    slides_record = next((item for item in config["research"] if item["url"] == slides_url), None)
    if slides_record is None:
        slides_record = {
            "url": slides_url,
            "status": "inspected-untrusted-reproduction-not-used",
            "finding": "A student-uploaded plate reproduces separate attic and upper-floor diagrams, but omits the original plate's drafter, survey date and source citation. It is retained only as a search lead and cannot support current visitor geometry.",
        }
        config["research"].append(slides_record)
    slides_record.update({
        "file": "investigated/casa-batllo-slideshare-drawings.webp",
        "sha256": "99a893c7e051ff442eb7f79aaffbe25fd1da095ca1178a9200c8b221e5019d3b",
    })
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    print(CONFIG)


if __name__ == "__main__":
    main()
