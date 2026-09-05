"""Geometry regressions: exact holes, one-pixel lines, and generated validity."""
import importlib.util
import json
import unittest
from pathlib import Path

import numpy as np
import fitz
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("plan_builder", ROOT / "scripts/build-architectural-plans.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ArchitecturalGeometryTest(unittest.TestCase):
    def test_source_projection_requires_review_of_every_page(self):
        config = {"floors":[{"page":1},{"page":2}], "sourceProjection":{
            "kind":"orthographic", "pages":[1,2],
            "basis":"Both reviewed source pages show overhead floor plans without perspective."}}
        builder.validate_projection(config)
        for kind in ("unknown", "oblique", "perspective"):
            with self.assertRaisesRegex(ValueError, "rectify"):
                builder.validate_projection({**config,"sourceProjection":{**config["sourceProjection"],"kind":kind}})
        with self.assertRaisesRegex(ValueError, "every extracted page"):
            builder.validate_projection({**config,"sourceProjection":{**config["sourceProjection"],"pages":[1]}})
        with self.assertRaisesRegex(ValueError, "rectify"):
            builder.validate_projection({"floors":[{"page":1}]})

    def test_wall_profile_does_not_bridge_open_contours(self):
        drawing = {"items":[("l",fitz.Point(0,0),fitz.Point(10,0)),
                            ("l",fitz.Point(10,0),fitz.Point(10,2)),
                            ("l",fitz.Point(10,2),fitz.Point(0,2))]}
        spec = {"ids":[0],"endpointGrid":.05,"expectedAreas":[]}
        self.assertEqual(builder.closed_wall_profiles([drawing], spec), [])
        with self.assertRaisesRegex(ValueError, "inventory changed"):
            builder.closed_wall_profiles([drawing], {**spec,"expectedAreas":[20]})
        with self.assertRaisesRegex(ValueError, "precision budget"):
            builder.closed_wall_profiles([drawing], {**spec,"endpointGrid":1})

    def test_no_scala_room_anchor_is_filled_as_masonry(self):
        model = json.loads((ROOT / "app/data/architectural-plans/la-scala.json").read_text())
        profiles = [f for floor in model["floors"] for f in floor["features"] if "-masonry-" in f["id"]]
        self.assertEqual(len(profiles), 7)
        for feature in profiles:
            for polygon in feature["polygons"]:
                shape = Polygon(polygon["outer"],polygon["holes"])
                self.assertTrue(shape.is_valid)
                self.assertFalse(any(shape.covers(Point(p["at"])) for p in model["places"]))

    def test_thin_closed_line_does_not_fill_the_room(self):
        mask = np.zeros((40, 40), dtype=np.uint8)
        mask[4, 4:35] = mask[34, 4:35] = 1
        mask[4:35, 4] = mask[4:35, 34] = 1
        mask[4:35, 20] = 1
        result = builder.trace_pixel_ink(mask)
        self.assertAlmostEqual(result.area, int(mask.sum()), places=5)
        self.assertFalse(result.covers(Point(10, 10)))
        self.assertTrue(result.covers(Point(20.5, 10.5)))

    def test_nested_courtyard_and_column_holes_survive(self):
        mask = np.ones((30, 30), dtype=np.uint8)
        mask[3:27, 3:27] = 0
        mask[12:18, 12:18] = 1
        mask[14:16, 14:16] = 0
        result = builder.trace_pixel_ink(mask)
        self.assertAlmostEqual(result.area, int(mask.sum()), places=5)
        self.assertTrue(result.is_valid)
        self.assertFalse(result.covers(Point(15, 15)))

    def test_every_generated_polygon_is_valid(self):
        errors = []
        count = 0
        for path in (ROOT / "app/data/architectural-plans").glob("*.json"):
            model = json.loads(path.read_text())
            for floor in model["floors"]:
                for feature in floor["features"]:
                    for ring in feature["polygons"]:
                        p = Polygon(ring["outer"], ring["holes"])
                        if not p.is_valid or p.area <= 0:
                            errors.append(f"{path.stem}/{feature['id']}")
                        count += 1
        self.assertGreater(count, 1000)
        self.assertEqual(errors[:25], [])

    def test_openings_follow_their_room_boundary_not_a_guessed_shortcut(self):
        model = json.loads((ROOT / "app/data/architectural-plans/last-supper.json").read_text())
        for opening in model["openings"]:
            space = next(s for s in model["spaces"] if s["id"] == opening["spaceId"])
            shape = unary_union([Polygon(p["outer"], p["holes"]) for p in space["polygons"]])
            gap = LineString(opening["segment"])
            self.assertGreater(gap.length, 0)
            self.assertEqual(gap.difference(shape.boundary.buffer(.01)).length, 0, opening["id"])


if __name__ == "__main__":
    unittest.main()
