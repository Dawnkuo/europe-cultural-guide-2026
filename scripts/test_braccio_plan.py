"""Validate the runtime semantic features with Shapely, not screenshot counts."""

import json
from pathlib import Path
import subprocess
import unittest

from shapely.geometry import Point, Polygon
from shapely.ops import unary_union


class BraccioPlanTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        result = subprocess.run(
            [
                "node", "--experimental-strip-types", "--input-type=module", "-e",
                'import {buildBraccioFeatures} from "./app/data/braccio-nuovo.ts"; '
                'console.log(JSON.stringify(buildBraccioFeatures()));',
            ],
            cwd=Path(__file__).resolve().parents[1],
            capture_output=True, text=True, check=True,
        )
        cls.features = json.loads(result.stdout)

    def test_semantic_polygons_are_valid(self):
        polygons = [feature for feature in self.features if "polygon" in feature]
        self.assertEqual(len(polygons), 63)
        for feature in polygons:
            with self.subTest(feature=feature["id"]):
                polygon = Polygon(feature["polygon"])
                self.assertTrue(polygon.is_valid)
                self.assertGreater(polygon.area, 0)

    def test_column_centers_have_floor(self):
        floors = unary_union([
            Polygon(feature["polygon"]) for feature in self.features
            if feature["kind"] == "floor"
        ])
        columns = [feature for feature in self.features if feature["kind"] == "column"]
        self.assertEqual(len(columns), 52)
        for feature in columns:
            with self.subTest(feature=feature["id"]):
                self.assertTrue(floors.covers(Point(feature["at"])))

    def test_niches_are_recess_floors_not_wall_or_courtyard_holes(self):
        walls = unary_union([
            Polygon(feature["polygon"]) for feature in self.features
            if feature["kind"] == "wall"
        ])
        niches = [feature for feature in self.features if "-niche-floor-" in feature["id"]]
        self.assertEqual(len(niches), 28)
        for feature in niches:
            with self.subTest(feature=feature["id"]):
                self.assertLess(Polygon(feature["polygon"]).intersection(walls).area, 0.000001)

    def test_no_elevated_slab_covers_the_stairs(self):
        floors = [feature for feature in self.features if feature["kind"] == "floor"]
        for stair in [feature for feature in self.features if feature["kind"] == "stair"]:
            for floor in floors:
                if floor["top"] > stair["top"]:
                    with self.subTest(stair=stair["id"], floor=floor["id"]):
                        overlap = Polygon(stair["polygon"]).intersection(Polygon(floor["polygon"]))
                        self.assertLess(overlap.area, 0.000001)


if __name__ == "__main__":
    unittest.main()
