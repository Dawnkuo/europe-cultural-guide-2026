# Europe Guide Media Audit

## Scope

- Reviewed the original 365 local raster files using 19 contact sheets, then opened suspect originals and replacement candidates for subject, framing and clarity inspection.
- Production output contains 397 image occurrences across 78 image-bearing pages, using 241 distinct local images. This is separate from the larger on-disk asset inventory, which also includes unused imported Vatican material.
- Replaced 72 media references: 59 newly acquired selections and 13 substitutions using reviewed existing local images. The resulting local raster inventory contains 437 decodable files. Original assets were retained; rejected intermediate review copies were removed.
- Did not change itinerary ordering, dates, times, ticket contents or bookings. Existing architectural-map migration changes were left intact and were not deployed.

## Corrections

- Replaced the distorted Casa Batllo lightwell photograph with a clear view of the actual lightwell; replaced the incorrectly matched attic photo with the white catenary arches.
- Corrected wrong buildings, objects and viewpoints, including the Pisa cathedral facade, Cologne Three Kings shrine, Spanish Steps fountain, Scala dei Giganti, La Pedrera attic, Rialto market and Vatican Grottoes.
- Distinguished St Mark's original bronze horses from the exterior copies, and current Vasari Corridor presentation from the old picture gallery or the Uffizi's unrelated ceiling.
- Replaced the Vatican post-office van with the newer building and used identified stamp/postmark examples without implying visit-day stock or availability.
- Replaced small primary images for the St Mark's Genesis cupola, Piazza della Signoria David copy, Notre-Dame's new oak staircase and Museum Ludwig's Picasso Harlequin.
- Restored the Scala museum/evening image ordering to match the merged chapter's six highlights. The historical Nabucco playbill is a revival announcement, not the March 9 world premiere announcement; corrected that misleading caption while retaining premiere context.
- Used an explicitly identified historical double-shell structural diagram for Florence's dome rather than an unrelated workshop photo. It is not represented as a current measured plan.
- Retained intentional shared views only when one real view illustrates multiple details of the same object/building, such as Giunti Odeon's movable bookcases and upper cinema seating.

## Rendering

- Highlight images retain their intrinsic aspect ratio and decoded width/height; no forced enlargement, fixed-height cover crop or stretched media column.
- Image height is bounded at 640 CSS pixels, or 520 on phones; narrow layouts place both image and text in the content column below the index.
- Lazy loading and asynchronous decoding are enabled. Decorative hero/index cover framing is separate from the uncropped highlight image.

## Verified

- All 437 local raster files decoded successfully.
- All 241 actively rendered images have a long edge of at least 640 pixels. This threshold detects small thumbnails; it is not a substitute for visual quality inspection.
- All 72 replacements are actually referenced by production HTML and match their reviewed SHA-256 hashes in both public assets and production output.
- All 397 rendered image occurrences resolve to local production files; every distinct image is included in the offline asset manifest.
- `npx vitest run`: 32 files, 195 tests passed.
- `npm run lint`: passed.
- `npm run build:github`: passed, 81 prerendered routes, none skipped. Existing large-chunk warning remains.
- `git diff --check`: passed.
- HTTP smoke check of `http://localhost:55838/guides/casa-batllo/`: 200, reviewed lightwell path present, rejected path absent.

## Not Yet Verified

- Desktop/portrait/phone browser screenshots and live layout inspection: blocked because macOS is locked and the browser tool cannot unlock it. The user has been asked to unlock it.
- Actual offline refresh and image decoding in the browser: not run. Manifest membership is verified, but is not reported as a successful offline browser test.
- Public-host verification: not run; no commit, push or deployment was performed. The wider architectural-map migration is not declared release-ready.

## Reproduction And Evidence

- `baseline-inventory.json` and `baseline-usage.json` preserve original filenames, hashes and page uses.
- `replacements-applied.json` records downloaded media URLs, source pages and inspected hashes; `local-replacements-applied.json` records the existing source assets and reasons for substitution.
- `validation.json` contains the latest production-image counts, offline-manifest revision and validation failures.
- Image-dimension audit: `work/map-venv/bin/python scripts/generate-media-dimensions.py` (OpenCV runtime described in `scripts/map-requirements.txt`).
- After the production build: `node scripts/audit-media-usage.mjs`, then `node scripts/validate-reviewed-media.mjs`.
- Internal records do not add a public sources/copyright section to the guide.
