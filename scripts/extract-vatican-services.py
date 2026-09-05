#!/usr/bin/env python3
"""Extract every visible Vatican map service icon from reviewed PDF vectors."""
from __future__ import annotations

import hashlib
import json
from collections import Counter
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "sources/floorplans/vatican-museums-candidate-1.pdf"
OUT = ROOT / "work/vatican-service-qa"
INVENTORY = ROOT / "sources/floorplans/vatican-museums-service-inventory.json"
EXPECTED_SHA256 = "a0c97704c9af1b096f9e9fa12061acd6998f112206af01c24b7cfda7dbf6c9ff"
BLUE = (0.13, 0.51, 0.663)
ORANGE = (0.922, 0.536, 0.137)


# These are the visible source instances, not the repeated legend examples or
# clipped form copies also returned by get_drawings(). Every index was checked
# against a full-page render and matched to the official English service key.
REVIEWED = {
    "first": [
        (1, 141, "团队集合", "导览团集合点", "guided-tours-meeting-point"),
        (1, 150, "购票", "购票处", "buy-ticket"),
        (1, 158, "书店", "书店", "bookshop"),
        (1, 161, "衣帽间", "衣帽间", "checkroom"),
        (1, 163, "信息", "信息台", "information"),
        (1, 166, "语音导览", "语音导览台", "audioguide-desk"),
        (1, 168, "邮局", "梵蒂冈邮局", "vatican-post-office"),
        (1, 170, "咖啡厅", "咖啡厅／小酒馆", "cafeteria-bistrot"),
        (1, 172, "书店", "书店", "bookshop"),
        (1, 174, "书店", "书店", "bookshop"),
        (1, 176, "书店", "书店", "bookshop"),
        (1, 178, "餐饮", "咖啡厅／小酒馆（餐具图标）", "cafeteria-bistrot-utensils"),
        (1, 180, "咖啡厅", "咖啡厅／小酒馆", "cafeteria-bistrot"),
        (1, 182, "咖啡厅", "咖啡厅／小酒馆", "cafeteria-bistrot"),
        (1, 184, "语音导览", "语音导览台", "audioguide-desk"),
        (1, 187, "语音导览", "语音导览台", "audioguide-desk"),
        (1, 190, "语音导览", "语音导览台", "audioguide-desk"),
        (1, 193, "凭证兑换", "预约凭证兑换", "booking-voucher-change"),
        (1, 200, "接待", "接待处", "reception"),
        (1, 202, "行李寄存", "行李寄存", "luggage-storage"),
        (1, 233, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 236, "无障碍洗手间", "无障碍洗手间", "disabled-toilets"),
        (1, 245, "特别许可", "特别许可", "special-permits"),
        (1, 251, "婴儿护理", "婴儿护理台", "baby-changing-table"),
        (1, 257, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 260, "急救", "急救", "first-aid"),
        (1, 262, "电梯", "电梯", "elevator"),
        (1, 268, "电梯", "电梯", "elevator"),
        (1, 274, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 277, "电梯", "电梯", "elevator"),
        (1, 283, "轮椅坡道", "轮椅坡道", "wheelchair-ramp"),
        (1, 288, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 291, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 294, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 297, "洗手间", "洗手间", "toilets"),
        (1, 302, "婴儿护理", "婴儿护理台", "baby-changing-table"),
        (1, 308, "电梯", "电梯", "elevator"),
        (1, 314, "急救", "急救", "first-aid"),
        (1, 316, "洗手间", "洗手间", "toilets"),
        (1, 321, "婴儿护理", "婴儿护理台", "baby-changing-table"),
        (1, 327, "急救", "急救", "first-aid"),
        (1, 329, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (1, 333, "婴儿护理", "婴儿护理台", "baby-changing-table"),
        (1, 338, "洗手间", "洗手间", "toilets"),
        (1, 345, "洗手间", "洗手间", "toilets"),
        (1, 350, "婴儿护理", "婴儿护理台", "baby-changing-table"),
    ],
    "second": [
        (2, 67, "书店", "书店", "bookshop"),
        (2, 70, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (2, 85, "洗手间", "洗手间", "toilets"),
        (2, 95, "婴儿护理", "婴儿护理台", "baby-changing-table"),
        (2, 100, "无障碍洗手间", "无障碍洗手间", "disabled-toilets"),
        (2, 108, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (2, 117, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
    ],
    "basement": [
        (2, 65, "咖啡厅", "咖啡厅／小酒馆", "cafeteria-bistrot"),
        (2, 73, "婴儿护理", "婴儿护理台", "baby-changing-table"),
        (2, 77, "无障碍洗手间", "无障碍洗手间", "disabled-toilets"),
        (2, 90, "洗手间", "洗手间", "toilets"),
        (2, 111, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
        (2, 114, "无障碍电梯", "无障碍电梯与协助", "accessible-elevator-assistance"),
    ],
}

CROPS = {
    "first": (1, fitz.Rect(20, 90, 825, 555)),
    "second": (2, fitz.Rect(25, 40, 570, 285)),
    "basement": (2, fitz.Rect(15, 330, 342, 570)),
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rounded_color(value: tuple[float, ...] | None) -> tuple[float, ...] | None:
    return tuple(round(channel, 3) for channel in value) if value else None


def main() -> None:
    if digest(PDF) != EXPECTED_SHA256:
        raise ValueError("Official Vatican map checksum changed")
    OUT.mkdir(parents=True, exist_ok=True)
    document = fitz.open(PDF)
    records = []
    counters = Counter()
    for floor_id, specs in REVIEWED.items():
        for page_number, drawing_index, label, name, category in specs:
            page = document[page_number - 1]
            drawings = page.get_drawings()
            drawing = drawings[drawing_index]
            rect = drawing["rect"]
            fill = rounded_color(drawing.get("fill"))
            expected_fill = BLUE if category in {
                "guided-tours-meeting-point", "buy-ticket", "bookshop", "checkroom",
                "information", "audioguide-desk", "vatican-post-office",
                "cafeteria-bistrot", "cafeteria-bistrot-utensils", "reception",
                "luggage-storage", "booking-voucher-change",
            } else ORANGE
            if fill != expected_fill:
                raise ValueError(f"{floor_id} drawing {drawing_index}: service fill changed")
            if drawing["type"] != "f" or len(drawing["items"]) not in {4, 7}:
                raise ValueError(f"{floor_id} drawing {drawing_index}: service circle changed")
            center = [(rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2]
            pixmap = page.get_pixmap(
                matrix=fitz.Matrix(4, 4),
                clip=fitz.Rect(center[0] - 0.5, center[1] - 0.5, center[0] + 0.5, center[1] + 0.5),
                alpha=False,
            )
            center_rgb = tuple(pixmap.samples[:3])
            counters[(floor_id, category)] += 1
            records.append({
                "id": f"{floor_id}-service-{len([r for r in records if r['floorId'] == floor_id]) + 1:02d}",
                "floorId": floor_id,
                "page": page_number,
                "drawingIndex": drawing_index,
                "drawingSeqno": drawing["seqno"],
                "circleRect": [round(value, 6) for value in rect],
                "center": [round(value, 6) for value in center],
                "label": label,
                "name": name,
                "category": category,
                "fill": list(fill),
                "centerRenderedRgb": list(center_rgb),
                "precision": "PDF vector service-circle bounds centre; visible source instance",
            })

    expected_counts = {"first": 46, "second": 7, "basement": 6}
    actual_counts = Counter(record["floorId"] for record in records)
    if dict(actual_counts) != expected_counts:
        raise ValueError(f"Service inventory changed: {actual_counts}")
    payload = {
        "source": str(PDF.relative_to(ROOT)),
        "sha256": digest(PDF),
        "method": (
            "Visible full-page render reviewed first; each retained instance is then anchored to "
            "the exact get_drawings() coloured service-circle bounds centre. Legend examples and "
            "clipped duplicate form copies are excluded."
        ),
        "counts": expected_counts,
        "categoryCounts": {
            floor: dict(sorted((category, count) for (item_floor, category), count in counters.items() if item_floor == floor))
            for floor in expected_counts
        },
        "services": records,
    }
    INVENTORY.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")

    for floor_id, (page_number, crop) in CROPS.items():
        page = document[page_number - 1]
        scale = 4
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=crop, alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        draw = ImageDraw.Draw(image)
        floor_records = [record for record in records if record["floorId"] == floor_id]
        for record in floor_records:
            x, y = record["center"]
            px = (x - crop.x0) * scale
            py = (y - crop.y0) * scale
            radius = 5.4 * scale
            draw.ellipse((px-radius, py-radius, px+radius, py+radius), outline=(0, 128, 72), width=4)
            draw.text((px + radius + 2, py - 8), record["id"].split("-")[-1], fill=(0, 92, 52))
        image.save(OUT / f"{floor_id}-service-vector-overlay.png")
    document.close()
    print(INVENTORY)
    print(OUT)


if __name__ == "__main__":
    main()
