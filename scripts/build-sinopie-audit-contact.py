#!/usr/bin/env python3
"""Render the reviewed Sinopie evidence pages into a reproducible contact sheet."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources/floorplans"
QA = ROOT / "qa/sinopie-architecture-audit-v2"

PANELS = (
    ("sinopie-accessibility.pdf", 2, "ACCESSIBILITY AUDIT P2: TWO LEVELS"),
    ("sinopie-accessibility.pdf", 7, "ACCESSIBILITY AUDIT P7: NO VISITOR MAP"),
    ("sinopie-accessibility.pdf", 8, "ACCESSIBILITY AUDIT P8: LIFT / RAMP FACTS"),
    ("sinopie-comune-pisa292-elaborato5.pdf", 20, "COMUNE 2007 P20: COMPLEX CONTEXT, NOT MUSEUM PLAN"),
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render_page(path: Path, page_number: int) -> Image.Image:
    document = fitz.open(path)
    page = document[page_number - 1]
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), alpha=False)
    image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
    document.close()
    return image


def main() -> None:
    QA.mkdir(parents=True, exist_ok=True)
    width, height = 900, 700
    gutter, title_height = 24, 44
    canvas = Image.new("RGB", (width * 2 + gutter * 3, height * 2 + gutter * 3), "white")
    draw = ImageDraw.Draw(canvas)
    records = []
    for index, (name, page_number, label) in enumerate(PANELS):
        source = SOURCES / name
        image = render_page(source, page_number)
        image.thumbnail((width, height - title_height), Image.Resampling.LANCZOS)
        column, row = index % 2, index // 2
        x0 = gutter + column * (width + gutter)
        y0 = gutter + row * (height + gutter)
        draw.text((x0, y0), label, fill="#171717")
        x = x0 + (width - image.width) // 2
        y = y0 + title_height + (height - title_height - image.height) // 2
        canvas.paste(image, (x, y))
        page_file = QA / f"{Path(name).stem}-page-{page_number:02d}.png"
        image.save(page_file)
        records.append({
            "source": f"sources/floorplans/{name}",
            "sourceSha256": digest(source),
            "page": page_number,
            "render": str(page_file.relative_to(ROOT)),
            "renderSha256": digest(page_file),
            "label": label,
        })
    output = QA / "sinopie-architecture-evidence-contact-v2.png"
    canvas.save(output)
    audit = {
        "panels": records,
        "contact": str(output.relative_to(ROOT)),
        "contactSha256": digest(output),
    }
    audit_path = QA / "sinopie-architecture-evidence-contact-v2.json"
    audit_path.write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2))


if __name__ == "__main__":
    main()
