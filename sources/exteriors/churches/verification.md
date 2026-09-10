# Church Exterior Batch: 2026-09-10

## Delivered Scope

- Nine new recognizable exterior massings: Santa Maria delle Grazie, San Marco, Florence Cathedral with detached Giotto tower, Pisa Cathedral, Pisa Baptistery, Barcelona Cathedral, Santa Maria del Mar, Cologne Cathedral, Notre-Dame de Paris.
- Approved Milan massing carried over without changing building vertices. Geometry hash remains `a6583e90afcfd4d05f24bf76db15ffc586c52ac7efa8749d2fc8deb06c304a40`.
- Existing Pantheon and Sagrada massings carried over. Pantheon raking cornice corrected from smooth interpolation to two straight segments.
- Existing official St Peter exterior retained without rebuilding its geometry.
- Twelve local GLBs integrated into `GuideExteriorScene`; St Peter keeps its dedicated existing loader. Indoor plans, 2D entry default, route order and ticket data unchanged.
- Shared local pale marble applied selectively to marble/trim; no displacement. Brick, lead, sandstone and terracotta retain their own palettes.
- Same-model orthographic SVG fallback generated for the twelve massing assets. St Peter retains its existing static fallback.

## Verification Performed

- Full Vitest run: **68 files / 871 tests passed**.
- TypeScript: `npx tsc --noEmit --pretty false` passed.
- Scoped Oxlint on new geometry, exporter, registry, loader and tests passed.
- `npm run build:github` completed locally: 81 routes prerendered. No GitHub push or remote deployment.
- Both updated skills passed `quick_validate.py`: `building-schematic-destination-maps` and `building-production-cultural-guides`.
- CUA browser screenshot review: 13 buildings at 1440 x 1000 in oblique, top, front and side views, plus 13 at 390 x 844: **65 screenshots**. Each has non-background model pixels, minimum lit fraction 0.0942 within the checked model crop. No horizontal page overflow.
- Main site: all twelve registry-backed guide pages opened at 390px width, switched to exterior and verified against `canvas[data-model]`. Eleven used the loaded local texture; Cologne used its stone/lead palette. No browser console errors in that integration pass.
- Cologne and Florence indoor default 2D directly checked in browser; all reviewed indoor entry defaults also covered by the existing parameterized tests.
- Keyboard rotation changed camera coordinates; pointer drag changed coordinates; zoom and reset captured as separate screenshots. Four view controls operated for every preview model.
- New geometry has finite positions, normals and UVs, distinct hashes and fewer than 30,000 triangles per new building. Retained Sagrada and St Peter are heavier and are not described as new low-poly assets.
- Texture-load failure and interrupted-load cleanup tested; shared texture disposal tested. A missing decorative image does not discard geometry.

## Limits

These are structural exterior illustrations with documented anchors and approximate secondary dimensions. `source-manifest.json` records plan relationships, dimensional conflicts and omitted detail. They are not traced surveyed meshes, full indoor reconstructions or wayfinding data.

Mobile checks use an in-app browser viewport on the development computer, not a physical phone. Sustained physical-device FPS and real multi-touch pinch were not measured. CUA pointer dragging and keyboard zoom were tested; this report does not substitute those for a true touch-device test.

Local development does not register the production service worker. The generated GLBs, SVGs and texture are included by the production asset precache generator; an entire-site offline download was not repeated in this exterior-only batch. Existing chunk-size and test-environment canvas warnings remain, with no failed tests or build errors.

QA images and machine-readable checks are in `../../../../outputs/church-exterior-qa/` relative to this directory.
