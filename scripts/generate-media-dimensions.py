"""Read decoded image dimensions for layout and detect invalid local assets."""
import json
from pathlib import Path

import cv2

ROOT = Path(__file__).resolve().parents[1]
dimensions = {}
for path in sorted((ROOT / 'public').rglob('*')):
    if path.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.webp', '.avif'}:
        continue
    image = cv2.imread(str(path))
    if image is None:
        raise ValueError(f'Cannot decode image: {path}')
    height, width = image.shape[:2]
    dimensions['/' + str(path.relative_to(ROOT / 'public'))] = {'width': width, 'height': height}
(ROOT / 'app/data/media-dimensions.generated.json').write_text(json.dumps(dimensions, indent=2) + '\n')
print(f'Validated dimensions of {len(dimensions)} local images')
