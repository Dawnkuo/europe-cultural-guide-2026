#!/usr/bin/env python3
"""Rebuild the independently reviewed Vatican Museums map package."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans"
CONFIG_PATH = SOURCE / "venues/vatican-museums.json"
URL = (
    "https://www.museivaticani.va/content/dam/museivaticani/pdf/visita_musei/"
    "servizi_visitatori/mappa_musei_vaticani.pdf"
)
CROPS = {
    "first": [20, 90, 825, 555],
    "second": [25, 40, 570, 285],
    "basement": [15, 330, 342, 570],
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run_script(name: str) -> None:
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / name)],
        cwd=ROOT,
        check=True,
    )


def image_xref(path: Path, page_number: int) -> int:
    document = fitz.open(path)
    images = document[page_number - 1].get_images(full=True)
    if len(images) != 1:
        raise ValueError(f"{path.name} page {page_number}: expected one registered image")
    xref = images[0][0]
    document.close()
    return xref


def raster_layers(xref: int, floor_label: str, retain_flat_detail: bool) -> list[dict]:
    wall = {
        "xref": xref,
        "reason": (
            f"Official {floor_label} neutral structural source pixels at max RGB 220. "
            "Pale neutral shadow/antialias pixels 221..245, route markers, photos, "
            "legends, and generated walls are absent."
        ),
        "allInkIsDetail": False,
        "tolerancePixels": 0,
        "minAreaPixels": 0.1,
        "occurrence": 0,
        "excludeRects": [],
        "rgbRange": [[0, 0, 0], [0, 0, 0]],
    }
    layers = [wall]
    if retain_flat_detail:
        layers.append({
            "xref": xref,
            "reason": (
                f"Official {floor_label} garden context and reviewed stair-interior "
                "linework retained as flat detail; no gray pixel is classified as wall."
            ),
            "allInkIsDetail": True,
            "tolerancePixels": 0,
            "minAreaPixels": 0.1,
            "occurrence": 0,
            "excludeRects": [],
            "rgbRange": [[128, 128, 128], [128, 128, 128]],
        })
    return layers


def service_places(inventory: dict, floor_id: str) -> list[dict]:
    places = []
    for record in inventory["services"]:
        if record["floorId"] != floor_id:
            continue
        places.append({
            "label": record["label"],
            "at": record["center"],
            "name": record["name"],
            "kind": "service",
            "evidence": (
                f"官方 PDF 第 {record['page']} 页可见服务图标 drawing "
                f"{record['drawingIndex']} 的彩色矢量圆外框精确中心；类别按同页官方英文服务图例核对。"
                "已排除图例样例与裁切表单的重复对象。"
            ),
            "precision": "pdf-vector-service-circle-center",
        })
    return places


def load_builder():
    path = ROOT / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_builder", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load shared architectural plan builder")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def main() -> None:
    run_script("register_vatican_plan_objects.py")
    run_script("make_vatican_semantic_plan.py")
    run_script("extract-vatican-leaders.py")
    run_script("extract-vatican-services.py")

    config = json.loads(CONFIG_PATH.read_text())
    spaces = json.loads((SOURCE / "vatican-museums-source-spaces.json").read_text())
    services = json.loads((SOURCE / "vatican-museums-service-inventory.json").read_text())
    if services["counts"] != {"first": 46, "second": 7, "basement": 6}:
        raise ValueError("Reviewed Vatican service count changed")

    semantic_path = SOURCE / "vatican-museums-semantic-plans.pdf"
    semantic_xrefs = {
        floor_id: image_xref(semantic_path, page)
        for floor_id, page in {"first": 1, "second": 2, "basement": 3}.items()
    }
    source_files = {item["id"]: item for item in config["sourceFiles"]}
    semantic = source_files["semantic-plans"]
    semantic["sha256"] = digest(semantic_path)
    semantic["sourceProjection"]["basis"] = (
        "One independently registered source object per page. Neutral source pixels with "
        "maximum RGB 220 form the structural wall channel; reviewed native-image threshold "
        "comparisons classify pale neutral 221..245 shadows and antialias halos as omitted "
        "context. Four reviewed first-floor stair interiors and retained garden context are "
        "flat detail. No semantic pixel is synthesized."
    )

    floors = {floor["id"]: floor for floor in config["floors"]}
    if not any(place["label"] == "图书馆室内" for place in floors["first"]["places"]):
        floors["first"]["places"].append({
            "label": "图书馆室内",
            "displayLabel": "15",
            "at": [403.0, 220.0],
            "name": "梵蒂冈图书馆博物馆室内",
            "kind": "room",
            "evidence": (
                "官方平面 15 引线端点邻接的纵向封闭展区内审阅种子点；"
                "仅用于可选地面绑定，原 15 黑色圆点仍独立保留。"
            ),
            "precision": "reviewed-source-interior-seed",
        })
    for floor_id, floor in floors.items():
        floor["crop"] = CROPS[floor_id]
        floor["spaces"] = spaces[floor_id]
        floor["servicePlaces"] = service_places(services, floor_id)
        floor["rasterLayers"] = raster_layers(
            semantic_xrefs[floor_id],
            {"first": "first-floor", "second": "second-floor", "basement": "basement"}[floor_id],
            floor_id in {"first", "basement"},
        )

    config["review"] = (
        "Official Vatican Museums map pages, embedded plan objects, vector leader endpoints, "
        "and visible service icons were independently reviewed. Registration preserves each "
        "embedded plan object's official placement centre, 90-degree clockwise orientation, "
        "and equal-axis scale. Structural walls use only continuous neutral source strokes at "
        "max RGB 220; 55,652 pale neutral shadow/antialias pixels at 221..245 across the three "
        "registered images are omitted, not promoted to walls. Four reviewed first-floor stair "
        "interiors remain flat detail with named perimeter-wall checkpoints. The expanded crops "
        "follow the official embedded image extents and retain four east-end first-floor services "
        "and two west-side basement accessible elevators cut by the prior crops. All 30 reviewed "
        "collection/orientation leader endpoints and all 59 visible in-plan service-icon circle "
        "centres are retained; legend samples and hidden duplicate form objects are excluded. "
        "Twenty-two selectable spaces are source-wall connected components around recorded seeds; "
        "the library and Sistine interior seeds remain distinct from their official leader dots. "
        "Temporary dilation closes display-scale door gaps for selection only; no closure pixel is "
        "serialized as wall and no selected face crosses source structural ink."
    )
    config["limitations"] = [
        "游客导览图，不是测绘图。",
        "馆藏编号标示展区；同一编号可有多个引线端点，并不等同于每一道房间边界。",
        "浅灰中性像素 221–245 为来源阴影或抗锯齿晕边，已省略；只有最大通道值不高于 220 的连续中性实线可成为墙。",
        "二层 6／7／8 位于连续长廊，来源没有对应分隔墙，故不拆成三个可选房间；三处官方端点均保留。",
        "一层 18 与二层首个 5 的引线端点不能唯一指向一个来源封闭面，故只保留精确端点与完整墙线，不补画房间。",
        "地下 20／21 在来源中连成同一展区，保留两个端点，但只生成一个共享可选面，不复制重叠地面。",
        "二层底图中的庭园仅作低层方位参照，已从二层输出几何移除。",
        "可选地面由来源结构线的临时膨胀障碍提取；膨胀像素不输出为墙，也不据此推断门禁或通行权限。",
        "一层四处楼梯仅把审阅掩膜内部的来源踏步线降为平面细节；外围墙仍按来源抬高。",
        "无障碍来源是拓扑路线图，未用于几何提取。",
    ]
    config["completenessAudit"] = {
        "collectionAndOrientationLeaderEndpoints": 30,
        "visibleServiceIcons": services["counts"],
        "selectableSpaces": {floor_id: len(spaces[floor_id]) for floor_id in spaces},
        "sourceSpaceExceptions": [
            {"floorId": "first", "label": "18", "reason": "引线端点不能唯一落入来源封闭面。"},
            {"floorId": "second", "label": "5（北段）", "reason": "引线端点落在结构线，不能唯一选取单一室内组件。"},
            {"floorId": "second", "label": "6／7／8", "reason": "来源绘为连续长廊，没有三个独立分隔墙。"},
            {"floorId": "basement", "label": "20／21", "reason": "来源连通，采用一个共享可选面。"},
        ],
    }
    CONFIG_PATH.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")

    builder = load_builder()
    builder.build(config)
    model = json.loads(
        (ROOT / "app/data/architectural-plans/vatican-museums.json").read_text()
    )
    if model.get("unresolvedStops"):
        raise ValueError("Serialized model must not contain unresolvedStops")
    if any(place["kind"] not in {"room", "service", "area", "object"} for place in model["places"]):
        raise ValueError("Serialized model contains an invalid place kind")
    print(CONFIG_PATH)


if __name__ == "__main__":
    main()
