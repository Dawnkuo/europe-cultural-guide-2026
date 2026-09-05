#!/usr/bin/env python3
"""Reproduce the non-Goodyear Pisa source masks and build venue models."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image


DEFAULT_ROOT = Path(__file__).resolve().parents[1]
VENUES = (
    "leaning-tower",
    "pisa-cathedral",
    "pisa-baptistery",
    "camposanto",
    "opera-pisa",
)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def keep_components(mask: np.ndarray, minimum_area: int) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        mask.astype(np.uint8), 8
    )
    output = np.zeros_like(mask, np.uint8)
    for index in range(1, count):
        if stats[index, cv2.CC_STAT_AREA] >= minimum_area:
            output[labels == index] = 1
    return output


def page_rgb(
    path: Path,
    page_number: int,
    clip: tuple[float, float, float, float],
    scale: float,
) -> np.ndarray:
    document = fitz.open(path)
    pixmap = document[page_number - 1].get_pixmap(
        matrix=fitz.Matrix(scale, scale),
        clip=fitz.Rect(clip),
        alpha=False,
    )
    image = np.frombuffer(pixmap.samples, np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3].copy()
    document.close()
    return image


def write_mask_pdf(root: Path, name: str, mask: np.ndarray) -> dict:
    derived = root / "sources/floorplans/derived"
    qa = root / "qa/base-sources"
    derived.mkdir(parents=True, exist_ok=True)
    qa.mkdir(parents=True, exist_ok=True)
    rgb = np.repeat(
        np.where(mask[..., None] > 0, 0, 255).astype(np.uint8),
        3,
        axis=2,
    )
    png = qa / f"{name}.png"
    # Keep Pillow's default PNG encoding so the frozen source PDFs reproduce
    # the already-reviewed byte hashes, not merely equivalent pixels.
    Image.fromarray(rgb).save(png)
    height, width = mask.shape
    output = derived / f"{name}.pdf"
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=width, height=height)
    page.insert_image(page.rect, filename=str(png))
    document.save(output, deflate=True, no_new_id=True)
    document.close()
    check = fitz.open(output)
    xref = check[0].get_images(full=True)[0][0]
    check.close()
    return {
        "file": str(output.relative_to(root / "sources/floorplans")),
        "sha256": digest(output),
        "width": width,
        "height": height,
        "imageXref": xref,
        "qa": str(png.relative_to(root)),
    }


def write_image_pdf(root: Path, name: str, image_path: Path) -> Path:
    image = Image.open(image_path)
    output = root / "sources/floorplans/derived" / f"{name}.pdf"
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=image.width, height=image.height)
    page.insert_image(page.rect, filename=str(image_path))
    document.save(output, deflate=True, no_new_id=True)
    document.close()
    return output


def derive(root: Path) -> list[dict]:
    sources = root / "sources/floorplans"
    records: list[dict] = []

    parent = sources / "soane-pisa-cathedral-plan-high.jpg"
    rgb = np.asarray(Image.open(parent).convert("RGB"))[18:735, 23:527]
    source_ink = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 174
    mask = keep_components(source_ink.astype(np.uint8), 3)
    mask[410:705, 350:504] = 0
    mask[675:, :] = 0
    result = write_mask_pdf(root, "pisa-cathedral-ground-plan", mask)
    audit = write_image_pdf(root, "pisa-cathedral-soane-sheet", parent)
    records.append({
        "slug": "pisa-cathedral",
        **result,
        "parentFile": str(parent.relative_to(root)),
        "parentSha256": digest(parent),
        "crop": [23, 18, 527, 735],
        "method": "source pixels with neutral-ink threshold below 174; tiny components and handwritten legend excluded",
        "sourcePixelSubset": bool(np.all(mask <= source_ink)),
        "auditSheet": {
            "file": str(audit.relative_to(sources)),
            "sha256": digest(audit),
        },
    })

    parent = sources / "pisa-baptistery-hbim-figure6.png"
    rgb = np.asarray(Image.open(parent).convert("RGB"))[1040:1938, 1265:2160]
    source_ink = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 210
    mask = keep_components(source_ink.astype(np.uint8), 4)
    mask[:100, :350] = 0
    mask[450:650, :100] = 0
    mask[450:650, 850:] = 0
    mask[650:850, 760:] = 0
    mask[840:, :100] = 0
    result = write_mask_pdf(root, "pisa-baptistery-ground-plan", mask)
    audit = write_image_pdf(root, "pisa-baptistery-hbim-figure6", parent)
    records.append({
        "slug": "pisa-baptistery",
        **result,
        "parentFile": str(parent.relative_to(root)),
        "parentSha256": digest(parent),
        "crop": [1265, 1040, 2160, 1938],
        "method": "source pixels with grayscale threshold below 210; neighboring section labels excluded",
        "sourcePixelSubset": bool(np.all(mask <= source_ink)),
        "auditSheet": {
            "file": str(audit.relative_to(sources)),
            "sha256": digest(audit),
        },
    })

    parent = sources / "opera-pisa-architect-project.pdf"
    rgb = page_rgb(parent, 3, (24, 346, 172, 500), 4)
    source_ink = (
        (rgb[:, :, 2] > rgb[:, :, 0] + 35)
        & (rgb[:, :, 2] > rgb[:, :, 1] + 20)
        & (rgb[:, :, 0] < 145)
    )
    yy, xx = np.ogrid[:source_ink.shape[0], :source_ink.shape[1]]
    source_ink &= (xx - 292) ** 2 + (yy - 308) ** 2 <= 286 ** 2
    mask = keep_components(source_ink.astype(np.uint8), 4)
    result = write_mask_pdf(root, "leaning-tower-base-plan", mask)
    records.append({
        "slug": "leaning-tower",
        **result,
        "parentFile": str(parent.relative_to(root)),
        "parentSha256": digest(parent),
        "parentPage": 3,
        "crop": [24, 346, 172, 500],
        "method": "source blue architectural ink within the reviewed Tower-plan crop; no rectification or redrawing",
        "sourcePixelSubset": bool(np.all(mask <= source_ink)),
    })

    rgb = page_rgb(parent, 3, (98, 340, 555, 730), 4)
    source_ink = (
        (rgb[:, :, 2] > rgb[:, :, 0] + 35)
        & (rgb[:, :, 2] > rgb[:, :, 1] + 20)
        & (rgb[:, :, 0] < 145)
    ).astype(np.uint8)
    mask = cv2.morphologyEx(
        source_ink,
        cv2.MORPH_OPEN,
        np.ones((3, 3), np.uint8),
    )
    mask &= source_ink
    mask[:560, :360] = 0
    mask[:250, :] = 0
    mask = keep_components(mask, 10)
    result = write_mask_pdf(root, "opera-pisa-ground-plan", mask)
    records.append({
        "slug": "opera-pisa",
        **result,
        "parentFile": str(parent.relative_to(root)),
        "parentSha256": digest(parent),
        "parentPage": 3,
        "crop": [98, 340, 555, 730],
        "method": "source blue architectural ink only; adjacent Tower inset excluded; opened mask intersected with source ink",
        "sourcePixelSubset": bool(np.all(mask <= source_ink)),
    })

    parent = sources / "camposanto-unifi-survey.pdf"
    rgb = page_rgb(parent, 19, (48, 58, 548, 253), 4)
    source_ink = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 235
    mask = keep_components(source_ink.astype(np.uint8), 2)
    result = write_mask_pdf(root, "camposanto-ground-plan", mask)
    records.append({
        "slug": "camposanto",
        **result,
        "parentFile": str(parent.relative_to(root)),
        "parentSha256": digest(parent),
        "parentPage": 19,
        "crop": [48, 58, 548, 253],
        "method": "source survey ink with grayscale threshold below 235; fine measured detail retained",
        "sourcePixelSubset": bool(np.all(mask <= source_ink)),
    })

    for record in records:
        record["transform"] = (
            "translation/crop and uniform raster scale only; no skew or perspective warp"
        )
        if not record["sourcePixelSubset"]:
            raise AssertionError(f"{record['slug']}: emitted pixels outside source ink")
    manifest = sources / "derived/base-source-derivation-manifest.json"
    manifest.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return records


def load_builder(root: Path):
    path = root / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_plan_generator", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    module.ROOT = root
    return module


def build(root: Path, slugs: set[str]) -> None:
    builder = load_builder(root)
    for slug in VENUES:
        if slug not in slugs:
            continue
        config_path = root / "sources/floorplans/venues" / f"{slug}.json"
        builder.build(json.loads(config_path.read_text(encoding="utf-8")))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", choices=("derive", "build", "all"))
    parser.add_argument("--root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--slug", action="append", choices=VENUES)
    args = parser.parse_args()
    root = args.root.resolve()
    selected = set(args.slug or VENUES)
    if args.operation in {"derive", "all"}:
        print(json.dumps(derive(root), ensure_ascii=False, indent=2))
    if args.operation in {"build", "all"}:
        build(root, selected)


if __name__ == "__main__":
    main()
