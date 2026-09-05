import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("fetch_plans", Path(__file__).with_name("fetch-plan-sources.py"))
fetcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fetcher)


class PlanAcquisitionTest(unittest.TestCase):
    def test_missing_manifest_does_not_abort_the_inventory(self):
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(fetcher.acquire("unmapped", Path(directory)),
                             [{"slug": "unmapped", "status": "no-existing-source-manifest"}])

    def test_failed_candidates_are_recorded_and_not_saved_as_plans(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            folder = root / "app/data/floorplans"
            folder.mkdir(parents=True)
            (folder / "museum.json").write_text(json.dumps({"sourceManifest": [{"url": "https://example.invalid/plan.pdf"}]}))
            with patch.object(fetcher.urllib.request, "urlopen", side_effect=OSError("unavailable")):
                result = fetcher.acquire("museum", root)
            self.assertEqual(result[0]["status"], "request-failed")
            self.assertFalse((root / "sources/floorplans/museum-candidate-1.pdf").exists())


if __name__ == "__main__":
    unittest.main()
