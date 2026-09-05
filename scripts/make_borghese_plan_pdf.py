#!/usr/bin/env python3
"""Rebuild the reviewed Borghese wall/detail PDF without the Rome batch.

The checked-in review inventory is the input contract.  The helper keeps only
source pixels within named architectural bands, masks exact service pictogram
rectangles, and permits one audited 23-pixel JPEG wall repair on P0.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw


EXPECTED_SOURCE_SHA256 = "2e9b1a3d5fd11a45ca900747f6667596d024bc05b5a937237a63c19775e2c198"
FLOOR_ORDER = ["B1", "P0", "P1"]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def named_rects(records: list[dict]) -> list[tuple[str, list[float]]]:
    return [(record["name"], record["rect"]) for record in records]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Project root containing the pinned sources and review inventory.",
    )
    args = parser.parse_args()
    root = args.root.resolve()
    source_dir = root / "sources/floorplans"
    qa_dir = root / "work/borghese-mask-qa"
    source_path = source_dir / "borghese-official-visitor-brochure.pdf"
    review_path = source_dir / "rebuild-reports/borghese-structural-checkpoints.json"
    output_path = source_dir / "borghese-reviewed-plan.pdf"

    if sha256(source_path) != EXPECTED_SOURCE_SHA256:
        raise ValueError("Borghese source changed; native-pixel review required")
    review = json.loads(review_path.read_text())
    if set(review) != set(FLOOR_ORDER):
        raise ValueError("Borghese floor review inventory changed")

    source = fitz.open(source_path)
    page = source[0]
    images = page.get_images(full=True)
    if len(images) < 2:
        raise ValueError("Reviewed Borghese brochure image is missing")
    xref = images[1][0]
    pixmap = fitz.Pixmap(source, xref)
    rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3]
    image_rect, matrix = page.get_image_rects(xref, transform=True)[0]
    inverse = ~matrix

    def pixel_rect(rect: list[float]) -> tuple[int, int, int, int]:
        mapped = fitz.Rect(rect) * inverse
        return (
            max(0, round(mapped.x0 * pixmap.width)),
            max(0, round(mapped.y0 * pixmap.height)),
            min(pixmap.width, round(mapped.x1 * pixmap.width)),
            min(pixmap.height, round(mapped.y1 * pixmap.height)),
        )

    output = fitz.open()
    new_review = {}
    qa_dir.mkdir(parents=True, exist_ok=True)

    for floor_id in FLOOR_ORDER:
        prior = review[floor_id]
        crop = prior["crop"]
        wall_bands = named_rects(prior["wallBands"])
        fine_wall_bands = named_rects(prior["fineWallBands"])
        connect_wall_bands = named_rects(prior.get("connectWallBands", []))
        wall_exclude_rects = named_rects(prior.get("wallExcludeRects", []))
        wall_restore_bands = named_rects(prior.get("wallRestoreBands", []))
        detail_bands = named_rects(prior["detailBands"])
        checkpoints = [
            (item["name"], item["mode"], item["rect"])
            for item in prior.get("checkpoints", [])
        ]
        excluded_icon_rects = [
            (item["name"], item["rect"])
            for item in prior.get("excludedIconChecks", [])
        ]

        x0, y0, x1, y1 = pixel_rect(crop)
        floor_rgb = rgb[y0:y1, x0:x1]
        channel_range = np.max(floor_rgb, axis=2) - np.min(floor_rgb, axis=2)
        neutral = channel_range <= 18
        dark_source = neutral & (np.max(floor_rgb, axis=2) <= 205)
        light_source = neutral & (np.max(floor_rgb, axis=2) <= 248)

        def band_mask(bands: list[tuple[str, list[float]]]) -> np.ndarray:
            mask = np.zeros((y1 - y0, x1 - x0), dtype=bool)
            for _, rect in bands:
                bx0, by0, bx1, by1 = pixel_rect(rect)
                yy0, yy1 = max(0, by0 - y0), min(y1 - y0, by1 - y0)
                xx0, xx1 = max(0, bx0 - x0), min(x1 - x0, bx1 - x0)
                mask[yy0:yy1, xx0:xx1] = True
            return mask

        regular_walls = dark_source & band_mask(wall_bands)
        fine_walls = light_source & band_mask(fine_wall_bands)
        rectified_walls = np.zeros_like(fine_walls)
        for _, rect in connect_wall_bands:
            bx0, by0, bx1, by1 = pixel_rect(rect)
            yy0, yy1 = max(0, by0 - y0), min(y1 - y0, by1 - y0)
            xx0, xx1 = max(0, bx0 - x0), min(x1 - x0, bx1 - x0)
            region = fine_walls[yy0:yy1, xx0:xx1].astype(np.uint8)
            closed = cv2.morphologyEx(
                region, cv2.MORPH_CLOSE, np.ones((1, 5), np.uint8)
            ).astype(bool)
            rectified_walls[yy0:yy1, xx0:xx1] |= closed & ~region.astype(bool)
        fine_walls |= rectified_walls

        excluded_wall_pixels = np.zeros_like(fine_walls)
        for _, rect in wall_exclude_rects:
            bx0, by0, bx1, by1 = pixel_rect(rect)
            yy0, yy1 = max(0, by0 - y0), min(y1 - y0, by1 - y0)
            xx0, xx1 = max(0, bx0 - x0), min(x1 - x0, bx1 - x0)
            excluded_wall_pixels[yy0:yy1, xx0:xx1] = (
                regular_walls[yy0:yy1, xx0:xx1]
                | fine_walls[yy0:yy1, xx0:xx1]
            )
            regular_walls[yy0:yy1, xx0:xx1] = False
            fine_walls[yy0:yy1, xx0:xx1] = False

        restored_wall_pixels = np.zeros_like(fine_walls)
        for _, rect in wall_restore_bands:
            bx0, by0, bx1, by1 = pixel_rect(rect)
            yy0, yy1 = max(0, by0 - y0), min(y1 - y0, by1 - y0)
            xx0, xx1 = max(0, bx0 - x0), min(x1 - x0, bx1 - x0)
            source_wall = dark_source[yy0:yy1, xx0:xx1]
            restored_wall_pixels[yy0:yy1, xx0:xx1] = (
                source_wall
                & ~regular_walls[yy0:yy1, xx0:xx1]
                & ~fine_walls[yy0:yy1, xx0:xx1]
            )
            regular_walls[yy0:yy1, xx0:xx1] |= source_wall
            excluded_wall_pixels[yy0:yy1, xx0:xx1] &= ~source_wall

        walls = regular_walls | fine_walls
        details = light_source & band_mask(detail_bands) & ~walls
        retained = walls | details
        clean = np.full(rgb.shape, 255, dtype=np.uint8)
        floor_clean = clean[y0:y1, x0:x1]
        floor_clean[details] = 128
        floor_clean[walls] = 0

        scale = 2
        source_panel = Image.fromarray(floor_rgb, "RGB").resize(
            ((x1 - x0) * scale, (y1 - y0) * scale), Image.Resampling.NEAREST
        )
        clean_panel = Image.fromarray(floor_clean, "RGB").resize(
            source_panel.size, Image.Resampling.NEAREST
        )
        audit = np.full(floor_clean.shape, 255, dtype=np.uint8)
        audit[dark_source & ~retained] = [205, 45, 45]
        audit[details] = [128, 128, 128]
        audit[walls] = [0, 0, 0]
        audit_panel = Image.fromarray(audit, "RGB").resize(
            source_panel.size, Image.Resampling.NEAREST
        )
        comparison = Image.new("RGB", (source_panel.width * 3, source_panel.height + 34), "white")
        comparison_draw = ImageDraw.Draw(comparison)
        for index, (label, panel) in enumerate((
            ("SOURCE", source_panel),
            ("CLEAN WALL/DETAIL", clean_panel),
            ("REMOVED IN RED", audit_panel),
        )):
            comparison.paste(panel, (index * source_panel.width, 34))
            comparison_draw.text((index * source_panel.width + 8, 8), label, fill="black")

        wall_checks = []
        for source_kind, source_mask, bands in (
            ("dark-neutral", dark_source, wall_bands),
            ("fine-neutral", light_source, fine_wall_bands),
        ):
            structural_source = source_mask & ~excluded_wall_pixels
            for name, rect in bands:
                wx0, wy0, wx1, wy1 = pixel_rect(rect)
                yy0, yy1 = max(0, wy0 - y0), min(y1 - y0, wy1 - y0)
                xx0, xx1 = max(0, wx0 - x0), min(x1 - x0, wx1 - x0)
                source_count = int(structural_source[yy0:yy1, xx0:xx1].sum())
                retained_count = int((walls & structural_source)[yy0:yy1, xx0:xx1].sum())
                if source_count == 0 or retained_count != source_count:
                    raise RuntimeError(f"{floor_id} {name}: {retained_count}/{source_count}")
                wall_checks.append({
                    "name": name,
                    "sourceClass": source_kind,
                    "rect": rect,
                    "sourcePixels": source_count,
                    "retainedPixels": retained_count,
                    "excludedIconPixels": int(excluded_wall_pixels[yy0:yy1, xx0:xx1].sum()),
                })

        checkpoint_results = []
        for name, mode, rect in checkpoints:
            cx0, cy0, cx1, cy1 = pixel_rect(rect)
            yy0, yy1 = max(0, cy0 - y0), min(y1 - y0, cy1 - y0)
            xx0, xx1 = max(0, cx0 - x0), min(x1 - x0, cx1 - x0)
            source_mask = dark_source if mode == "wall" else light_source
            retained_mask = walls & source_mask if mode == "wall" else retained & source_mask
            source_count = int(source_mask[yy0:yy1, xx0:xx1].sum())
            retained_count = int(retained_mask[yy0:yy1, xx0:xx1].sum())
            if source_count == 0 or retained_count != source_count:
                raise RuntimeError(f"{name}: {retained_count}/{source_count}")
            checkpoint_results.append({
                "name": name,
                "mode": mode,
                "rect": rect,
                "sourcePixels": source_count,
                "retainedPixels": retained_count,
            })
            for panel_index in range(3):
                left = panel_index * source_panel.width + round((cx0 - x0) * scale)
                top = 34 + round((cy0 - y0) * scale)
                right = panel_index * source_panel.width + round((cx1 - x0) * scale)
                bottom = 34 + round((cy1 - y0) * scale)
                comparison_draw.rectangle((left, top, right, bottom), outline=(0, 150, 80), width=2)

        excluded_icon_checks = []
        for name, rect in excluded_icon_rects:
            ix0, iy0, ix1, iy1 = pixel_rect(rect)
            yy0, yy1 = max(0, iy0 - y0), min(y1 - y0, iy1 - y0)
            xx0, xx1 = max(0, ix0 - x0), min(x1 - x0, ix1 - x0)
            retained_count = int(retained[yy0:yy1, xx0:xx1].sum())
            if retained_count:
                raise RuntimeError(f"{floor_id} {name}: retained {retained_count}")
            excluded_icon_checks.append({"name": name, "rect": rect, "retainedPixels": 0})

        comparison.save(qa_dir / f"{floor_id}-comparison.png")
        clean_buffer = io.BytesIO()
        Image.fromarray(clean, "RGB").save(clean_buffer, format="PNG", optimize=True)
        new_page = output.new_page(width=page.rect.width, height=page.rect.height)
        new_page.insert_image(image_rect, stream=clean_buffer.getvalue())

        new_review[floor_id] = {
            "crop": crop,
            "method": "actual neutral source pixels inside reviewed architectural bands",
            "wallBands": [{"name": name, "rect": rect} for name, rect in wall_bands],
            "fineWallBands": [{"name": name, "rect": rect} for name, rect in fine_wall_bands],
            "connectWallBands": [{"name": name, "rect": rect} for name, rect in connect_wall_bands],
            "wallExcludeRects": [{"name": name, "rect": rect} for name, rect in wall_exclude_rects],
            "wallRestoreBands": [{"name": name, "rect": rect} for name, rect in wall_restore_bands],
            "detailBands": [{"name": name, "rect": rect} for name, rect in detail_bands],
            "wallPixels": int(walls.sum()),
            "rectifiedWallPixels": int(rectified_walls.sum()),
            "wallExcludedPixels": int(excluded_wall_pixels.sum()),
            "sourceWallPixelsRestoredAfterIconMask": int(restored_wall_pixels.sum()),
            "detailPixels": int(details.sum()),
            "allWallCheckpoints": wall_checks,
            "checkpoints": checkpoint_results,
            "excludedIconChecks": excluded_icon_checks,
        }

    output.save(output_path, deflate=True, no_new_id=True)
    output.close()
    source.close()
    review_path.write_text(json.dumps(new_review, ensure_ascii=False, indent=2) + "\n")
    print(output_path)
    print(review_path)


if __name__ == "__main__":
    main()
