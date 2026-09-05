#!/usr/bin/env python3
"""Derive, build, and render the scoped Pisa architectural plans."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw
from architectural_preview import paint_polygon

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT
SOURCES = ROOT / 'sources/floorplans'
DERIVED = SOURCES / 'derived'
QA = ROOT / 'qa/extracts'


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def page_rgb(path: Path, page_number: int, clip: tuple[float, float, float, float], scale: float) -> np.ndarray:
    document = fitz.open(path)
    pixmap = document[page_number - 1].get_pixmap(
        matrix=fitz.Matrix(scale, scale), clip=fitz.Rect(clip), alpha=False
    )
    image = np.frombuffer(pixmap.samples, np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3].copy()
    document.close()
    return image


def keep_components(mask: np.ndarray, minimum_area: int) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    output = np.zeros_like(mask, np.uint8)
    for index in range(1, count):
        if stats[index, cv2.CC_STAT_AREA] >= minimum_area:
            output[labels == index] = 1
    return output


def write_mask_pdf(name: str, mask: np.ndarray) -> dict:
    DERIVED.mkdir(parents=True, exist_ok=True)
    QA.mkdir(parents=True, exist_ok=True)
    rgb = np.repeat(np.where(mask[..., None] > 0, 0, 255).astype(np.uint8), 3, axis=2)
    png = QA / f'{name}.png'
    Image.fromarray(rgb).save(png)
    height, width = mask.shape
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=width, height=height)
    page.insert_image(page.rect, filename=str(png))
    pdf = DERIVED / f'{name}.pdf'
    document.save(pdf, deflate=True, no_new_id=True)
    document.close()
    check = fitz.open(pdf)
    xref = check[0].get_images(full=True)[0][0]
    check.close()
    return {
        'file': str(pdf.relative_to(SOURCES)),
        'sha256': digest(pdf),
        'width': width,
        'height': height,
        'imageXref': xref,
        'qa': str(png),
    }


def write_image_pdf(name: str, image_path: Path) -> Path:
    image = Image.open(image_path)
    document = fitz.open()
    document.set_metadata({})
    page = document.new_page(width=image.width, height=image.height)
    page.insert_image(page.rect, filename=str(image_path))
    output = DERIVED / f'{name}.pdf'
    document.save(output, deflate=True, no_new_id=True)
    document.close()
    return output


def derive() -> None:
    records = []

    parent = SOURCES / 'soane-pisa-cathedral-plan-high.jpg'
    rgb = np.asarray(Image.open(parent).convert('RGB'))[18:735, 23:527]
    mask = keep_components((cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 174).astype(np.uint8), 3)
    mask[410:705, 350:504] = 0
    mask[675:, :] = 0
    result = write_mask_pdf('pisa-cathedral-ground-plan', mask)
    records.append({
        'slug': 'pisa-cathedral', **result,
        'parentFile': str(parent.relative_to(ROOT)), 'parentSha256': digest(parent),
        'parentPage': None, 'crop': [23, 18, 527, 735],
        'method': 'neutral-ink threshold <174; components <3 px removed; external handwritten legend masked',
    })
    full = write_image_pdf('pisa-cathedral-soane-sheet', parent)
    records[-1]['auditSheet'] = {'file': str(full.relative_to(SOURCES)), 'sha256': digest(full)}

    parent = SOURCES / 'pisa-baptistery-hbim-figure6.png'
    rgb = np.asarray(Image.open(parent).convert('RGB'))[1040:1938, 1265:2160]
    mask = keep_components((cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 210).astype(np.uint8), 4)
    mask[:100, :350] = 0
    mask[450:650, :100] = 0
    mask[450:650, 850:] = 0
    mask[650:850, 760:] = 0
    mask[840:, :100] = 0
    result = write_mask_pdf('pisa-baptistery-ground-plan', mask)
    records.append({
        'slug': 'pisa-baptistery', **result,
        'parentFile': str(parent.relative_to(ROOT)), 'parentSha256': digest(parent),
        'parentPage': None, 'crop': [1265, 1040, 2160, 1938],
        'method': 'grayscale plan-ink threshold <210; components <4 px removed; section trace retained for flat-detail classification',
    })
    full = write_image_pdf('pisa-baptistery-hbim-figure6', parent)
    records[-1]['auditSheet'] = {'file': str(full.relative_to(SOURCES)), 'sha256': digest(full)}

    parent = SOURCES / 'opera-pisa-architect-project.pdf'
    rgb = page_rgb(parent, 3, (24, 346, 172, 500), 4)
    mask = ((rgb[:, :, 2] > rgb[:, :, 0] + 35) &
            (rgb[:, :, 2] > rgb[:, :, 1] + 20) & (rgb[:, :, 0] < 145))
    yy, xx = np.ogrid[:mask.shape[0], :mask.shape[1]]
    mask &= (xx - 292) ** 2 + (yy - 308) ** 2 <= 286 ** 2
    result = write_mask_pdf('leaning-tower-base-plan', keep_components(mask.astype(np.uint8), 4))
    records.append({
        'slug': 'leaning-tower', **result,
        'parentFile': str(parent.relative_to(ROOT)), 'parentSha256': digest(parent),
        'parentPage': 3, 'crop': [24, 346, 172, 500],
        'method': 'blue architectural ink isolated without affine transform; components <4 px removed',
    })

    rgb = page_rgb(parent, 3, (98, 340, 555, 730), 4)
    mask = ((rgb[:, :, 2] > rgb[:, :, 0] + 35) &
            (rgb[:, :, 2] > rgb[:, :, 1] + 20) & (rgb[:, :, 0] < 145)).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    mask[:560, :360] = 0
    mask[:250, :] = 0
    result = write_mask_pdf('opera-pisa-ground-plan', keep_components(mask, 10))
    records.append({
        'slug': 'opera-pisa', **result,
        'parentFile': str(parent.relative_to(ROOT)), 'parentSha256': digest(parent),
        'parentPage': 3, 'crop': [98, 340, 555, 730],
        'method': 'blue architectural ink; 3 px opening retains heavy walls; adjacent Tower inset excluded',
    })

    parent = SOURCES / 'camposanto-unifi-survey.pdf'
    rgb = page_rgb(parent, 19, (48, 58, 548, 253), 4)
    mask = (cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY) < 235).astype(np.uint8)
    result = write_mask_pdf('camposanto-ground-plan', keep_components(mask, 2))
    records.append({
        'slug': 'camposanto', **result,
        'parentFile': str(parent.relative_to(ROOT)), 'parentSha256': digest(parent),
        'parentPage': 19, 'crop': [48, 58, 548, 253],
        'method': 'neutral survey ink threshold <235; components <2 px removed; all fine survey ink retained for flat-detail classification',
    })

    parent = SOURCES / 'opapisa-mappa-vert-2026.pdf'
    rgb = page_rgb(parent, 1, (0, 0, 595.28, 841.89), 2)[585:1070, 965:1145]
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    mask = keep_components(((gray > 80) & (gray < 190)).astype(np.uint8), 20)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    result = write_mask_pdf('sinopie-published-footprint', mask)
    records.append({
        'slug': 'sinopie', **result,
        'parentFile': str(parent.relative_to(ROOT)), 'parentSha256': digest(parent),
        'parentPage': 1, 'crop': [482.5, 292.5, 572.5, 535.0],
        'method': 'current-map gray building fill isolated; exterior footprint only; no interior walls inferred',
    })

    for record in records:
        record['transform'] = 'translation/crop and uniform raster scale only; no skew or perspective warp'
    (DERIVED / 'derivation-manifest.json').write_text(json.dumps(records, indent=2) + '\n')
    print(json.dumps(records, indent=2))


def load_generator():
    path = REPO / 'scripts/build-architectural-plans.py'
    spec = importlib.util.spec_from_file_location('architectural_plan_generator', path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    module.ROOT = ROOT
    return module


def render_model(path: Path) -> None:
    model = json.loads(path.read_text())
    for floor in model['floors']:
        x0, y0, x1, y1 = floor['bounds']
        margin = 50
        scale = min(1100 / max(x1 - x0, 1), 780 / max(y1 - y0, 1))
        width = max(360, math.ceil((x1 - x0) * scale + margin * 2))
        height = max(280, math.ceil((y1 - y0) * scale + margin * 2))
        image = Image.new('RGB', (width, height), '#f7f5ef')
        draw = ImageDraw.Draw(image)
        for feature in floor['features']:
            fill = {'surface': '#e6e1d6', 'detail': '#989892', 'wall': '#343a40'}[feature['kind']]
            for polygon in feature['polygons']:
                points = [((p[0] - x0) * scale + margin, (p[1] - y0) * scale + margin)
                          for p in polygon['outer']]
                holes = [[((p[0] - x0) * scale + margin, (p[1] - y0) * scale + margin)
                          for p in ring] for ring in polygon.get('holes', [])]
                paint_polygon(image, points, holes, fill)
        for place in [place for place in model['places'] if place['floorId'] == floor['id']]:
            px = (place['at'][0] - x0) * scale + margin
            py = (place['at'][1] - y0) * scale + margin
            draw.ellipse((px - 5, py - 5, px + 5, py + 5), fill='#c53b33')
            draw.text((px + 8, py - 7), place['label'], fill='#7d1d18')
        output = ROOT / 'qa/models' / f"{model['slug']}-{floor['id']}.png"
        output.parent.mkdir(parents=True, exist_ok=True)
        image.save(output)


def build() -> None:
    generator = load_generator()
    venue_dir = SOURCES / 'venues'
    for slug in ('leaning-tower', 'pisa-cathedral', 'pisa-baptistery', 'camposanto', 'opera-pisa'):
        config_path = venue_dir / f'{slug}.json'
        config = json.loads(config_path.read_text())
        generator.build(config)
        render_model(ROOT / 'app/data/architectural-plans' / f"{config['slug']}.json")


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] not in {'derive', 'build'}:
        raise SystemExit('usage: rebuild-pisa.py derive|build')
    {'derive': derive, 'build': build}[sys.argv[1]]()
