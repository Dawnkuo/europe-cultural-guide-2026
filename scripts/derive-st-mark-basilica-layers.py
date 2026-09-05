#!/usr/bin/env python3
"""Derive deterministic, classified St Mark wall/detail source layers."""

import hashlib
import json
import zlib
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "sources/floorplans/venues/st-mark-basilica.json"
SOURCE = ROOT / "sources/floorplans/st-mark-basilica-klein.pdf"
DERIVED = ROOT / "sources/floorplans/st-mark-basilica-semantic-layers.pdf"
AUDIT_DIR = ROOT / "work/st-mark-basilica-semantic-audit"
CHECKPOINTS = ROOT / "sources/floorplans/rebuild-reports/st-mark-basilica-source-checkpoints.json"

WALL_POINTS = [
    ("north-service-west-wall", 170, 150),
    ("north-service-return", 166, 180),
    ("north-apse-mass", 260, 175),
    ("north-east-chapel-wall", 300, 235),
    ("transept-west-bearing-wall", 150, 265),
    ("transept-east-bearing-wall", 330, 265),
    ("west-outer-wall", 105, 300),
    ("east-outer-wall", 365, 300),
    ("west-aisle-wall", 145, 360),
    ("east-aisle-wall", 335, 360),
    ("west-middle-wall", 155, 395),
    ("east-middle-wall", 320, 395),
    ("west-south-wall", 155, 470),
    ("east-south-wall", 315, 470),
    ("south-crosswall-west", 160, 515),
    ("south-crosswall-centre", 220, 515),
    ("south-crosswall-east", 300, 515),
    ("narthex-south-west", 150, 558),
    ("narthex-south-centre", 220, 558),
    ("narthex-south-east", 300, 558),
    ("treasury-west-wall", 365, 400),
    ("treasury-south-wall", 365, 450),
    ("treasury-east-exterior", 410, 440),
    ("nave-pier-north-west", 165, 360),
    ("nave-pier-middle-west", 200, 395),
    ("nave-pier-middle-east", 277, 395),
    ("nave-pier-south-east", 315, 470),
]

EMPTY_POINTS = [
    ("north-service-opening", 220, 150),
    ("north-west-chapel-opening", 175, 235),
    ("san-pietro-chapel-gap", 180, 250),
    ("san-clemente-chapel-gap", 295, 250),
    ("apse-to-crossing", 238, 250),
    ("crossing-centre", 238, 300),
    ("nave-north-centre", 238, 360),
    ("nave-centre", 238, 430),
    ("nave-south-centre", 238, 490),
    ("narthex-centre", 238, 540),
    ("west-aisle-passage", 200, 360),
    ("east-aisle-passage", 277, 360),
    ("treasury-room-interior", 380, 440),
    ("treasury-north-interior", 385, 420),
]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fmt(value):
    return f"{value:.6f}".rstrip("0").rstrip(".")


def deterministic_image_pdf(path, rgb, page_rect, image_rect):
    """Write one RGB image into a minimal PDF without dates or random IDs."""
    height, width, _ = rgb.shape
    compressed = zlib.compress(rgb.tobytes(), level=9)
    page_width = page_rect.width
    page_height = page_rect.height
    content = (
        f"q\n{fmt(image_rect.width)} 0 0 {fmt(image_rect.height)} "
        f"{fmt(image_rect.x0)} {fmt(page_height - image_rect.y1)} cm\n/Im0 Do\nQ\n"
    ).encode("ascii")
    bodies = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {fmt(page_width)} {fmt(page_height)}] "
            "/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>"
        ).encode("ascii"),
        (
            f"<< /Type /XObject /Subtype /Image /Width {width} /Height {height} "
            f"/ColorSpace /DeviceRGB /BitsPerComponent 8 /Interpolate false "
            f"/Filter /FlateDecode /Length {len(compressed)} >>\nstream\n"
        ).encode("ascii") + compressed + b"\nendstream",
        f"<< /Length {len(content)} >>\nstream\n".encode("ascii") + content + b"endstream",
    ]
    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, body in enumerate(bodies, 1):
        offsets.append(len(output))
        output.extend(f"{number} 0 obj\n".encode("ascii"))
        output.extend(body)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(b"xref\n0 6\n0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode("ascii")
    )
    path.write_bytes(output)


def main():
    config = json.loads(CONFIG.read_text())
    floor = config["floors"][0]
    source_raster = floor.get("sourceRasterLayers", floor["rasterLayers"])[0]
    density_spec = floor["wallDensity"]
    document = fitz.open(SOURCE)
    page = document[5]
    pixmap = fitz.Pixmap(document, source_raster["xref"])
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3]
    image_rect, matrix = page.get_image_rects(source_raster["xref"], transform=True)[0]
    inverse = ~matrix

    def pixel_rect(rect):
        mapped = fitz.Rect(rect) * inverse
        return (
            max(0, round(mapped.x0 * pixmap.width)),
            max(0, round(mapped.y0 * pixmap.height)),
            min(pixmap.width, round(mapped.x1 * pixmap.width)),
            min(pixmap.height, round(mapped.y1 * pixmap.height)),
        )

    def pixel_point(point):
        mapped = fitz.Point(*point) * inverse
        return (
            min(pixmap.width - 1, max(0, round(mapped.x * pixmap.width))),
            min(pixmap.height - 1, max(0, round(mapped.y * pixmap.height))),
        )

    dark = (np.max(rgb, axis=2) <= density_spec["maxChannel"]).astype(np.float32)
    detail = (np.max(rgb, axis=2) <= source_raster["maxChannel"]).astype(np.uint8)
    for exclusion in source_raster["excludeRects"]:
        x0, y0, x1, y1 = pixel_rect(exclusion["rect"])
        dark[y0:y1, x0:x1] = 0
        detail[y0:y1, x0:x1] = 0
    density = cv2.boxFilter(
        dark,
        cv2.CV_32F,
        (density_spec["windowPixels"], density_spec["windowPixels"]),
        normalize=True,
    )
    walls = (density >= density_spec["minimumDensity"]).astype(np.uint8)
    walls = cv2.morphologyEx(
        walls,
        cv2.MORPH_CLOSE,
        np.ones((density_spec["closeKernel"], density_spec["closeKernel"]), np.uint8),
    )
    walls = cv2.morphologyEx(
        walls,
        cv2.MORPH_OPEN,
        np.ones((density_spec["openKernel"], density_spec["openKernel"]), np.uint8),
    )
    for exclusion in source_raster["excludeRects"]:
        x0, y0, x1, y1 = pixel_rect(exclusion["rect"])
        walls[y0:y1, x0:x1] = 0
    detail &= 1 - walls

    classified = np.full((pixmap.height, pixmap.width, 3), 255, dtype=np.uint8)
    classified[detail == 1] = [255, 0, 0]
    classified[walls == 1] = [0, 0, 0]
    DERIVED.parent.mkdir(parents=True, exist_ok=True)
    deterministic_image_pdf(DERIVED, classified, page.rect, image_rect)

    derived_document = fitz.open(DERIVED)
    derived_page = derived_document[0]
    images = derived_page.get_images(full=True)
    if len(images) != 1 or images[0][0] != 4:
        raise AssertionError(("derived xref inventory changed", images))
    derived_rect = derived_page.get_image_rects(4)[0]
    if any(abs(a - b) > 0.0001 for a, b in zip(derived_rect, image_rect)):
        raise AssertionError(("derived image registration changed", derived_rect, image_rect))
    derived_document.close()

    for name, x, y in WALL_POINTS:
        px, py = pixel_point((x, y))
        if walls[py, px] != 1:
            raise AssertionError(("required wall missing", name, x, y))
    for name, x, y in EMPTY_POINTS:
        px, py = pixel_point((x, y))
        if walls[py, px] != 0:
            raise AssertionError(("required gap bridged", name, x, y))

    places = floor["places"]
    masks = source_raster["excludeRects"][1:]
    if len(places) != 47 or len(masks) != 47:
        raise AssertionError("Printed-key inventory changed")
    key_records = []
    for place, exclusion in zip(places, masks):
        x0, y0, x1, y1 = pixel_rect(exclusion["rect"])
        if np.any(walls[y0:y1, x0:x1]) or np.any(detail[y0:y1, x0:x1]):
            raise AssertionError(("printed key survives derived masks", place["label"]))
        key_records.append(
            {
                "label": place["label"],
                "sourcePoint": place["at"],
                "sourceMaskRect": exclusion["rect"],
                "derivedWallPixels": int(walls[y0:y1, x0:x1].sum()),
                "derivedDetailPixels": int(detail[y0:y1, x0:x1].sum()),
            }
        )

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(classified).save(AUDIT_DIR / "st-mark-basilica-semantic-layers.png")
    Image.fromarray(walls * 255).save(AUDIT_DIR / "st-mark-basilica-wall-mask.png")
    Image.fromarray(detail * 255).save(AUDIT_DIR / "st-mark-basilica-detail-mask.png")
    CHECKPOINTS.parent.mkdir(parents=True, exist_ok=True)
    result = {
        "slug": "st-mark-basilica",
        "parentSource": SOURCE.name,
        "parentSha256": sha256(SOURCE),
        "parentPage": 6,
        "parentImageXref": source_raster["xref"],
        "derivedSource": DERIVED.name,
        "derivedSha256": sha256(DERIVED),
        "derivedPage": 1,
        "derivedImageXref": 4,
        "registration": {
            "pageSize": [page.rect.width, page.rect.height],
            "imageRect": list(image_rect),
            "transform": "exact parent page and image rectangle; no resampling or geometric warp",
        },
        "classification": {
            "wallColor": [0, 0, 0],
            "detailColor": [255, 0, 0],
            "backgroundColor": [255, 255, 255],
            "detailMaxChannel": source_raster["maxChannel"],
            **{key: density_spec[key] for key in (
                "maxChannel", "windowPixels", "minimumDensity", "closeKernel", "openKernel"
            )},
            "detailDefinition": "original dark source pixels outside the wall mask and reviewed annotation masks",
        },
        "requiredWall": [
            {"id": name, "sourcePoint": [x, y]} for name, x, y in WALL_POINTS
        ],
        "requiredEmpty": [
            {"id": name, "sourcePoint": [x, y]} for name, x, y in EMPTY_POINTS
        ],
        "printedKeyMasks": key_records,
        "summary": {
            "wallCheckpoints": len(WALL_POINTS),
            "emptyCheckpoints": len(EMPTY_POINTS),
            "printedKeys": len(key_records),
            "wallPixels": int(walls.sum()),
            "detailPixels": int(detail.sum()),
        },
    }
    CHECKPOINTS.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    document.close()
    print(json.dumps({"derivedSha256": result["derivedSha256"], **result["summary"]}, indent=2))


if __name__ == "__main__":
    main()
