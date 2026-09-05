#!/usr/bin/env python3
"""Derive Cathedral floor and selection faces from the pinned official raster."""

import hashlib
import importlib.util
import json
import math
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely.geometry import Polygon


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/barcelona-cathedral.json"
RAW = ROOT / "sources/floorplans/barcelona-cathedral-official-plan.jpg"
REGISTERED = ROOT / "sources/floorplans/barcelona-cathedral-official-plan.pdf"
QA = ROOT / "work/barcelona-cathedral-source-review"
RAW_SHA256 = "5bb9a64dbe11ef80b9c4bab154c72ffecb6334f6c45a10e8c7d27e9bde30bbff"
REGISTERED_SHA256 = "38c753a2bf95af6d1202eeaafe619fce44ecf4a46dcbcc4537788a2e30723d91"
MARKERS = [*range(1, 12), *range(13, 27), *range(28, 40), *range(60, 82)]
SELECTION_COMPONENTS = {
    (1,): (5940, [585, 1185, 730, 1267]),
    (2, 13, 24): (247449, [480, 122, 932, 1193]),
    (3,): (4022, [755, 1150, 821, 1218]),
    (4,): (32364, [834, 1054, 1073, 1237]),
    (5,): (3661, [833, 996, 905, 1054]),
    (6,): (3426, [833, 916, 904, 975]),
    (7,): (3435, [833, 852, 904, 911]),
    (8,): (3400, [833, 789, 903, 847]),
    (9,): (3366, [833, 726, 904, 783]),
    (10,): (3398, [833, 660, 904, 719]),
    (11,): (3231, [833, 601, 904, 655]),
    (14,): (20016, [608, 579, 714, 865]),
    (15,): (7676, [412, 1150, 560, 1218]),
    (16,): (3971, [412, 1073, 478, 1145]),
    (17,): (3421, [412, 996, 478, 1053]),
    (18,): (3280, [412, 916, 478, 976]),
    (19,): (3264, [412, 852, 478, 911]),
    (20,): (3248, [412, 788, 478, 847]),
    (21,): (3212, [412, 726, 478, 783]),
    (22,): (3209, [412, 660, 478, 719]),
    (23,): (3053, [412, 601, 478, 655]),
    (25,): (5802, [396, 503, 478, 583]),
    (28,): (3476, [622, 398, 693, 460]),
    (29,): (4161, [401, 358, 478, 416]),
    (30,): (3022, [418, 283, 478, 346]),
    (31,): (2622, [437, 200, 495, 268]),
    (32,): (4385, [433, 126, 551, 205]),
    (33,): (3503, [543, 68, 622, 142]),
    (34,): (3338, [625, 54, 690, 118]),
    (35,): (4890, [694, 60, 826, 142]),
    (36,): (3084, [764, 126, 838, 193]),
    (37,): (2752, [818, 200, 878, 267]),
    (38,): (2699, [837, 283, 891, 344]),
    (39,): (19202, [815, 212, 979, 477]),
    (60,): (6516, [1044, 581, 1128, 665]),
    (61,): (3057, [973, 442, 1031, 506]),
    (62,): (3226, [1071, 444, 1132, 507]),
    (63,): (3258, [1138, 445, 1199, 508]),
    (64,): (3320, [1206, 445, 1266, 508]),
    (65,): (3297, [1273, 445, 1333, 509]),
    (66,): (3224, [1340, 445, 1400, 510]),
    (67,): (5014, [1417, 500, 1497, 584]),
    (68,): (5177, [1417, 592, 1493, 670]),
    (69,): (3729, [1417, 678, 1492, 739]),
    (70,): (3683, [1417, 793, 1491, 854]),
    (71, 72): (7033, [1417, 857, 1490, 978]),
    (73,): (4078, [1417, 985, 1488, 1052]),
    (74,): (9742, [1364, 1057, 1472, 1227]),
    (75,): (3660, [917, 983, 978, 1050]),
    (76,): (3195, [917, 916, 978, 978]),
    (77,): (3083, [917, 852, 978, 911]),
    (78,): (3007, [917, 788, 978, 847]),
    (79,): (2927, [917, 724, 978, 783]),
    (80,): (3134, [917, 660, 978, 719]),
    (81,): (2661, [917, 588, 978, 655]),
}


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


def source_face(labels, seed, expected_area, expected_bounds, required_hole_bounds):
    x, y = seed
    label = labels[y, x]
    mask = (labels == label).astype(np.uint8)
    ys, xs = np.nonzero(mask)
    bounds = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    if int(mask.sum()) != expected_area or bounds != expected_bounds:
        raise ValueError(f"Source face inventory changed at {seed}: {int(mask.sum())}, {bounds}")

    geometry = load_trace_pixel_ink()(mask, 0.15)
    parts = list(geometry.geoms) if geometry.geom_type == "MultiPolygon" else [geometry]
    polygon = max(parts, key=lambda item: item.area)
    holes = [Polygon(ring) for ring in polygon.interiors if Polygon(ring).area >= 20]
    hole_bounds = [tuple(round(value) for value in hole.bounds) for hole in holes]
    for required in required_hole_bounds:
        if required not in hole_bounds:
            raise ValueError(f"Required source exclusion disappeared: {required}")

    filtered = Polygon(polygon.exterior, [hole.exterior.coords for hole in holes])
    if not filtered.is_valid or filtered.area <= 0:
        raise ValueError(f"Invalid source-derived face at {seed}")
    return {
        "outer": ring_points(filtered.exterior),
        "holes": [ring_points(ring) for ring in filtered.interiors],
    }, mask, filtered


def selection_cuts(marker_places):
    cuts = []

    def add(id_, start, end, reason):
        cuts.append({"id": id_, "segment": [list(start), list(end)], "reason": reason})

    add("west-chapel-spine", (480, 350), (480, 1148), "Selection-only cut centered on the source wall band separating the west chapels from the public nave.")
    for y in (350, 418, 500, 585, 657, 721, 785, 849, 913, 980, 1055, 1148):
        add(f"west-chapel-threshold-{y}", (395, y), (482, y), "Selection-only closure across a reviewed west-chapel threshold or source partition band.")
    add("east-chapel-west-spine", (830, 585), (830, 1056), "Selection-only cut centered on the west source wall band of the east chapel row.")
    add("east-chapel-center-spine", (914, 585), (914, 1056), "Selection-only cut centered on the source partition between the paired east chapel rows.")
    add("east-chapel-east-spine", (980, 585), (980, 1056), "Selection-only cut centered on the east source wall band of the east chapel row.")
    for y in (585, 657, 721, 785, 849, 913, 980, 1056):
        add(f"east-chapel-threshold-{y}", (828, y), (982, y), "Selection-only closure across a reviewed east-chapel threshold or source partition band.")
    add("southwest-chapel-threshold", (500, 1147), (583, 1147), "Selection-only closure on the source threshold separating marker 15 from the entrance zone.")
    add("southeast-chapel-threshold", (730, 1147), (815, 1147), "Selection-only closure on the source threshold separating marker 3 from the entrance zone.")
    add("choir-north-threshold", (625, 576), (690, 576), "Selection-only closure on the source choir threshold; the choir wall and floor geometry remain unchanged.")
    add("choir-south-threshold", (625, 867), (690, 867), "Selection-only closure on the source choir threshold; the choir wall and floor geometry remain unchanged.")

    center = (657.0, 300.0)
    radius = 180.0
    half_chord = 34.0
    for number in range(30, 39):
        x, y = marker_places[number]["at"]
        dx, dy = x - center[0], y - center[1]
        magnitude = math.hypot(dx, dy)
        ux, uy = dx / magnitude, dy / magnitude
        px, py = center[0] + ux * radius, center[1] + uy * radius
        vx, vy = -uy, ux
        start = (round(px - vx * half_chord), round(py - vy * half_chord))
        end = (round(px + vx * half_chord), round(py + vy * half_chord))
        add(f"apse-chapel-{number}-chord", start, end, "Selection-only chord centered on the reviewed radial wall/threshold band between the apse ambulatory and this chapel.")

    add("chapel-39-west", (812, 354), (812, 479), "Selection-only cut on the visible west wall band of the marker 39 chapel complex.")
    add("chapel-39-north", (812, 354), (905, 354), "Selection-only cut on the visible north boundary of the marker 39 chapel complex.")
    add("chapel-39-south", (812, 479), (905, 479), "Selection-only cut on the visible south boundary of the marker 39 chapel complex.")
    add("chapel-61-west", (970, 442), (970, 512), "Selection-only cut on the visible west wall band of marker 61.")
    add("chapel-61-south", (970, 512), (1038, 512), "Selection-only cut on the visible south threshold of marker 61.")
    add("chapel-74-north", (1360, 1054), (1473, 1054), "Selection-only cut on the visible north threshold of marker 74.")
    return cuts


def selection_face(labels, seed, expected_area, expected_bounds):
    x, y = seed
    label = labels[y, x]
    mask = (labels == label).astype(np.uint8)
    ys, xs = np.nonzero(mask)
    bounds = [int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)]
    if int(mask.sum()) != expected_area or bounds != expected_bounds:
        raise ValueError(f"Selection component changed at {seed}: {int(mask.sum())}, {bounds}")
    geometry = load_trace_pixel_ink()(mask, 0.15)
    parts = list(geometry.geoms) if geometry.geom_type == "MultiPolygon" else [geometry]
    polygon = max(parts, key=lambda item: item.area)
    holes = [Polygon(ring) for ring in polygon.interiors if Polygon(ring).area >= 20]
    filtered = Polygon(polygon.exterior, [hole.exterior.coords for hole in holes])
    if not filtered.is_valid or filtered.area <= 0:
        raise ValueError(f"Invalid selection face at {seed}")
    return {
        "outer": ring_points(filtered.exterior),
        "holes": [ring_points(ring) for ring in filtered.interiors],
    }, mask, filtered


def write_selection_overlay(raw, selections, cuts, output):
    result = raw.copy()
    palette = [(225, 211, 108), (181, 220, 195), (193, 210, 235), (225, 190, 218)]
    for index, (_, _, geometry) in enumerate(selections):
        layer = np.zeros(raw.shape[:2], np.uint8)
        cv2.fillPoly(layer, [np.asarray(geometry.exterior.coords, np.int32)], 255)
        for hole in geometry.interiors:
            cv2.fillPoly(layer, [np.asarray(hole.coords, np.int32)], 0)
        tint = np.empty_like(raw)
        tint[:] = palette[index % len(palette)]
        selected = layer > 0
        result[selected] = (result[selected] * 0.68 + tint[selected] * 0.32).astype(np.uint8)
    for cut in cuts:
        start, end = (tuple(point) for point in cut["segment"])
        cv2.line(result, start, end, (255, 0, 255), 2, cv2.LINE_8)
    cv2.imwrite(str(output), result)


def write_overlay(raw, geometry, output, colour):
    layer = np.zeros(raw.shape[:2], np.uint8)
    outer = np.asarray(geometry.exterior.coords, np.int32)
    cv2.fillPoly(layer, [outer], 255)
    for hole in geometry.interiors:
        cv2.fillPoly(layer, [np.asarray(hole.coords, np.int32)], 0)
    result = raw.copy()
    tint = np.empty_like(raw)
    tint[:] = colour
    selected = layer > 0
    result[selected] = (result[selected] * 0.55 + tint[selected] * 0.45).astype(np.uint8)
    cv2.imwrite(str(output), result)


def main():
    QA.mkdir(parents=True, exist_ok=True)
    if digest(RAW) != RAW_SHA256 or digest(REGISTERED) != REGISTERED_SHA256:
        raise ValueError("Pinned Cathedral source bytes changed")

    document = fitz.open(REGISTERED)
    try:
        embedded = document.extract_image(5)["image"]
        if embedded != RAW.read_bytes():
            raise ValueError("Registered PDF does not embed the official JPEG byte-for-byte")
        if tuple(document[0].rect) != (0.0, 0.0, 1920.0, 1357.0):
            raise ValueError("Registered page dimensions changed")
    finally:
        document.close()

    config = json.loads(CONFIG.read_text())
    floor = config["floors"][0]
    raster = floor["rasterLayers"][0]
    raw = cv2.imread(str(RAW))
    rgb = cv2.cvtColor(raw, cv2.COLOR_BGR2RGB)
    ink = (
        (rgb.max(axis=2) <= raster["maxChannel"])
        & ((rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)) <= raster["maxChroma"])
    ).astype(np.uint8)
    for exclusion in raster["excludeRects"]:
        x0, y0, x1, y1 = (round(value) for value in exclusion["rect"])
        ink[y0:y1, x0:x1] = 0
    free = (1 - ink).astype(np.uint8)
    _, labels, _, _ = cv2.connectedComponentsWithStats(free, 8)

    nave_ring, nave_mask, nave_geometry = source_face(
        labels,
        (650, 900),
        406469,
        [396, 54, 1031, 1218],
        [(559, 178, 755, 467), (559, 576, 755, 867)],
    )
    cloister_ring, cloister_mask, cloister_geometry = source_face(
        labels,
        (1000, 800),
        143757,
        [913, 512, 1472, 1227],
        [(1039, 577, 1345, 983)],
    )
    cv2.imwrite(str(QA / "barcelona-cathedral-nave-source-face-mask.png"), nave_mask * 255)
    cv2.imwrite(str(QA / "barcelona-cathedral-cloister-source-face-mask.png"), cloister_mask * 255)
    write_overlay(raw, nave_geometry, QA / "barcelona-cathedral-nave-source-face-overlay.png", (210, 120, 60))
    write_overlay(raw, cloister_geometry, QA / "barcelona-cathedral-cloister-source-face-overlay.png", (70, 140, 220))

    labels_seen = [int(place["label"]) for place in floor["servicePlaces"]]
    if labels_seen != MARKERS or len(labels_seen) != 59:
        raise ValueError(f"Official marker inventory changed: {labels_seen}")
    for place in floor["servicePlaces"]:
        place["displayLabel"] = place["label"]

    marker_places = {int(place["label"]): place for place in floor["servicePlaces"]}
    cuts = selection_cuts(marker_places)
    selection_free = free.copy()
    for cut in cuts:
        start, end = (tuple(point) for point in cut["segment"])
        cv2.line(selection_free, start, end, 0, 3, cv2.LINE_8)
    _, selection_labels, _, _ = cv2.connectedComponentsWithStats(selection_free, 8)

    expected_marker_groups = {number: group for group in SELECTION_COMPONENTS for number in group}
    expected_marker_groups[26] = (26,)
    actual_marker_groups = {}
    for number, place in marker_places.items():
        x, y = (round(value) for value in place["at"])
        component = int(selection_labels[y, x])
        actual_marker_groups.setdefault(component, []).append(number)
    for component, numbers in actual_marker_groups.items():
        group = tuple(numbers)
        for number in numbers:
            if expected_marker_groups[number] != group:
                raise ValueError(f"Unexpected selection grouping for marker {number}: {group}")

    selection_spaces = []
    selection_geometries = []
    for group, (expected_area, expected_bounds) in SELECTION_COMPONENTS.items():
        place = marker_places[group[0]]
        seed = tuple(round(value) for value in place["at"])
        ring, mask, geometry = selection_face(
            selection_labels, seed, expected_area, expected_bounds
        )
        cv2.imwrite(
            str(QA / f"barcelona-cathedral-selection-{'-'.join(map(str, group))}-mask.png"),
            mask * 255,
        )
        joined = "-".join(map(str, group))
        display = " / ".join(map(str, group))
        selection_spaces.append({
            "id": f"number-{joined}-selection",
            "label": display,
            "placeId": f"main-level-{group[0]}-1",
            "polygons": [ring],
            "sourcePaths": [5],
            "scope": "collection" if group == (2, 13, 24) else "room",
            "selectionOnly": True,
            "evidence": (
                "Selection-only source free-space component bounded by retained official-plan ink and the reviewed virtual-cut set. "
                "Virtual cuts close only source wall bands or visible thresholds for hit testing; they add no wall, opening, route or navigation claim."
            ),
        })
        selection_geometries.append((group, mask, geometry))

    write_selection_overlay(
        raw,
        selection_geometries,
        [],
        QA / "barcelona-cathedral-selection-spaces-overlay.png",
    )
    write_selection_overlay(
        raw,
        selection_geometries,
        cuts,
        QA / "barcelona-cathedral-selection-cuts-overlay.png",
    )

    config["file"] = RAW.name
    config["sha256"] = RAW_SHA256
    config["sourceProjection"] = {
        "kind": "orthographic",
        "pages": [],
        "basis": "The Cathedral's pinned 1920 by 1357 official JPEG is the unwarped orthographic parent image; the floor uses its byte-identical lossless PDF registration copy.",
    }
    config["sourceFiles"] = [{
        "id": "registered-pdf",
        "file": REGISTERED.name,
        "url": config["url"],
        "sha256": REGISTERED_SHA256,
        "sourceProjection": {
            "kind": "orthographic",
            "pages": [1],
            "basis": "Lossless registration wrapper with a 1920 by 1357 page; image xref 5 is asserted byte-for-byte identical to the pinned official JPEG and has an identity pixel-to-page transform.",
        },
    }]
    config["review"] = (
        "Official Cathedral JPEG raw bytes are pinned as the primary source. The registered PDF embeds those exact bytes at identity scale. "
        "All neutral ink through RGB 250 with chroma <= 16 is retained and the red callouts are rejected. The nave/apse/chapel and cloister faces are reproducibly traced from two locked white connected components of the masked source; the choir, presbytery and courtyard remain source-defined holes. Only source holes of at least 20 pixels are serialized to omit isolated one-pixel raster noise."
        " Number selection faces are derived separately from that same free-space raster after a reviewed set of virtual threshold closures. Those cuts are hit-testing boundaries only and never enter features, walls, openings or navigation."
    )
    config["limitations"] = [
        "本图仅覆盖主教座堂主层与回廊；圣欧拉利娅地下墓室及屋顶没有绘出。",
        "官方原图可见编号共 59 个：1–11、13–26、28–39、60–81；原图没有 12 与 27，故不补造。地图只显示编号，名称保留在详情中。",
        "红色编号遮挡下的局部线条无法恢复；面域只沿仍可见的来源边界提取，不据此承诺当前开放状态。",
        "编号选择面以原墙线为边界，并只在经审阅的门槛或墙带上作点击分区切口；这些切口不表示新增墙体、门洞、通行关系或导航路线。2、13、24 位于同一公共中殿与后殿环廊面，71 与 72 位于同一来源相连礼拜堂面；26 位于室外，故不生成室内选择面。",
    ]
    config["unresolved"] = [
        "Crypt and roof orthographic geometry",
        "Structural linework hidden beneath the official red marker circles",
        "Dedicated chapel names for official markers whose interactive-map popup has no associated saint or devotion",
        "Artwork-level wall positions within each numbered chapel",
        "A separate indoor selection face for exterior marker 26",
    ]
    floor["sourceId"] = "registered-pdf"
    floor["selectionCuts"] = cuts
    floor["selectionSpaces"] = selection_spaces
    floor["spaces"] = [
        {
            "id": "nave-apse-chapels-floor",
            "label": "中殿、交叉部、后殿与礼拜堂步行面",
            "placeId": "main-level-中殿与侧礼拜堂-1",
            "tone": "neutral",
            "polygons": [nave_ring],
            "sourcePaths": [5],
            "scope": "floor",
            "evidence": "Exact free-space component bounded by neutral architectural ink in the registered official raster, including the nave, crossing, apse ambulatory and side-chapel recesses; the choir and presbytery are source-defined exclusions.",
        },
        {
            "id": "cloister-connected-floor",
            "label": "回廊及来源相连步行面",
            "placeId": "main-level-哥特式回廊-1",
            "tone": "neutral",
            "polygons": [cloister_ring],
            "sourcePaths": [5],
            "scope": "floor",
            "evidence": "Exact free-space component bounded by neutral architectural ink in the registered official raster; the inner courtyard is a source-defined exclusion rather than an approximate rectangular hole.",
        },
    ]
    CONFIG.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
    print(CONFIG)


if __name__ == "__main__":
    main()
