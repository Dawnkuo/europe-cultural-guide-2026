#!/usr/bin/env python3
"""Extract reviewed Vatican map marker centers and leader endpoints from vectors."""
from __future__ import annotations

import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "sources/floorplans/vatican-museums-candidate-1.pdf"
OUT = ROOT / "work/vatican-marker-qa"


# Drawing IDs are from page.get_drawings() on the pinned official PDF. Each
# collection/service dot is paired with the immediately preceding leader path.
REVIEWED = [
    # page, floor, label, occurrence, circle drawing, leader drawing
    (1, "first", "1", 1, 91, 90),
    (1, "first", "2", 1, 95, 94),
    (1, "first", "3", 1, 75, 74),
    (1, "first", "4", 1, 77, 76),
    (1, "first", "11", 1, 127, 126),
    (1, "first", "11", 2, 81, 80),
    (1, "first", "11", 3, 83, 82),
    (1, "first", "12", 1, 85, 84),
    (1, "first", "13", 1, 109, 108),
    (1, "first", "14", 1, 79, 78),
    (1, "first", "15", 1, 106, 105),
    (1, "first", "16", 1, 93, 92),
    (1, "first", "17", 1, 87, 86),
    (1, "first", "18", 1, 99, 98),
    (1, "first", "19", 1, 123, 122),
    (1, "first", "19", 2, 121, 120),
    (1, "first", "19", 3, 89, 88),
    (1, "first", "入口", 1, 136, 135),
    (1, "first", "出口", 1, 131, 130),
    (2, "second", "5", 1, 32, 31),
    (2, "second", "5", 2, 38, 37),
    (2, "second", "6", 1, 42, 41),
    (2, "second", "7", 1, 34, 33),
    (2, "second", "8", 1, 36, 35),
    (2, "second", "9", 1, 46, 45),
    (2, "second", "10", 1, 44, 43),
    (2, "basement", "20", 1, 50, 49),
    (2, "basement", "21", 1, 40, 39),
    (2, "basement", "22", 1, 48, 47),
]


def point_values(item: tuple) -> list[fitz.Point]:
    return [value for value in item[1:] if isinstance(value, fitz.Point)]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    document = fitz.open(PDF)
    records = []
    for page_number, floor_id, label, occurrence, circle_index, leader_index in REVIEWED:
        page = document[page_number - 1]
        drawings = page.get_drawings()
        circle = drawings[circle_index]
        leader = drawings[leader_index]
        rect = circle["rect"]
        center = fitz.Point((rect.x0 + rect.x1) / 2, (rect.y0 + rect.y1) / 2)
        assert circle["type"] == "f"
        assert circle["fill"] is not None
        assert all(item[0] == "c" for item in circle["items"])
        assert leader["type"] == "s"
        leader_points = [point for item in leader["items"] for point in point_values(item)]
        junction = min(leader_points, key=lambda point: point.distance_to(center))
        origin = max(leader_points, key=lambda point: point.distance_to(center))
        assert junction.distance_to(center) < 0.01, (label, center, junction)
        records.append({
            "page": page_number,
            "floorId": floor_id,
            "label": label,
            "occurrence": occurrence,
            "circleDrawingIndex": circle_index,
            "circleSeqno": circle["seqno"],
            "circleRect": [round(value, 6) for value in rect],
            "center": [round(center.x, 6), round(center.y, 6)],
            "leaderDrawingIndex": leader_index,
            "leaderSeqno": leader["seqno"],
            "leaderEndpoint": [round(junction.x, 6), round(junction.y, 6)],
            "leaderOrigin": [round(origin.x, 6), round(origin.y, 6)],
            "precision": "PDF vector black-circle center and attached leader endpoint",
        })

    # CP is an orientation marker, not a leader endpoint. Record the source
    # vector circle separately so its coordinate is equally auditable.
    cp = document[0].get_drawings()[140]
    cp_center = [(cp["rect"].x0 + cp["rect"].x1) / 2, (cp["rect"].y0 + cp["rect"].y1) / 2]
    records.append({
        "page": 1,
        "floorId": "first",
        "label": "松果庭院",
        "occurrence": 1,
        "circleDrawingIndex": 140,
        "circleSeqno": cp["seqno"],
        "circleRect": [round(value, 6) for value in cp["rect"]],
        "center": [round(value, 6) for value in cp_center],
        "precision": "PDF vector CP orientation-circle center",
    })

    payload = {
        "source": str(PDF),
        "method": "Reviewed get_drawings() circle and attached leader path IDs; no photo-center or rounded manual coordinate is used.",
        "markers": records,
    }
    (OUT / "extracted-markers.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    )

    by_page = {1: [], 2: []}
    for record in records:
        by_page[record["page"]].append(record)
    scale = 3.0
    crops = {
        "page1-all": (1, fitz.Rect(35, 90, 780, 550)),
        "page2-second": (2, fitz.Rect(40, 45, 570, 285)),
        "page2-basement": (2, fitz.Rect(40, 330, 300, 530)),
    }
    for name, (page_number, crop) in crops.items():
        page = document[page_number - 1]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=crop, alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        draw = ImageDraw.Draw(image)
        for record in by_page[page_number]:
            x, y = record["center"]
            if not crop.contains(fitz.Point(x, y)):
                continue
            px = (x - crop.x0) * scale
            py = (y - crop.y0) * scale
            radius = 4.2 * scale
            draw.ellipse((px-radius, py-radius, px+radius, py+radius), outline=(0, 145, 75), width=4)
            text = f"{record['label']}#{record['occurrence']} d{record['circleDrawingIndex']} ({x:.3f},{y:.3f})"
            bbox = draw.textbbox((0, 0), text)
            tx = min(max(0, px + 8), image.width - (bbox[2] - bbox[0]) - 4)
            ty = min(max(0, py - 22), image.height - (bbox[3] - bbox[1]) - 4)
            draw.rectangle((tx-2, ty-2, tx+bbox[2]-bbox[0]+2, ty+bbox[3]-bbox[1]+2), fill=(255, 255, 255))
            draw.text((tx, ty), text, fill=(0, 105, 55))
        image.save(OUT / f"{name}.png")
    document.close()
    print(OUT / "extracted-markers.json")


if __name__ == "__main__":
    main()
