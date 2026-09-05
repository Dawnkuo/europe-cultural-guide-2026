"""Extract complete historical Palau floor sheets without reprojection."""
from io import BytesIO
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "sources/floorplans/palau-musica-architectural.pdf"
OUTPUT = ROOT / "sources/floorplans/palau-musica-four-level-plans-v2.pdf"

# Bounds in the four-times render of COAM Arquitectura 172, page 26.
# IV includes the separately printed area 11, without inferred registration.
CROPS = [(1600, 1310, 2490, 1750), (1600, 1650, 2490, 2120),
         (1600, 2000, 2490, 2455), (1570, 2370, 2490, 3075)]


def main():
    with fitz.open(SOURCE) as source:
        pixmap = source[0].get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
        original = Image.open(BytesIO(pixmap.tobytes("png"))).convert("RGB")
    with fitz.open() as output:
        output.set_metadata({
            "title": "Palau de la Musica Catalana historic plans I-IV",
            "author": "Source: COAM Arquitectura 172 (1973), page 26",
            "subject": "Unwarped crops; plan IV includes the unregistered plan 11 inset",
            "creator": "rebuild-palau-source-v2.py", "producer": "PyMuPDF",
            "creationDate": "D:19730101000000Z", "modDate": "D:19730101000000Z",
        })
        for bounds in CROPS:
            crop = original.crop(bounds)
            stream = BytesIO()
            crop.save(stream, format="PNG", optimize=False)
            page = output.new_page(width=crop.width, height=crop.height)
            page.insert_image(page.rect, stream=stream.getvalue(), keep_proportion=False)
        output.save(OUTPUT, garbage=4, deflate=True, no_new_id=True)


if __name__ == "__main__":
    main()
