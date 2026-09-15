# Production Resource Cleanup

## Scope

- The eight-candidate online model trial route is archived outside `app/` at
  `experiments/model-preview/page.tsx`. Its source and licensing catalog remain
  available, but its page and viewer chunks are not shipped.
- Production guide exteriors always use the local renderer with OSM context.
  The retired remote-trial configuration and renderer branch were removed.
- Export cleanup removes unreferenced editorial images and legacy font files,
  and verifies byte identity before removing the duplicate base-path `_next` copy.
- Source media is retained. Nothing under `public/models`, `public/maps`,
  `public/map-data` or `public/textures` is pruned or changed. Attribution and
  evidence files are retained, including files not needed at runtime.

## Measured Export

Local production builds compared with the preceding `bf8f7de` release:

| Measure | Before | After |
| --- | ---: | ---: |
| Export files | 1,574 | 1,057 |
| Export size, decimal MB | 570.90 | 473.12 |
| Precached assets | 1,289 | 891 |
| Precached asset size, decimal MB | 513.48 | 462.30 |

Cleanup removes 180 unreferenced images (40.41 MB), 212 unused font files
(10.75 MB), and 112 duplicate build files (46.49 MB). Removing the trial route
and its bundles accounts for the remaining export difference. HTML routes,
RSC payloads, model fallback images and spatial resources remain available.

## Guardrails And Verification

- `prune-production-resources.test.ts` covers static and dynamically assembled
  image URLs, lazy data, stylesheet fonts, service-worker-only assets, manifest
  icons, preserved spatial files, duplicate mismatch failures and trial leaks.
- Export cleanup scans all app source/data except test files and the image-size
  index, then cross-checks rendered routes, CSS, public scripts and the manifest.
  It regenerates the precache only after removal. The removal report stays under
  `work/production-cleanup/pruned.json`, outside the deployed artifact.
- Lint, TypeScript and 1,250 tests passed. The existing indoor acceptance gate
  remains 47/47, comprising 42 source-derived plans and five evidence limitations.
- All 80 production routes passed real Chromium offline refresh checks, including
  lazy indoor maps, reviewed entrance floors, room labels and rendered images.
- `qa-production-resources.mjs` independently decoded all 462 catalog/gallery
  images offline and verified 207 spatial assets against their original bytes.
  It also tested stale-cache eviction, removed-resource exclusion and `/models/`
  returning 404. It waits for actual worker activation before disconnecting.
- Detailed geometry fidelity is not re-certified by resource cleanup. No model
  quality reduction, route redesign, itinerary edits or source-media deletion
  is part of this change.

Reproduce with `npm run build:github`, `node scripts/qa-production-resources.mjs`
and `node scripts/qa-architectural-offline.mjs`. Browser reports and screenshots
are written under `work/production-cleanup/` when the corresponding output
environment variables are supplied.
