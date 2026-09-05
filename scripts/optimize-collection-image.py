"""Make a bounded, uncropped offline derivative without enlarging source pixels."""
import json
import sys

import cv2

source, destination = sys.argv[1:3]
pixels = cv2.imread(source, cv2.IMREAD_COLOR)
if pixels is None:
    raise ValueError(f"Undecodable collection image: {source}")
height, width = pixels.shape[:2]
scale = min(1, 1800 / max(height, width))
if scale < 1:
    pixels = cv2.resize(pixels, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA)
if not cv2.imwrite(destination, pixels, [cv2.IMWRITE_JPEG_QUALITY, 93]):
    raise ValueError(f"Failed to write: {destination}")
print(json.dumps({"width": pixels.shape[1], "height": pixels.shape[0]}))
