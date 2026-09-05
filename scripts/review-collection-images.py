"""Build legible contact sheets from the exact offline collection derivatives."""
import json
from pathlib import Path

import cv2
import numpy as np

root = Path(__file__).resolve().parents[1]
records = json.loads((root / 'sources/collections/installed.json').read_text())
output = root / 'work/collection-review'
output.mkdir(parents=True, exist_ok=True)
for start in range(0, len(records), 12):
    sheet = np.full((4 * 355, 3 * 450, 3), 242, np.uint8)
    for offset, record in enumerate(records[start:start + 12]):
        image = cv2.imread(str(root / 'public' / record['image'].lstrip('/')))
        if image is None:
            raise ValueError(record['id'])
        height, width = image.shape[:2]
        scale = min(430 / width, 305 / height)
        thumb = cv2.resize(image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
        h, w = thumb.shape[:2]
        x, y = offset % 3 * 450, offset // 3 * 355
        sheet[y + 8 + (305-h)//2:y + 8 + (305-h)//2+h, x+(450-w)//2:x+(450-w)//2+w] = thumb
        cv2.putText(sheet, record['id'][:45], (x+8, y+336), cv2.FONT_HERSHEY_SIMPLEX, .49, (25,25,25), 1, cv2.LINE_AA)
    cv2.imwrite(str(output / f'sheet-{start//12+1:02d}.jpg'), sheet, [cv2.IMWRITE_JPEG_QUALITY, 95])
print(f'{len(records)} images in {(len(records)+11)//12} review sheets')
