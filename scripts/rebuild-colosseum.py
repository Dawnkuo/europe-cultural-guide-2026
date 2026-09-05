#!/usr/bin/env python3
"""Build the DAI source-derived Colosseum Level 2 and Level 3 model."""
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
PLATE = SOURCE / "research/colosseum-dai-podium-plan-2022.pdf"
SEMANTIC = SOURCE / "colosseum-dai-reviewed-levels.pdf"
CONFIG = SOURCE / "venues/colosseum.json"
MODEL = ROOT / "app/data/architectural-plans/colosseum.json"
PRODUCER = ROOT / "scripts/make_colosseum_dai_levels.py"
BUILDER = ROOT / "scripts/build-architectural-plans.py"
ARTICLE_URL = "https://publications.dainst.org/journals/rm/article/view/4033"
PLATE_URL = "https://publications.dainst.org/journals/rm/article/view/4033/7838"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def image_xref(page_number: int) -> int:
    document = fitz.open(SEMANTIC)
    images = document[page_number - 1].get_images(full=True)
    document.close()
    if len(images) != 1:
        raise ValueError(f"Expected one semantic image on page {page_number}")
    return images[0][0]


def layer(xref: int, value: int, detail: bool, reason: str) -> dict:
    return {
        "xref": xref,
        "reason": reason,
        "rgbRange": [[value, value, value], [value, value, value]],
        "allInkIsDetail": detail,
        "tolerancePixels": 0,
        "minAreaPixels": 0.1,
        "excludeRects": [],
    }


def config() -> dict:
    hypogeum_xref = image_xref(1)
    podium_xref = image_xref(2)
    hypogeum_places = [
        {"label": "H 中央", "at": [1284, 510], "name": "地下层中央走廊系统", "kind": "area", "evidence": "DAI 附图灰色 Theme IPOGEI Livello 2 的中央轴线与走廊交汇区。", "precision": "source-theme-plan-anchor"},
        {"label": "H 西", "at": [675, 510], "name": "地下层西侧廊道", "kind": "area", "evidence": "DAI 附图灰色地下层主题西半部廊道。", "precision": "source-theme-plan-anchor"},
        {"label": "H 东", "at": [1880, 510], "name": "地下层东侧廊道", "kind": "area", "evidence": "DAI 附图灰色地下层主题东半部廊道。", "precision": "source-theme-plan-anchor"},
        {"label": "H 北", "at": [1284, 245], "name": "地下层北侧短轴区", "kind": "area", "evidence": "DAI 附图灰色地下层主题北侧短轴区域；不等同于现代参观入口。", "precision": "source-theme-plan-anchor"},
        {"label": "H 南", "at": [1284, 775], "name": "地下层南侧短轴区", "kind": "area", "evidence": "DAI 附图灰色地下层主题南侧短轴区域。", "precision": "source-theme-plan-anchor"},
    ]
    podium_places = [
        {"label": "竞技场", "at": [1284, 510], "name": "竞技场面轴心", "kind": "area", "evidence": "DAI 附图品红色 podium 内缘围合的竞技场轴心；锚点表示上覆竞技场面，不把地下走廊复制为本层。", "precision": "source-theme-enclosed-axis"},
        {"label": "P 北", "at": [1284, 225], "name": "北侧 podium", "kind": "area", "evidence": "DAI 附图 Theme PODIO Livello 3 的北侧短轴段。", "precision": "source-theme-plan-anchor"},
        {"label": "P 南", "at": [1284, 795], "name": "南侧 podium", "kind": "area", "evidence": "DAI 附图 Theme PODIO Livello 3 的南侧短轴段。", "precision": "source-theme-plan-anchor"},
        {"label": "P 西", "at": [575, 510], "name": "西侧 podium", "kind": "area", "evidence": "DAI 附图 Theme PODIO Livello 3 的西侧长轴段。", "precision": "source-theme-plan-anchor"},
        {"label": "P 东", "at": [1995, 510], "name": "东侧 podium", "kind": "area", "evidence": "DAI 附图 Theme PODIO Livello 3 的东侧长轴段。", "precision": "source-theme-plan-anchor"},
    ]
    bindings = [
        {"stopIndex": 2, "placeId": "hypogeum-level-2-H-中央-1"},
        {"stopIndex": 4, "placeId": "podium-level-3-竞技场-1"},
    ]
    unresolved = [
        {"stopIndex": 0, "reason": "DAI 分层图版研究地下层与 podium，不标示外立面编号拱门。"},
        {"stopIndex": 1, "reason": "考古图版不记录现代实名票安检与当日入口位置。"},
        {"stopIndex": 3, "reason": "图版包含大量地下构造，但未为本导览所述具体升降井与活门提供可唯一绑定的现状标识。"},
        {"stopIndex": 5, "reason": "图版的 Level 3 主题是 podium，不是完整分层观众席平面，故不把 podium 外环误标为观众席主题点。"},
    ]
    if {item["stopIndex"] for item in bindings} & {item["stopIndex"] for item in unresolved}:
        raise ValueError("Bound and unresolved Colosseum stops overlap")
    common_layers = lambda xref, theme: [
        layer(xref, 0, False, f"DAI {theme} 主题来源像素中的厚线／密实体；墙体像素与来源主题相交。"),
        layer(xref, 128, True, f"DAI {theme} 主题来源像素中的细线、轮廓与考古注记线；仅作平面细节。"),
    ]
    return {
        "slug": "colosseum",
        "file": str(PLATE.relative_to(SOURCE)),
        "sha256": digest(PLATE),
        "url": PLATE_URL,
        "sourceProjection": {
            "kind": "orthographic",
            "pages": [],
            "basis": "DAI 1:100 考古附图为正投影平面，分成左右两页；两页经 15 个来源控制点作等比例仿射拼接。原始图版仅作出处与校准证据，楼层提取读取 supplementary reviewed-levels 来源。",
        },
        "sourceFiles": [{
            "id": "reviewed-levels",
            "file": SEMANTIC.name,
            "sha256": digest(SEMANTIC),
            "url": PLATE_URL,
            "sourceProjection": {
                "kind": "orthographic",
                "pages": [1, 2],
                "basis": (
                    "同一张 DAI 1:100 图版按图例颜色拆分：灰色 Theme IPOGEI Ebene/Livello 2 为地下层，"
                    "品红 Theme PODIO Ebene/Livello 3 为 podium。右页到左页坐标的 15 点配准 RMS 0.150 像素、"
                    "最大 0.449 像素。语义图每像素为 4x4 来源主题像素并集，墙优先于平面细节。"
                ),
            },
        }],
        "review": (
            "Heinz-Jürgen Beste 与 Rossella Rea 在德国考古研究院《Römische Mitteilungen》128 (2022) 的"
            "附图明确把同一正投影 1:100 平面分为灰色地下层 Level 2 与品红 podium Level 3。左右页使用 15 个"
            "人工审阅的同名建筑交点配准，RMS 0.150 像素，最大残差 0.449 像素。标题、图例和角落定位图在"
            "来源坐标中排除。3x3 形态学只选择连通主题与厚线核心；输出墙和细节均与原始主题像素相交，"
            "没有生成椭圆、通用环带或复制官方路线底图。两层共享同一图版配准，但表示不同的来源主题。"
        ),
        "limitations": [
            "学术考古图版，不是现行游客路线图或测绘级运营平面。",
            "论文题名明确包含重建提案；本模型保留图版的来源主题，不把重建内容宣称为现场现状。",
            "地下层与 podium 来自同一正投影图版的两个图例主题，不是两张不同路线叠色图。",
            "4x4 来源像素并集用于控制模型尺寸；墙体只由来源主题密实体生成，细线与考古轮廓保持平面。",
            "未定位现代安检入口、具体升降井／活门和完整观众席；这些导览点保留为未解决。",
            "不表示临时关闭、当日单向路线或无障碍权限。",
        ],
        "floors": [
            {
                "id": "hypogeum-level-2",
                "label": "地下层（DAI Level 2）",
                "order": -1,
                "sourceId": "reviewed-levels",
                "page": 1,
                "crop": [0, 0, 2569, 1020],
                "rules": [],
                "places": hypogeum_places,
                "rasterLayers": common_layers(hypogeum_xref, "地下层 Level 2"),
            },
            {
                "id": "podium-level-3",
                "label": "Podium（DAI Level 3）",
                "order": 0,
                "sourceId": "reviewed-levels",
                "page": 2,
                "crop": [0, 0, 2569, 1020],
                "rules": [],
                "places": podium_places,
                "rasterLayers": common_layers(podium_xref, "podium Level 3"),
            },
        ],
        "stopBindings": bindings,
        "unresolvedStops": unresolved,
        "verticalLinks": [],
        "researchArticle": ARTICLE_URL,
    }


def main() -> None:
    subprocess.run([sys.executable, str(PRODUCER)], check=True)
    value = config()
    save_json(CONFIG, value)
    spec = importlib.util.spec_from_file_location("architectural_builder", BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    module.build(value)
    model = json.loads(MODEL.read_text())
    if "unresolvedStops" in model:
        raise ValueError("Canonical model unexpectedly serialized unresolvedStops")
    if [floor["id"] for floor in model["floors"]] != ["hypogeum-level-2", "podium-level-3"]:
        raise ValueError("Serialized Colosseum floor inventory changed")
    if len(model["places"]) != 10 or len(model["stopBindings"]) != 2:
        raise ValueError("Serialized Colosseum place or binding count changed")
    print(CONFIG)
    print(MODEL)


if __name__ == "__main__":
    main()
