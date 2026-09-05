"""Reconstruct KKAA's published 2021 plan set, not three historic excerpts.

Coordinates below refer to the visually reviewed 1200px-wide publication plates.
Every source image is embedded with equal x/y scale; no perspective correction
or geometric registration is needed or claimed. Source captions, not a guessed
repeated-floor template, explicitly assign one drawing to first-through-third.
"""
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image
from shapely.affinity import scale
from shapely.geometry import Point, Polygon

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "sources/floorplans/casa-batllo-kkaa"
PDF = FOLDER / "published-plans.pdf"
CONFIG = ROOT / "sources/floorplans/venues/casa-batllo.json"
URL = "https://www.archdaily.com/967908/new-interior-for-casa-batllo-stairs-and-atrium-kengo-kuma-and-associates"
FILES = {
    "plans-lower.jpg": "5d2cd04981344896706e2ed80eb9921952a4cfec4a0fd72088eec4720d9417f8",
    "plans-upper.jpg": "f44d665bf26b303221a05dd484a33a79bb85e68e20e48d9ae2dc02688e3db774",
    "section.jpg": "ef53960628000592cae4cfcc7bf0d191fca3e2e7274279ec572f726ce3ae24c8",
}


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def place(label, x, y, kind="area", name=None):
    return {"label": label, "at": [x, y], "kind": kind, "name": name or label,
            "evidence": "Reviewed named architectural area at the corresponding boundary, stair or facade feature of the 2021 KKAA plan; descriptive label, not a printed room number."}


def place_id(floor, label):
    return f"{floor}-{label.replace(' ', '-')}-1"


# Whole-plan crops exclude only captions/scale bars and adjacent drawings.
FLOORS = [
    ("basement", "地下层 · 沉浸空间", -1, 1, [105, 32, 1085, 309], [
        place("后部方形展厅", 289, 179), place("地下中庭", 460, 180),
        place("前部圆形展厅", 954, 180), place("下行楼梯", 643, 67, "service"),
        place("电梯", 598, 62, "service"), place("卫生间", 747, 251, "service"),
    ]),
    ("ground", "底层 · 入口与门厅", 0, 1, [103, 361, 1086, 656], [
        place("街道入口", 1041, 465), place("公共门厅", 826, 450),
        place("私人门厅", 817, 613), place("后部大厅", 287, 516),
        place("下行楼梯", 698, 412, "service"), place("电梯", 598, 405, "service"),
    ]),
    ("noble", "主层 · 主厅与后院", 1, 1, [102, 689, 1092, 1004], [
        place("临街主厅", 1004, 850, "room"), place("书房", 903, 894, "room"),
        place("餐厅", 486, 851, "room"), place("后院", 284, 851),
        place("采光井", 667, 853), place("下行楼梯", 688, 761, "service"),
        place("电梯", 598, 750, "service"),
    ]),
    *[(f"upper-{n}", f"上部{cn}层 · {en}", n + 1, 2, [18, 195, 590, 421], [
        place("后部空间", 112, 299), place("临街空间", 484, 305),
        place("采光井", 295, 312), place("下行楼梯", 236, 232, "service"),
        place("电梯", 183, 221, "service"),
    ]) for n, cn, en in [(1, "一", "First"), (2, "二", "Second"), (3, "三", "Third")]],
    ("upper-4", "上部四层 · Fourth", 5, 2, [21, 564, 589, 804], [
        place("后部空间", 109, 635), place("临街空间", 521, 630),
        place("采光井", 300, 690), place("下行楼梯", 229, 610, "service"),
        place("电梯", 187, 597, "service"),
    ]),
    ("attic", "阁楼 · 悬链拱", 6, 2, [611, 195, 1176, 420], [
        place("悬链拱廊", 1099, 295), place("阁楼北廊", 911, 260),
        place("后部服务空间", 691, 300), place("下行楼梯", 819, 230, "service"),
        place("电梯", 776, 217, "service"), place("西侧旋梯", 751, 307, "service"),
        place("东侧旋梯", 1037, 307, "service"),
    ]),
    ("rooftop", "屋顶 · 龙脊与天窗", 7, 2, [611, 547, 1176, 803], [
        place("龙脊屋面", 1097, 681, "object"), place("屋顶露台", 942, 753),
        place("中央天窗", 895, 688, "object"), place("电梯", 777, 598, "service"),
        place("西侧旋梯", 749, 694, "service"), place("东侧旋梯", 1037, 694, "service"),
    ]),
]


def closed_faces(image_path, crop, places, floor_id, xref, trace):
    """Only source-closed white faces; never close a door or roof edge by guess."""
    rgb = np.array(Image.open(image_path).convert("RGB"))
    factor = rgb.shape[1] / 1200
    ink = (rgb.min(axis=2) < 225).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(1 - ink, 8)
    picked = set()
    spaces = []
    for p in places:
        if p["kind"] in ("service", "object") or p["label"] == "采光井":
            continue
        x, y = [round(c * factor) for c in p["at"]]
        label = int(labels[y, x])
        if label == 0 or label in picked or label >= count:
            continue
        px, py, w, h, area = stats[label]
        if area < 500 or not (crop[0]*factor <= px and crop[1]*factor <= py and px+w <= crop[2]*factor and py+h <= crop[3]*factor):
            continue
        geometry = trace((labels == label).astype(np.uint8), .15)
        parts = [geometry] if geometry.geom_type == "Polygon" else list(geometry.geoms)
        polygon = max(parts, key=lambda g: g.area)
        polygon = Polygon(polygon.exterior, [h.coords for h in polygon.interiors if Polygon(h).area >= 5])
        polygon = scale(polygon, xfact=1/factor, yfact=1/factor, origin=(0, 0))
        if not polygon.is_valid or not polygon.contains(Point(p["at"])):
            continue
        picked.add(label)
        spaces.append({"id": f"face-{label}", "label": p["label"], "placeId": place_id(floor_id, p["label"]),
                       "polygons": [{"outer": list(polygon.exterior.coords), "holes": [list(h.coords) for h in polygon.interiors]}],
                       "sourcePaths": [xref], "tone": "neutral", "scope": "collection",
                       "evidence": f"Native closed white connected component {label}, seed {x},{y}, {int(area)} pixels, of pinned KKAA raster. Doors are not sealed and unclosed faces are not filled. Sub-5px JPEG holes are nonstructural specks."})
    return spaces


def main():
    for name, expected in FILES.items():
        if hashlib.sha256((FOLDER / name).read_bytes()).hexdigest() != expected:
            raise ValueError(f"Changed source: {name}")
    doc = fitz.open()
    xrefs = []
    for name in ("plans-lower.jpg", "plans-upper.jpg"):
        image = Image.open(FOLDER / name)
        page = doc.new_page(width=1200, height=image.height * 1200/image.width)
        xrefs.append(page.insert_image(page.rect, filename=str(FOLDER / name)))
    doc.save(PDF, garbage=4, deflate=True, no_new_id=True)
    doc.close()
    # Reopen: garbage collection can renumber the image objects.
    doc = fitz.open(PDF)
    xrefs = [p.get_images()[0][0] for p in doc]
    doc.close()
    spec = importlib.util.spec_from_file_location("plan_builder", ROOT / "scripts/build-architectural-plans.py")
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)
    config = {
        "slug": "casa-batllo", "file": "casa-batllo-kkaa/published-plans.pdf", "url": URL,
        "sha256": hashlib.sha256(PDF.read_bytes()).hexdigest(),
        "sourceProjection": {"kind": "orthographic", "pages": [1, 2], "basis": "Visually checked both KKAA plan plates against the longitudinal section. These are true overhead plans, not the separately published section or diagrams. Equal x/y scaling embeds native 2000px images on 1200pt pages."},
        "review": "KKAA's 2021 Stairs & Atrium publication, supplied by the architects to ArchDaily, depicts the whole building as context of the intervention. Seven distinct plan drawings represent nine physical levels including roof; FIRST FLOOR - THIRD FLOOR explicitly applies the same published drawing to three levels. This does not establish their 2026 private-room or exhibition partition layout. Bold neutral cut walls are structural; fine ceiling, furniture, glazing, stair tread and finish lines stay flat. Blue chain-curtain treatment is not masonry. Crops exclude titles only. Closed white faces are source-derived with no invented closure. Former three-floor historical model is superseded, not mixed into this plan set.",
        "limitations": [
            "九个平面层级包括地下层、底层、主层、上部一至四层、阁楼和屋顶；上部楼层沿用图纸的 First / Second / Third / Fourth 称谓，不等同于现场中文楼层编号。",
            "建筑结构依据 2021 年改造平面。上部一至三层在该图中共用一张平面，不代表各层如今的展陈或私人房间完全相同。所有楼层画出不代表门票可进入所有房间。",
            "Gaudí Cube、Gaudí Dôme 及 2026 年私人住宅、临展的精确展项位置尚未逐项核定；地下展厅保留建筑轮廓，不冒用这些展项名称。",
            "屋顶结构保留龙脊屋面、中央天窗和旋梯；图纸未单独标明的烟囱组不补画坐标。墙高、层间距与各层中心对齐仅用于展示。",
        ],
        "unresolved": ["2026 visitor room assignments and temporary exhibition partitions", "Exact Gaudi Cube/Dome names matched to basement rooms", "Individually labelled chimney groups"],
        "research": [
            {"url": URL, "status": "used", "finding": "Architect-supplied 2021 plans and section; lower and upper plan plates independently reviewed."},
            {"url": "https://kkaa.co.jp/en/project/casa-batllo-stairs-atrium/", "status": "used", "finding": "Architect's own project page states 7F/1BF and the eight-storey stair/light-well intervention. Rooftop is an additional plan, not an extra enclosed storey."},
            {"url": "https://www.casabatllo.es/en/experience-3/", "status": "semantic-only", "finding": "Official visit includes noble floor, attic, stairs/atrium, rooftop and immersive experiences; no current plan links every named experience to a room."},
        ],
        "floors": [], "verticalLinks": [], "stopBindings": [], "display": {"floorGap": 3.5},
        "unlocatedPlaces": [{"id": "current-experiences", "label": "当期展项", "name": "私人住宅 / Gaudí Cube / Gaudí Dôme / 临展", "reason": "展项与图中具体房间的对应尚未核定，按现场分流参观。", "sourcePage": 1, "evidence": "Official current visit confirms the programs but the KKAA plan labels only building levels, not these programs."}],
    }
    for id_, label, order, page, crop, places in FLOORS:
        xref = xrefs[page-1]
        config["floors"].append({"id": id_, "label": label, "order": order, "page": page, "crop": crop,
            "expectedLabels": [p["label"] for p in places], "places": places, "rules": [],
            "rasterLayers": [
                {"xref": xref, "maxChannel": 105, "maxChroma": 22, "wallKernel": 3, "includeKinds": ["wall"], "tolerancePixels": .15,
                 "reason": "Visually reviewed bold neutral black cut masonry in the architect's plan. A source-only 3px opening rejects thin stair/finish/ceiling strokes; chain-curtain blue is excluded by chroma. Source/wall/detail contact must be inspected before release."},
                {"xref": xref, "maxChannel": 235, "maxChroma": 22, "allInkIsDetail": True, "includeKinds": ["detail"], "tolerancePixels": .15,
                 "reason": "Retain every neutral fine architectural plan stroke as flat detail, including roof contour, catenary rib projection, glazing, openings, stair treads and furniture. No annotation outside the crop is included."},
            ], "spaces": closed_faces(FOLDER / ("plans-lower.jpg" if page == 1 else "plans-upper.jpg"), crop, places, id_, xref, builder.trace_pixel_ink)})
    bindings = [(0,"ground","街道入口"),(1,"noble","临街主厅"),(1,"noble","书房"),(2,"noble","餐厅"),(2,"noble","后院"),(2,"noble","采光井"),(3,"attic","悬链拱廊"),(3,"attic","阁楼北廊"),(4,"rooftop","龙脊屋面"),(4,"rooftop","屋顶露台")]
    config["stopBindings"] = [{"stopIndex": index, "placeId": place_id(floor, label)} for index, floor, label in bindings]
    stairs = [f[0] for f in FLOORS if f[0] != "rooftop"]
    for a,b in zip(stairs,stairs[1:]):
        config["verticalLinks"].append({"id":f"stairs-{a}-{b}", "label":"隈研吾下行楼梯", "kind":"stairs", "fromPlaceId":place_id(a,"下行楼梯"), "toPlaceId":place_id(b,"下行楼梯"),
            "evidence":"Matching blue-highlighted existing stair core in each KKAA floor plan and the architect's longitudinal section shows the continuous connection. Topological link, no surveyed shaft alignment or route entitlement."})
    for label in ("西侧旋梯", "东侧旋梯"):
        config["verticalLinks"].append({"id":f"attic-roof-{label}", "label":label, "kind":"stairs", "fromPlaceId":place_id("attic",label), "toPlaceId":place_id("rooftop",label),
            "evidence":"Same spiral-stair symbols on the attic and rooftop plans, immediately west/east of the central rooflight, with matching plan locations and footprints."})
    write_json(CONFIG, config)
    write_json(FOLDER / "source-manifest.json", {"publisher": "Kengo Kuma & Associates, reproduced by ArchDaily", "projectYear": 2021, "reviewedAt":"2026-09-05", "page":URL, "files":FILES, "geometryScope":"nine plan levels including roof; not a nine-storey claim", "roofAndAtticValidated":True, "projection":"orthographic", "floorInventory":[{"id":f[0],"sourceCaption":f[1],"order":f[2],"page":f[3],"crop":f[4]} for f in FLOORS]})
    builder.build(config)


if __name__ == "__main__":
    main()
