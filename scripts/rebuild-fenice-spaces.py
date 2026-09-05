"""Extract Fenice selectable room floors from reviewed source-white components.

The venue config records a seed and the minimum doorway segments needed to
close each room for floor selection. The architectural wall mask remains the
source of every other boundary; this script does not draw replacement rooms.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path

import cv2
import fitz
import numpy as np
from PIL import Image, ImageDraw
from shapely import make_valid, set_precision
from shapely.affinity import affine_transform
from shapely.geometry import GeometryCollection, Polygon


ROOT = Path(__file__).resolve().parents[1]


def load_builder():
    path = ROOT / "scripts/build-architectural-plans.py"
    spec = importlib.util.spec_from_file_location("architectural_builder", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def source_mask(document, page, raster, extraction):
    pixmap = fitz.Pixmap(document, raster["xref"])
    if pixmap.colorspace != fitz.csRGB:
        pixmap = fitz.Pixmap(fitz.csRGB, pixmap)
    rgb = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(
        pixmap.height, pixmap.width, pixmap.n
    )[:, :, :3]
    if "rgbRange" in raster:
        low, high = raster["rgbRange"]
        ink = np.all((rgb >= low) & (rgb <= high), axis=2).astype(np.uint8)
    else:
        ink = (np.max(rgb, axis=2) <= raster["maxChannel"]).astype(np.uint8)
    if "maxChroma" in raster:
        chroma = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2)
        ink &= (chroma <= raster["maxChroma"]).astype(np.uint8)

    matrix = page.get_image_rects(raster["xref"], transform=True)[
        raster.get("occurrence", 0)
    ][1]
    inverse = ~matrix

    def pixel_point(point):
        mapped = fitz.Point(*point) * inverse
        return (
            int(round(mapped.x * pixmap.width)),
            int(round(mapped.y * pixmap.height)),
        )

    def pixel_rect(rect):
        mapped = fitz.Rect(rect) * inverse
        return (
            max(0, round(mapped.x0 * pixmap.width)),
            max(0, round(mapped.y0 * pixmap.height)),
            min(pixmap.width, round(mapped.x1 * pixmap.width)),
            min(pixmap.height, round(mapped.y1 * pixmap.height)),
        )

    exclude_rects = extraction.get("excludeRects", raster.get("excludeRects", []))
    for exclusion in exclude_rects:
        x0, y0, x1, y1 = pixel_rect(exclusion["rect"])
        ink[y0:y1, x0:x1] = 0
    if raster.get("wallKernel", 1) > 1:
        kernel = np.ones((raster["wallKernel"], raster["wallKernel"]), np.uint8)
        walls = cv2.morphologyEx(ink, cv2.MORPH_OPEN, kernel)
        walls &= ink
    else:
        walls = ink.copy()
    if raster.get("allInkIsDetail"):
        walls[:] = 0
    flat_rects = extraction.get("flatRects", raster.get("flatRects", []))
    for region in flat_rects:
        x0, y0, x1, y1 = pixel_rect(region["rect"])
        walls[y0:y1, x0:x1] = 0

    transform = [
        matrix.a / pixmap.width,
        matrix.c / pixmap.height,
        matrix.b / pixmap.width,
        matrix.d / pixmap.height,
        matrix.e,
        matrix.f,
    ]
    return pixmap, rgb, walls, pixel_point, transform


def fill_small_holes(geometry, maximum_area):
    def clean(polygon):
        holes = [ring.coords[:] for ring in polygon.interiors if Polygon(ring).area > maximum_area]
        return Polygon(polygon.exterior.coords[:], holes)

    if geometry.geom_type == "Polygon":
        return clean(geometry)
    return GeometryCollection([clean(p) for p in geometry.geoms if p.geom_type == "Polygon"])


def rounded_polygon(polygon):
    def points(ring):
        return [[round(x, 4), round(y, 4)] for x, y in ring.coords]

    return {
        "outer": points(polygon.exterior),
        "holes": [points(ring) for ring in polygon.interiors],
    }


def extract_floor(document, floor, output_directory, builder, diagnose=False):
    extraction = floor["spaceExtraction"]
    page = document[floor["page"] - 1]
    raster_indices = extraction.get(
        "barrierRasterLayers", [extraction.get("rasterLayer", 0)]
    )
    layers = [
        source_mask(document, page, floor["rasterLayers"][index], extraction)
        for index in raster_indices
    ]
    pixmap, rgb, _, pixel_point, transform = layers[0]
    if any(layer[0].width != pixmap.width or layer[0].height != pixmap.height for layer in layers):
        raise ValueError(f"Barrier rasters differ in size for {floor['id']}")
    barrier = np.zeros((pixmap.height, pixmap.width), dtype=np.uint8)
    for _, _, layer_mask, _, layer_transform in layers:
        if any(abs(layer_transform[index] - transform[index]) > 1e-9 for index in range(6)):
            raise ValueError(f"Barrier rasters differ in placement for {floor['id']}")
        barrier |= layer_mask
    def apply_crop(mask):
        if "barrierCrop" not in extraction:
            return
        x0, y0 = pixel_point(extraction["barrierCrop"][:2])
        x1, y1 = pixel_point(extraction["barrierCrop"][2:])
        mask[:y0, :] = 1
        mask[y1:, :] = 1
        mask[:, :x0] = 1
        mask[:, x1:] = 1

    def apply_closures(mask, closures):
        for closure in closures:
            a, b = [pixel_point(point) for point in closure["segment"]]
            cv2.line(mask, a, b, 1, closure.get("widthPixels", 2), cv2.LINE_8)

    closures = extraction.get("closures", [])
    apply_crop(barrier)
    apply_closures(barrier, closures)

    output_directory.mkdir(parents=True, exist_ok=True)
    barrier_preview = Image.fromarray(np.where(barrier, 0, 255).astype(np.uint8), mode="L").convert("RGB")
    barrier_draw = ImageDraw.Draw(barrier_preview)
    for closure in closures:
        a, b = [pixel_point(point) for point in closure["segment"]]
        barrier_draw.line((a, b), fill=(220, 0, 150), width=4)
        barrier_draw.text(a, closure["id"], fill=(0, 70, 180))
    barrier_preview.resize(
        (barrier_preview.width * 3, barrier_preview.height * 3), Image.Resampling.NEAREST
    ).save(output_directory / f"{floor['id']}-barrier-closures.png")
    if "auditCrop" in extraction:
        x0, y0 = pixel_point(extraction["auditCrop"][:2])
        x1, y1 = pixel_point(extraction["auditCrop"][2:])
        barrier_preview.crop((x0, y0, x1, y1)).resize(
            ((x1 - x0) * 7, (y1 - y0) * 7), Image.Resampling.NEAREST
        ).save(output_directory / f"{floor['id']}-barrier-crop.png")

    spaces = []
    preview = Image.fromarray(rgb)
    overlay = Image.new("RGBA", preview.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    palette = [
        (18, 139, 191, 105),
        (236, 137, 26, 105),
        (38, 155, 82, 105),
        (132, 81, 190, 105),
        (213, 65, 101, 105),
    ]

    for index, room in enumerate(extraction["rooms"]):
        room_barrier = barrier.copy()
        if "minimumChannel" in room:
            room_barrier = (
                np.min(rgb, axis=2) < room["minimumChannel"]
            ).astype(np.uint8)
            apply_crop(room_barrier)
            apply_closures(room_barrier, closures)
        room_closures = room.get("closures", [])
        apply_closures(room_barrier, room_closures)
        component_count, labels = cv2.connectedComponents(
            (1 - room_barrier).astype(np.uint8), connectivity=4
        )
        if component_count < 2:
            raise ValueError(f"No white components for {floor['id']} {room['id']}")

        room_barrier_preview = Image.fromarray(
            np.where(room_barrier, 0, 255).astype(np.uint8), mode="L"
        ).convert("RGB")
        room_barrier_draw = ImageDraw.Draw(room_barrier_preview)
        for closure in [*closures, *room_closures]:
            a, b = [pixel_point(point) for point in closure["segment"]]
            room_barrier_draw.line((a, b), fill=(220, 0, 150), width=4)
        room_barrier_preview.save(
            output_directory / f"{floor['id']}-{room['id']}-barrier.png"
        )

        seeds = room["seeds"] if "seeds" in room else [room["seed"]]
        pixel_seeds = [pixel_point(seed) for seed in seeds]
        component_ids = []
        for seed in pixel_seeds:
            component_id = int(labels[seed[1], seed[0]])
            if component_id == 0:
                raise ValueError(f"Seed is on a barrier: {floor['id']} {room['id']} {seed}")
            if component_id not in component_ids:
                component_ids.append(component_id)

        polygons = []
        components = []
        for component_id in component_ids:
            component = (labels == component_id).astype(np.uint8)
            components.append(component)
            pixel_geometry = builder.trace_pixel_ink(
                component, extraction.get("tolerancePixels", 0.2)
            )
            source_geometry = affine_transform(pixel_geometry, transform)
            source_geometry = fill_small_holes(
                source_geometry, room.get("fillHolesBelowSourceArea", 0)
            )
            source_geometry = set_precision(
                make_valid(source_geometry), 0.0001, mode="valid_output"
            )
            polygons.extend(
                [source_geometry]
                if source_geometry.geom_type == "Polygon"
                else [part for part in source_geometry.geoms if part.geom_type == "Polygon"]
            )
        polygons.sort(key=lambda polygon: polygon.bounds)
        if len(polygons) != room.get("expectedComponents", len(polygons)) and not diagnose:
            raise ValueError(
                f"Component inventory changed for {floor['id']} {room['id']}: "
                f"{len(polygons)} expected {room['expectedComponents']}"
            )
        total_area = sum(polygon.area for polygon in polygons)
        total_holes = sum(len(polygon.interiors) for polygon in polygons)
        actual_bounds = (
            min(polygon.bounds[0] for polygon in polygons),
            min(polygon.bounds[1] for polygon in polygons),
            max(polygon.bounds[2] for polygon in polygons),
            max(polygon.bounds[3] for polygon in polygons),
        )
        print(
            floor["id"],
            room["id"],
            "bounds",
            [round(value, 2) for value in actual_bounds],
            "area",
            round(total_area, 2),
            "components",
            len(polygons),
            "holes",
            total_holes,
            "largest-hole-areas",
            [round(Polygon(ring).area, 2) for ring in sorted(
                [ring for polygon in polygons for ring in polygon.interiors],
                key=lambda item: Polygon(item).area,
                reverse=True,
            )[:12]],
        )
        bounds = room["expectedBounds"]
        if not diagnose and any(
            abs(actual_bounds[i] - bounds[i]) > room.get("boundsTolerance", 2)
            for i in range(4)
        ):
            raise ValueError(
                f"White component escaped reviewed bounds for {floor['id']} {room['id']}: "
                f"{[round(v, 2) for v in actual_bounds]} expected {bounds}"
            )
        expected_holes = room.get("expectedHoles")
        if not diagnose and expected_holes is not None and total_holes != expected_holes:
            raise ValueError(
                f"Hole inventory changed for {floor['id']} {room['id']}: "
                f"{total_holes} expected {expected_holes}"
            )
        area_range = room.get("expectedAreaRange")
        if not diagnose and area_range and not area_range[0] <= total_area <= area_range[1]:
            raise ValueError(
                f"Area changed for {floor['id']} {room['id']}: "
                f"{total_area:.2f} outside {area_range}"
            )

        spaces.append(
            {
                "id": room["id"],
                "label": room["label"],
                "placeId": room["placeId"],
                "scope": "room",
                "polygons": [rounded_polygon(polygon) for polygon in polygons],
                "sourcePaths": sorted(
                    {floor["rasterLayers"][index]["xref"] for index in raster_indices}
                ),
                "evidence": room["evidence"],
            }
        )
        color = palette[index % len(palette)]
        for component in components:
            mask = Image.fromarray(component * 255, mode="L")
            overlay.paste(color, (0, 0), mask)
        radius = 5
        for seed in pixel_seeds:
            overlay_draw.ellipse(
                (seed[0] - radius, seed[1] - radius, seed[0] + radius, seed[1] + radius),
                fill=(0, 115, 45, 255),
            )

    for closure in closures:
        a, b = [pixel_point(point) for point in closure["segment"]]
        overlay_draw.line((a, b), fill=(220, 0, 150, 255), width=4)
    preview = Image.alpha_composite(preview.convert("RGBA"), overlay)
    preview.save(output_directory / f"{floor['id']}-source-white-spaces.png")
    return spaces


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true")
    parser.add_argument("--diagnose", action="store_true")
    args = parser.parse_args()

    path = ROOT / "sources/floorplans/venues/fenice.json"
    config = json.loads(path.read_text())
    sources = {"primary": config, **{source["id"]: source for source in config["sourceFiles"]}}
    documents = {
        source_id: fitz.open(ROOT / "sources/floorplans" / source["file"])
        for source_id, source in sources.items()
    }
    builder = load_builder()
    output = ROOT / "work/fenice-space-audit"
    try:
        for floor in config["floors"]:
            if "spaceExtraction" not in floor:
                continue
            floor["spaces"] = extract_floor(
                documents[floor.get("sourceId", "primary")],
                floor,
                output,
                builder,
                diagnose=args.diagnose,
            )
            print(floor["id"], len(floor["spaces"]), "source-white spaces")
    finally:
        for document in documents.values():
            document.close()
    if args.write:
        path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
