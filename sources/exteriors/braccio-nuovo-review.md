# Braccio Nuovo Plan Cutaway

Local work, 2026-09-08. This is a partial architectural cutaway, **not** an
accepted reconstruction of the complete modern Vatican museum exterior.
The in-app scope note makes that limitation explicit. Nothing is published.

## Evidence

- Paul Letarouilly / Alphonse Simil, *Le Vatican*, 1882, volume 2,
  Chiaramonti plate 1, ETH e-rara canvas 7007829:
  https://www.e-rara.ch/i3f/v20/7007829/full/4000,/0/default.jpg
  Local `work/experience/vatican-compound-source/braccio-nuovo-plan-section-4000.jpg`;
  SHA256 `dab4b00eb641861c31be5f51692d312480692d0deb62d163cb0ea5ced96739a7`.
  Inspected the full plan, central transverse section, captions and both scales.
  Rotated 90 degrees to 5760x4000 without nonuniform resizing or perspective warp.
- Vatican Museums, modern gallery description:
  https://www.museivaticani.va/content/museivaticani-mobile/en/collezioni/musei/braccio-nuovo/Presentazione-Braccio-Nuovo.html
  Independently identifies the long gallery, 28 niches, central hemicycle,
  skylights and the opposing portico/stairs. Its stated 68m length is not used
  to nonuniformly stretch this historical drawing.
- Patrons of the Arts in the Vatican Museums, Bramante Courtyard project:
  https://www.patronsvaticanmuseums.org/restoration/projects/long-project
  The south-wall photograph was visually inspected, not just its caption:
  https://media.patronsvaticanmuseums.org/Production/media/__processed__/7b3/IMG_7559-916e1cf9dc6f.JPG
  Cached as `braccio-south-wall-pavm.jpg`. Confirms the eight-column porch and
  broad facade arrangement. It supplies **no measured heights**. The same
  project's modern roof/wall/hidden-balustrade paragraph concerns the EAST
  wall (Chiaramonti corridor), NOT the south Braccio Nuovo. It must not be
  cited as proof of a changed Braccio roof. Conversely it does not establish
  that every part of the1882 Braccio roof remains unchanged today.
- Vatican News, 2018 restoration interview:
  https://www.vaticannews.va/it/vaticano/news/2018-06/video-restauro-braccio-nuovo-cortile-pigna-musei-vaticani.html
  Supports the restrained pale travertine appearance, not surveyed material
  reflectance or a new source of architectural dimensions.

## Calibration And Claims

The data lives in `app/data/braccio-nuovo.ts`; the scene imports that data.
Coordinates below are in the rotated plate's native pixels.

| Claim | Source locator / treatment |
| --- | --- |
| Plan scale | Bar from (1427,2084) to (2289,2084), 24m: 35.9167px/m. |
| Section scale | Bar from (3304,2092) to (4164,2092), 12m: 71.6667px/m. Never reuse the plan's multiplier. |
| Independent width check | Porch width x2456..3118 gives 18.4316m against printed 18.42m; 0.0116m drawing residual. Not current survey accuracy. |
| Plan reference origin | (2790,2650), X along the gallery, source +Y towards the north portico. World Z is the opposite of source Y. |
| Wall bands / 28 recesses | Four separately traced rows of seven, source y2428..2876. Curved recesses are wall-edge boundaries, not drawn statues. The east/west traces retain the small graphic differences in this plate. |
| Central hemicycle | Source centre (2790,2350), inner radius180px, outer radius244px; regularized arc fit to the historical drawing. |
| Eight porch columns | Individually recorded centres at y3077, x2480..3093. Not synthesized from a generic facade recipe. |
| Gallery / central columns | Individually sampled rows and central/hemicycle groups. 52 total columns in this cutaway, including the eight porch columns. Carved capitals are not reproduced. |
| Heights | Section datum y1705, gallery cornice y1110, porch floor y1520, column capital y900, entablature top y740. These are drawing-derived profiles with pixel-picking uncertainty, not modern measured dimensions. |
| Stair representation | Two plan-visible flights and a turning landing. Equal intermediate height split and evenly spaced risers are explicitly **display interpolation**, not a surveyed riser schedule. No walking/accessibility route is inferred. |
| Floor slab / column bases | Slab thickness and simplified base/capital envelopes are display treatments. Floor outlines and column centres come from the plan. |
| Open roof | Roofs, vault profiles and skylights are omitted pending contemporary geometry reconciliation; no flat cap or invented pitched roof. |

The scene normalizes the model to20 viewer units. That transform is stored as
`displayScale`, never written back into source pixels or claimed as campus
registration. It has no invented artwork pins or inter-building routes.

## Explicit Gaps

- Whole-compound registration, adjoining library/long wings and their modern
  elevations are not reconstructed here. The detailed2D campus overview stays
  available separately with its original reviewed visitor-plan bindings.
- Stair shafts at the sides and east end, small pilasters, exterior trim,
  sculpted capitals, niches' upper closures and masonry ornament are not yet
  modeled. Do not interpret this cutaway as all architectural details complete.
- Neither historical statues nor floor mosaic images become 3D wall geometry.
  The interior work catalogue and accurate room bindings are unchanged.
- Missing roofs are not represented by a solid box. The old unsupported
  seven-part Vatican recipe is no longer used by this local Vatican renderer,
  but a single-building cutaway does **not** satisfy the whole-exterior goal.

## Verification

`braccio-nuovo-model.test.ts` checks separate scales, the independent porch
width, feature IDs/counts, finite batched geometry, normalized bounds, focus
regions and open gallery/porch rays. `BraccioNuovoPlan` uses the same features
without WebGL, omitting overhead entablature from its floor-level cut.
`scripts/qa-braccio-nuovo.mjs` checks four viewport widths, all focus ranges,
nonblank canvas pixels, keyboard, dragging, resize-safe full-width layout,
interior2D return, repeated remounting and blocked-WebGL retention.

Final local export `82f342d5f8fade084505` passes the focused four-width suite,
including initial/reset frame equality, responsive resize, emulated pinch,
offscreen suspension, real context loss/retry and blocked-WebGL fallback.
`work/experience/braccio-nuovo-production-final/report.json` has no page errors.
The all80route offline suite passes this same export, including first-open
Braccio geometry and SVG on both Vatican routes. The broader148case suite
passed the preceding `d82b149c4eae06aa77fe` export before the Braccio-only
responsive framing change. Exact report paths are in the progress log.

Four independent Shapely checks are reproducible:

```sh
/tmp/europe-guide-map-runtime/bin/python scripts/test_braccio_plan.py
```

All63polygons are valid, all52column centres have floor, all28niche floor
polygons are separate from wall solids, and no high slab covers the stairs.
These are geometric consistency checks, not certification of modern survey
accuracy, completion of fine details or acceptance of the whole compound.
