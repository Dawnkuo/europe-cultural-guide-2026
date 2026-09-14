"""Run with the pinned map runtime; validates source tracing, not model fidelity."""
import importlib.util
from pathlib import Path
import unittest

import numpy as np
from shapely import contains_xy

spec = importlib.util.spec_from_file_location("vatican_trace", Path(__file__).with_name("trace-vatican-compound-source.py"))
trace = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trace)


class PixelTraceTests(unittest.TestCase):
    def check_round_trip(self, mask):
        parts = trace.pixel_polygons(mask)
        y, x = np.indices(mask.shape)
        covered = np.zeros(mask.shape, dtype=np.uint8)
        for part in parts:
            covered += contains_xy(part, x + 0.5, y + 0.5)
        np.testing.assert_array_equal(covered, mask.astype(np.uint8))
        self.assertTrue(all(part.is_valid for part in parts))
        self.assertEqual(sum(part.area for part in parts), mask.sum())
        return parts

    def test_isolated_pixels_and_corner_contacts_are_not_discarded(self):
        mask = np.eye(9, dtype=bool)
        mask[0, -1] = True
        self.assertEqual(len(self.check_round_trip(mask)), 10)

    def test_courtyard_holes_are_not_filled(self):
        mask = np.ones((13, 17), dtype=bool)
        mask[2:11, 3:14] = False
        parts = self.check_round_trip(mask)
        self.assertEqual(len(parts), 1)
        self.assertEqual(len(parts[0].interiors), 1)

    def test_narrow_gaps_and_connected_strokes_remain_exact(self):
        mask = np.zeros((19, 25), dtype=bool)
        mask[:, 3] = True
        mask[:, 5] = True
        mask[8, 3:19] = True
        mask[10, 3:19] = True
        self.check_round_trip(mask)

    def test_empty_input_is_valid(self):
        self.assertEqual(self.check_round_trip(np.zeros((4, 6), dtype=bool)), [])

    def test_asymmetric_shape_keeps_source_axes(self):
        mask = np.zeros((11, 29), dtype=bool)
        mask[2:6, 7:23] = True
        mask[6:9, 7:10] = True
        parts = self.check_round_trip(mask)
        self.assertEqual(parts[0].bounds, (7, 2, 23, 9))


if __name__ == "__main__":
    unittest.main()
