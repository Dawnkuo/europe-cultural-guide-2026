"""Attach the reviewed 2026 official crypt plan, preserving its pixel contour."""
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from shapely.affinity import affine_transform

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("plan_builder", ROOT / "scripts/build-architectural-plans.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
source_path = ROOT / "sources/floorplans/sagrada-crypt-2026.pdf"
digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
assert digest == "2ab8c0eab277a0638457878e7f625947d7ba946fa1bc442f7c447f3171b118f9"
document = fitz.open(source_path)
page = document[2]
pixmap = fitz.Pixmap(document, 22)
if pixmap.colorspace != fitz.csRGB:
    pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
rgb = np.frombuffer(pixmap.samples, np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)[:, :, :3]
ink = (cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 180).astype(np.uint8)
contours, _ = cv2.findContours(ink, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
outline = max(contours, key=cv2.contourArea)
assert cv2.contourArea(outline) == 125419.5 and len(outline) == 867
matrix = page.get_image_rects(22, transform=True)[0][1]
footprint_mask = np.zeros_like(ink)
cv2.drawContours(footprint_mask, [outline], -1, 1, cv2.FILLED)
footprint = builder.trace_pixel_ink(footprint_mask, tolerance=.1)
footprint = affine_transform(footprint, [matrix.a / pixmap.width, matrix.c / pixmap.height, matrix.b / pixmap.width, matrix.d / pixmap.height, matrix.e, matrix.f])
footprint_polygons = builder.polygons(footprint, [0, 0])

path = ROOT / "sources/floorplans/venues/sagrada-familia.json"
config = json.loads(path.read_text())
config["sourceFiles"] = [{
    "id": "crypt-2026", "file": source_path.name, "sha256": digest,
    "url": "https://sagradafamilia.org/documents/20142/1693659/SF_Booklet_05_20260227_digital_AF.pdf/c340aa2a-6e6f-9a66-cee1-a85808d77c80",
    "sourceProjection": {"kind": "orthographic", "pages": [3], "basis": "Official February 2026 information booklet 5, printed p3 lower-left: overhead crypt plan, with no oblique walls. The right-hand elevation is excluded. Chapel leaders end inside documented bays; their displaced captions are not place coordinates."}
}]
names = [
    ("若瑟", "圣若瑟礼拜堂", 12), ("圣心", "圣心礼拜堂", 3),
    ("亚纳", "圣亚纳礼拜堂", 6), ("若翰", "圣若翰洗者与圣若望福音作者礼拜堂", 9),
    ("圣母", "圣母无原罪礼拜堂", 30), ("约阿敬", "圣约阿敬礼拜堂", 33),
    ("匝加利亚", "圣依撒伯尔与圣匝加利亚礼拜堂", 36),
    ("圣体", "圣体礼拜堂", 21), ("加尔默罗", "加尔默罗圣母礼拜堂 · 高迪墓", 27),
    ("蒙特塞拉特", "蒙特塞拉特圣母礼拜堂", 18), ("基督", "圣基督礼拜堂 · 博卡韦利亚墓", 24),
    ("祭坛", "地下教堂主祭坛", 15),
]
drawings = page.get_drawings()
places = []
for label, name, index in names:
    rect = drawings[index]["rect"]
    places.append({"label": label, "name": name, "at": [(rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2]})
places += [{"label": "中央", "name": "地下教堂会众区", "kind": "area", "at": [225, 504]}]
crypt = {
    "id": "crypt", "label": "地下教堂 · 十二礼拜空间", "order": -1,
    "page": 3, "sourceId": "crypt-2026", "crop": [108, 382, 342, 569],
    "places": places, "expectedLabels": [p["label"] for p in places], "rules": [],
    "spaces": [{"id": "crypt-footprint", "label": "地下教堂整体空间", "placeId": "crypt-中央-1", "tone": "neutral", "polygons": footprint_polygons, "sourcePaths": ["image:22:external-contour:867-vertices"], "evidence": "Pixel-cell union inside the reviewed 867-vertex external raster contour, grayscale threshold 180, raw contour area 125419.5 source pixels squared. Pixel cells resolve self-touching zero-width boundary spurs without drawing a shortcut. Visually compared with p3 and the standalone 562x452 raster. Source buttresses, semicircular chapels, lobed piers, twin stairs and altar extension are preserved. This footprint is not an assertion that all points are walkable."}],
    "rasterLayers": [{"xref": 22, "maxChannel": 195, "allInkIsDetail": True, "minAreaPixels": .5, "tolerancePixels": .2, "reason": "Official crypt architectural drawing only. Paving and pier contours share an ink layer with wall outlines, so all are retained as flat source detail; do not extrude tile joints as walls. Red labels and leaders are separate PDF paths and excluded."}]
}
config["floors"] = [f for f in config["floors"] if f["id"] != "crypt"] + [crypt]
config["limitations"] = [
    "主层采用建筑规划平面，包含规划部分；地下教堂按2026年版图册单独绘制。",
    "地下教堂保留十二处礼拜空间、柱廓、双侧楼梯和地坪细节；原图共用细线的铺地与墙线保持平面表达。",
    "地下教堂与游客登塔通道分别管理；受难立面塔的逐层平面尚待补充，未从主层复制或猜测。"
]
review = "Supplement: crypt p3 was visually inspected in the official February 2026 booklet. All twelve original callout endpoint circles supply accurate chapel anchors. The uninterrupted footprint is traced with every contour vertex, not replaced with a semicircle or box. The independent elevation is not used to infer visitor connections."
if review not in config["review"]:
    config["review"] += " " + review
path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")
builder.build(config)
