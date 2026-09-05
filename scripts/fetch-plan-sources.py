"""Acquire candidate plans for review, never promote downloads to verified maps."""
import argparse
import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def acquire(slug, root=ROOT):
    folder = root / "sources/floorplans"
    model_path = root / f"app/data/floorplans/{slug}.json"
    if not model_path.exists():
        return [{"slug": slug, "status": "no-existing-source-manifest"}]
    model = json.loads(model_path.read_text())
    candidates = [s for s in model["sourceManifest"] if ".pdf" in s["url"].lower()]
    if not candidates:
        return [{"slug": slug, "status": "no-pdf-candidate-in-existing-manifest"}]
    results = []
    for index, candidate in enumerate(candidates):
        target = folder / f"{slug}-candidate-{index + 1}.pdf"
        record = {"slug": slug, "url": candidate["url"]}
        try:
            cached = target.exists()
            if cached:
                data = target.read_bytes()
            else:
                request = urllib.request.Request(candidate["url"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(request, timeout=30) as response:
                    data = response.read()
            if not data.startswith(b"%PDF"):
                raise ValueError("Response is not a PDF")
            if not cached:
                folder.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
            record.update(status="cached-unreviewed" if cached else "downloaded-unreviewed",
                          file=target.name, bytes=len(data), sha256=hashlib.sha256(data).hexdigest())
        except Exception as error:
            record.update(status="request-failed", error=str(error))
        results.append(record)
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("slugs", nargs="+")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    records = []
    for slug in args.slugs:
        for record in acquire(slug):
            print(json.dumps(record, ensure_ascii=False), flush=True)
            records.append(record)
    if args.report:
        args.report.write_text(json.dumps({"scope": "Existing PDF candidates only; not an exhaustive source search.",
                                           "records": records}, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
