#!/usr/bin/env python3
"""Build the source-derived St Peter config and model without post-processing."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import fitz
from st_peters_inventory import load_inventory


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans"
CONFIG_PATH = SOURCE / "venues/st-peters-basilica.json"
MODEL_PATH = ROOT / "app/data/architectural-plans/st-peters-basilica.json"
BUILDER = ROOT / "scripts/build-architectural-plans.py"
PRODUCER = ROOT / "scripts/make_st_peters_source_plans.py"
INVENTORY = SOURCE / "st-peters-number-inventory.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def image_xref(file_name: str, page: int) -> int:
    document = fitz.open(SOURCE / file_name)
    images = document[page - 1].get_images(full=True)
    document.close()
    if len(images) != 1:
        raise ValueError(f"Expected one semantic image on {file_name} page {page}")
    return images[0][0]


def raster_layer(xref: int, note: str, value: int, detail: bool) -> dict:
    return {
        "xref": xref,
        "reason": note,
        "sourceRect": [0, 0, 483, 479],
        "targetRect": [0, 0, 483, 479],
        "rgbRange": [[value, value, value], [value, value, value]],
        "tolerancePixels": 0,
        "excludeRects": [],
        "allInkIsDetail": detail,
        "minAreaPixels": 0.1,
    }


def floor_layers(xref: int, width: int, height: int, floor_id: str) -> list[dict]:
    wall = raster_layer(
        xref,
        (
            "来源语义图中的黑色墙体。大殿为原生灰填充墙面的局部密度分割，"
            "墓穴为厚线核心与原始来源墨迹的交集；不含印刷编号。"
        ),
        0,
        False,
    )
    detail = raster_layer(
        xref,
        "来源语义图中的灰色楼梯踏步与细轮廓，仅作平面细节，不抬高。",
        128,
        True,
    )
    for layer in (wall, detail):
        layer["sourceRect"] = [0, 0, width, height]
        layer["targetRect"] = [0, 0, width, height]
    return [wall, detail]


def build_config() -> dict:
    source = "st-peters-churches-of-rome-127.pdf"
    reviewed = "st-peters-reviewed-plans.pdf"
    inventory = load_inventory(SOURCE)
    source_spaces = json.loads((SOURCE / "st-peters-source-spaces.json").read_text())

    basilica_names = {
        "1": "门廊", "3": "菲拉雷特青铜门", "4": "圣门", "5": "中央中殿",
        "6": "《圣殇》礼拜堂", "23": "右耳堂", "35": "圣彼得宝座与后殿",
        "50": "圣朗基努斯像与墓穴入口", "51": "青铜坐姿圣彼得像",
        "52": "告解祭台、教宗祭坛与青铜华盖", "83": "穹顶电梯入口", "84": "正立面",
    }
    basilica_places = []
    for item in inventory["basilica"]:
        basilica_places.append({
            **item,
            "name": basilica_names.get(item["label"], item["label"]),
            "evidence": ("门或立面的已核对轴线区域锚点，不声称是印刷字形中心。" if item["precision"] == "reviewed-named-plan-zone" else (
                f"Churches of Rome PDF 第 15 页原生嵌入平面中的印刷编号 {item['label']}；"
                "锚点按来源字形中心逐号审阅。括号内名称只用于已另行核对的路线重点；"
                "其余编号不据图形猜测对象名称。"
            )),
            "precision": item["precision"],
        })

    grotto_places = []
    occurrences: dict[str, int] = {}
    for item in inventory["grottoes"]:
        occurrences[item["label"]] = occurrences.get(item["label"], 0) + 1
        grotto_places.append({
            **item,
            "evidence": (
                f"Churches of Rome PDF 第 63 页红色印刷编号 {item['label']} 的来源字形中心；"
                "名称与独立 StPeterBasilica.info 墓穴图例交叉核对。该图例包含历史墓位，"
                "不据此宣称可移动墓葬仍在当前陈列位置。"
            ),
            "precision": "source-red-glyph-center",
        })

    bindings = [
        {"stopIndex": 0, "placeId": "basilica-1-1"},
        {"stopIndex": 0, "placeId": "basilica-3-1"},
        {"stopIndex": 0, "placeId": "basilica-84-1"},
        {"stopIndex": 1, "placeId": "basilica-6-1"},
        {"stopIndex": 2, "placeId": "basilica-5-1"},
        {"stopIndex": 3, "placeId": "basilica-52-1"},
        {"stopIndex": 4, "placeId": "basilica-35-1"},
        {"stopIndex": 5, "placeId": "grottoes-5-1"},
        {"stopIndex": 5, "placeId": "grottoes-12-1"},
        {"stopIndex": 6, "placeId": "basilica-23-1"},
        {"stopIndex": 6, "placeId": "basilica-83-1"},
    ]
    unresolved = [
        {"stopIndex": 7, "reason": "来源只标示大殿层穹顶电梯入口，没有电梯终点与屋顶平台楼层平面。"},
        {"stopIndex": 8, "reason": "未找到穹顶内环的可验证正投影楼层平面。"},
        {"stopIndex": 9, "reason": "未找到灯笼顶部观景台的可验证正投影楼层平面。"},
    ]
    bound_stops = {item["stopIndex"] for item in bindings}
    unresolved_stops = {item["stopIndex"] for item in unresolved}
    if bound_stops & unresolved_stops:
        raise ValueError("Bound and unresolved stop indices overlap")

    basilica_xref = image_xref(reviewed, 1)
    grotto_xref = image_xref(reviewed, 2)
    return {
        "slug": "st-peters-basilica",
        "file": source,
        "sha256": digest(SOURCE / source),
        "url": "https://www.churches-of-rome.info/CoV_Info/127%20SPB/127-San%20Pietro%20in%20Vaticano.pdf",
        "sourceProjection": {
            "kind": "orthographic",
            "pages": [],
            "basis": "来源第 15、63 页经视觉核对为俯视平面；第 15 页 PDF 置入发生非等比缩放，故不直接提取页面几何。",
        },
        "sourceFiles": [{
            "id": "reviewed-plans",
            "file": reviewed,
            "sha256": digest(SOURCE / reviewed),
            "url": "https://www.churches-of-rome.info/CoV_Info/127%20SPB/127-San%20Pietro%20in%20Vaticano.pdf",
            "sourceProjection": {
                "kind": "orthographic",
                "pages": [1, 2],
                "basis": (
                    "来源第 15、63 页原生嵌入图像。大殿保留原生等轴比例，并按灰填充墙面边界合并印刷网点；"
                    "3x3 灰填充密度阈值0.4及相邻原生深色边线；每个墙体像素在 7x7 邻域内都有来源灰填充支持，边界容差 3 像素。墓穴墙体只取厚线核心与"
                    "来源中性色墨迹交集；细轮廓与五处审阅楼梯内部为灰色平面细节。"
                ),
            },
        }],
        "review": (
            "Churches of Rome 专业资料第 15 页大殿平面和第 63 页墓穴平面均按原生嵌入像素提取。"
            "大殿原图灰墙使用印刷网点，v3 以 3x3 局部灰填充密度0.4阈值恢复连续墙体面；仅补回相邻原生深色边线，"
            "所有输出墙体像素在 7x7 邻域中都有真实灰填充像素。15 个大殿、9 个墓穴"
            "墙体／开口检查点均通过。墓穴厚线为墙，细线与五处楼梯内部为平面细节，输出不含来源外像素。"
            "大殿图例1至84中，82缺乏可靠平面位置，独立列出；四处79全部保留；3与84为门及立面轴线锚点而非字形检测。其余编号逐号复核。墓穴编号 1–68 全部建立，来源中重复的 3 与 68 保留为"
            "两个实例，共 70 个墓穴位置。编号锚点有来源总叠图和逐号裁图。28个可选空间只在生成选区时"
            "临时闭合门洞，不输出闭合像素。1966 年 Millon 局部图只作比例旁证，不成为楼层。"
        ),
        "limitations": [
            "专业导览平面，不是测绘图；只保持来源原生像素比例。",
            "大殿灰色墙体为印刷网点；连续墙体面按来源灰填充局部密度分割，边界容差不超过 3 个原生像素，不生成通用轮廓。",
            "印刷编号由 HTML 标记呈现，不进入墙体或平面细节几何。",
            "墓穴图例包含历史墓位；保留原图编号与历史名称，不据此宣称迁移后的墓葬仍在当前陈列位置。",
            "楼梯踏步与细轮廓保持平面细节；白色门洞闭合只用于空间选区，不输出为墙。",
            "1966 年 Millon 幻灯片是历史图纸的局部摄影，只作比例旁证，不作为重复楼层或现状陈列依据。",
            "穹顶电梯入口有平面定位；屋顶平台、穹顶内环和灯笼观景台没有可验证楼层平面，未生成。",
        ],
        "floors": [
            {
                "id": "basilica",
                "label": "大殿层",
                "order": 0,
                "sourceId": "reviewed-plans",
                "page": 1,
                "crop": [0, 0, 483, 479],
                "rules": [],
                "places": basilica_places,
                "spaces": source_spaces["basilica"],
                "rasterLayers": floor_layers(basilica_xref, 483, 479, "basilica"),
            },
            {
                "id": "grottoes",
                "label": "梵蒂冈墓穴层",
                "order": -1,
                "sourceId": "reviewed-plans",
                "page": 2,
                "crop": [0, 0, 880, 784],
                "rules": [],
                "places": grotto_places,
                "spaces": source_spaces["grottoes"],
                "rasterLayers": floor_layers(grotto_xref, 880, 784, "grottoes"),
            },
        ],
        "stopBindings": bindings,
        "unresolvedStops": unresolved,
        "unlocatedPlaces": [{"id": "basilica-82-1", "label": "82", "name": "受俸圣职人员小堂", "reason": "位置尚待确认，暂不在地图上标点。", "sourcePage": 17, "evidence": "Churches of Rome legend lists Chapel of the Beneficed as 82, but native plan image does not establish its location. The previous 82 coordinate duplicated the unrelated 57 altar and was removed."}],
    }


def main() -> None:
    subprocess.run([sys.executable, str(PRODUCER)], check=True)
    config = build_config()
    save_json(CONFIG_PATH, config)
    subprocess.run([sys.executable, str(ROOT / "scripts/rebuild-st-peters-room-selections.py"), "--apply"], check=True)
    config = json.loads(CONFIG_PATH.read_text())

    spec = importlib.util.spec_from_file_location("architectural_builder", BUILDER)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    module.build(config)

    model = json.loads(MODEL_PATH.read_text())
    if "unresolvedStops" in model:
        raise ValueError("Canonical model unexpectedly serialized unresolvedStops")
    floor_place_counts = {
        floor_id: sum(1 for place in model["places"] if place["floorId"] == floor_id)
        for floor_id in ("basilica", "grottoes")
    }
    if floor_place_counts["basilica"] != 86:
        raise ValueError("Serialized basilica inventory must retain four 79 instances and exclude unlocated 82")
    if floor_place_counts["grottoes"] != 70:
        raise ValueError("Serialized grotto place count is not 70")
    bound_stops = sorted({item["stopIndex"] for item in model["stopBindings"]})
    if bound_stops != list(range(7)):
        raise ValueError(f"Unexpected serialized bound stops: {bound_stops}")
    print(CONFIG_PATH)
    print(MODEL_PATH)


if __name__ == "__main__":
    main()
