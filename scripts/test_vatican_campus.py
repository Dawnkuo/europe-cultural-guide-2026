import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("campus", Path(__file__).with_name("generate-vatican-campus.py"))
campus = importlib.util.module_from_spec(spec)
spec.loader.exec_module(campus)


class ClassificationTests(unittest.TestCase):
    def test_overlapping_rois_do_not_punch_holes_in_buildings(self):
        first = [[0, 0], [4, 0], [4, 4], [0, 4]]
        second = [[2, 2], [6, 2], [6, 6], [2, 6]]
        mask = campus.union_rois((10, 10), [first, second])
        self.assertEqual(int(mask.sum()), 41)
        self.assertTrue(mask[2:5, 2:5].all())
        self.assertFalse(mask[7:, :].any())

    def test_classifying_an_area_twice_does_not_change_its_ink(self):
        region = [[1, 1], [3, 1], [3, 7], [1, 7]]
        once = campus.union_rois((10, 10), [region])
        twice = campus.union_rois((10, 10), [region, region])
        self.assertTrue((once == twice).all())


if __name__ == '__main__':
    unittest.main()
