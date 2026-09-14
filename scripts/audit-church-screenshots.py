"""Inspect CUA-captured model screenshots, without driving the browser."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

directory = Path(sys.argv[1])
rows = json.loads((directory / 'desktop-checks.json').read_text())
mobile = {r['slug']: r for r in json.loads((directory / 'mobile-checks.json').read_text())}
results = []
views = ['斜视', '俯视', '正面', '侧面', 'mobile']
sheet = None
for index, row in enumerate(rows):
    if index % 4 == 0:
        sheet = Image.new('RGB', (1500, 4 * 245), '#08121c')
    for col, view in enumerate(views):
        item = mobile[row['slug']] if view == 'mobile' else row
        rect = item['canvas']
        picture = Image.open(directory / f"{row['slug']}-{view}.jpg").convert('RGB')
        scale = picture.width / item['width']
        box = [rect['left'], rect['top'] + 24, rect['right'], rect['bottom'] - 32]
        crop = picture.crop(tuple(round(v * scale) for v in box))
        mask = crop.convert('L').point(lambda p: 255 if p > 75 else 0)
        bounds = mask.getbbox()
        ratio = mask.histogram()[255] / (mask.width * mask.height)
        passed = bounds is not None and ratio > 0.003
        results.append({'slug': row['slug'], 'view': view, 'litPixelFraction': ratio,
                        'bounds': bounds, 'nonblank': passed})
        if not passed:
            raise SystemExit(f"Blank model: {row['slug']} {view}")
        crop.thumbnail((296, 215))
        x, y = col * 300, (index % 4) * 245
        sheet.paste(crop, (x + (300 - crop.width) // 2, y + 20))
        ImageDraw.Draw(sheet).text((x + 5, y + 2), f"{row['slug']} / {col + 1}", fill='white')
    if index % 4 == 3 or index == len(rows) - 1:
        sheet.save(directory / f'contact-{index // 4 + 1}.jpg')
(directory / 'pixel-results.json').write_text(json.dumps(results, indent=2))
print(f"{len(results)} screenshots have visible non-background model pixels.")
print(f"Minimum lit-pixel fraction: {min(r['litPixelFraction'] for r in results):.4f}")
