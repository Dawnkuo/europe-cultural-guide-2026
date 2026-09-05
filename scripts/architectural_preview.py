"""Compositing shared by source-geometry review images."""
from PIL import Image, ImageDraw


def paint_polygon(image, outer, holes, fill):
    # A hole is transparent, not an instruction to erase earlier geometry.
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(outer, fill=255)
    for ring in holes:
        draw.polygon(ring, fill=0)
    image.paste(fill, (0, 0, image.width, image.height), mask)
