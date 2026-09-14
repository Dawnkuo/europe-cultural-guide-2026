# Local Cultural Guide Upgrade

## Delivery Boundary

Work locally from the published d62bb2d baseline. Preserve the original dirty
checkout. Do not push, deploy to GitHub/Sites, change tickets, or reorder the
journey. The user reviews the complete local result after verification.

## Acceptance Matrix

| Requirement | Work | Evidence required |
| --- | --- | --- |
| Artwork to room and room to artwork | Implemented; no invented object positions | Canonical reviewed bindings; real browser round trips; known room vs department-area precision |
| On-site guide with images and map | Implemented; representative deep interactions verified | Current work, current room, next stop and persisted progress tested on desktop and phone |
| Collection breadth and interpretation | In progress,96 enriched works;332 still short |428 total catalog subjects; counts are not a substitute for object-level review |
| Map coverage | Pending | Inventory every missing/partial floor and stop; research St Peter upper levels and Casa modern visit spaces; exact limitations where evidence remains absent |
| Indoor 2D reading and interaction | Shared readable drawing, fixed-size labels, overview and physical-point focus implemented | Latest606 browser cases cover42 existing models/101 floors at1440,390,320 and1x/4x; this does not complete missing source geometry |
| Indoor 3D quality | Renderer improved; visual review in progress | Same verified 2D geometry, readable low walls/surfaces, selected-room focus, visible stacked floors and interactive controls |
| Exterior 3D quality | Six improved venue treatments: four source-derived reconstructions plus one official compound shared by two chapters; remaining68 still need work | Distinct recognizable venue geometry and materials; framing, pixels, keyboard/touch and mobile performance checks |
| Browsing and practical information | Browsing implemented;20 reviewed visitor topics and17 FAQs added for four Vatican chapters; other70 chapters still need this review | Floor/room facets, year/priority sorting, canonical itinerary links, persistent checklist, source-reviewed visitor advice and working map links |
| Offline controls | Implemented; local production offline suite passed | Progress, inventory status, retry, mobile visibility; real offline unvisited deep links and assets |
| Regression and local delivery | Pending | Full test/build suite; every guide and major route inspected; stable local production URL; no public deployment |

## Preserved Contracts

- Indoor maps default to 2D and the reviewed arrival floor, not the first tab.
- Manual floor selection survives view changes and reset.
- All documented room IDs remain available; service layers can be toggled.
- Highlights remain continuous, without paging or a required load-more action.
- Navy/black/gold UI and the recently assigned city colors remain intact.
- No restored homepage booking warnings or public provenance clutter.
- Same venue remains one chapter; no alternate optimized itinerary replaces the existing one.

## Baseline Notes

The original checkout has ten app files differing from the published baseline.
These include more explicit partial-map/shared-floor notices and Cologne ground
surface work. Review and integrate relevant changes without overwriting that
checkout. The reference comparison artifacts are under
`/tmp/europe-booking-release.RHSavN/site/work/reference-comparison`.

No acceptance item is complete merely because a component compiles or a count
matches. Update this file with concrete test and browser evidence as work lands.

## Current Evidence

- Separate local worktree and development preview: port 55910. No public release.
- All 42 architectural plans have been reviewed for explicit work/sequence joins.
  Missing object positions remain absent. Picasso Barcelona has a plan but no
  verified current object-room assignments; Koln Triangle has no rooftop plan.
  Neither receives fabricated locations. Internal notes are in
  `sources/collections/experience-bindings.md`.
- Shared work dialogs, floor/room browsing, map links, room collections, linked
  sequences, and the on-site guide are implemented. All74 guides passed a
  desktop/phone browser pass (148 cases), including a fresh full rerun after
  the latest collection additions and shared-dialog correction.
  Explicit room bindings cover40 indoor venues; the two exceptions above remain
  honest absences, not generic fallbacks.
- Before these additions,48 files/572 tests, typecheck, lint and the local
  GitHub-format production build passed. The latest full rerun caught missing
  intrinsic dimensions for newly acquired images; the decoded size index was
  corrected. Full rerun then passed48 files/589 tests; typecheck, lint and local
  production build passed. Expected JSDOM canvas/localStorage notices are not
  evidence of browser WebGL behavior; browser tests cover that separately.
- Full local-production offline QA passed 80 routes (six primary pages and all
  74 guides), including unvisited deep-link refresh, local media, all indoor floor
  numbers and 2D/3D controls. Report: `work/experience/offline/report.json`.
  A later retry suite passed actual503 failure, UI retry, complete cache count,
  offline version-query variants, unvisited detail images and lazy zoom module.
  The preceding retry suite passed against revision140628d06ee291037d20 with1093
  resources, including six newly added subjects' large images, the triptych's
  reverse face and the image-zoom module, all first opened while offline.
  Full80-route offline regression passed against this revision with zero missing
  precache resources, including every guide, all documented floor labels,
  reviewed entry defaults, 2D/3D switching and local image decoding.
- Sagrada Familia, Casa Batllo and Pantheon now use distinctive batched geometry
  from reviewed elevations/diagrams. They passed phone/desktop canvas and
  keyboard checks. Pantheon has8+4+4 portico columns and an actually open oculus,
  including a ray-test. These three do not establish completion for the others.
- Removed evenly sampled, invented exterior stop pins/routes. The complete
  existing stop text remains, without falsely claiming precise positions.
- Colosseum is still pending, not a fourth accepted exterior. Obtained and
  visually inspected the2006 Coccia et al. paper, including Rea2002's current
  first-level plan. A reproducible review-only extraction yields176 polygon
  parts,40 logged topology repairs and38 unclassified small components.
  An isolated arcade study passes3 unit tests and1440/390 browser pixels/mouse
  orbit checks, but lacks current-wall reconciliation, radial supports, cavea
  and hypogeum. It is not imported by the application and has not replaced
  the local or published guide. Details: `sources/exteriors/review.md`.
  After these isolated study files, the full suite passed49 files/592 tests;
  typecheck, lint and `git diff --check` passed. Local port55910 returned200.
  The application bundle was unchanged, so the production/offline evidence
  above remains tied to140628d06ee291037d20, not a newly claimed build.
-68 catalog subjects now have reviewed background and distinct visual observations;
  several include verified multi-image galleries and archive fields. Fullscreen
  image viewing uses react-zoom-pan-pinch4.2.0, lazy loading, native dialogs,
  uncropped images,1-5x scale, keyboard control and focus restoration.
  Browser QA passed1440x960,390x844 and844x390; the latter two include CDP
  two-finger pinch and one-finger drag, not merely mouse tests on a narrow screen.
  This is emulated touch, not physical phone/Safari verification.
- Vatican now has44 subjects, including18 additions appended after the
  original26. IDs and itinerary order remain unchanged. Latest completed
  deep-link/detail/zoom/map/room round-trip QA passed22 subjects at two widths,
  including Angelico's long Chinese title, department-area bindings and explicit
  missing-map states for Salone Sistino and the separate lower necropolis.
  A new hash-linked work no longer inherits the previous dialog's scroll/focus.
  The shared behavior has a unit regression and browser opening-position checks.
- Reference correspondence is explicit for all45 subjects in
  `sources/collections/reference-coverage.json`. Latest audit:45 topics present,
  with45 passing the separate enrichment check. Composite reference subjects
  require every constituent work to exist and be enriched, not just the first.
  A matching title is not a completeness result. The Egyptian record covers two
  particular funerary objects, not the entire department or promised mummy display.
- Reference media audit rejects watermarked photos,100-150px thumbnails and
  unrelated gallery photos. Clean full Nile, two Stefaneschi faces, Deluge,
  Libyan Sibyl and Angelico images are local. Triptych missing panels and fresco
  damage remain visible; no invented restorations. Provenance and visual review
  are internal in `sources/collections/interpretation-review.md`.
- Grottoes highlight scope corrected: Grotte Vaticane is not the deeper Roman
  necropolis. Existing ID/photo/grottoes binding retained; no fabricated lower
  floor or claim that current reservations include the separate Scavi visit.

## Previous Collection Verification

-49 files/606 tests, typecheck and lint passed after the ten-subject addition
  and dialog-scroll correction. Production export completed locally at revision
  `1e31c781ebf4d7b19a1c`; nothing was committed, pushed or deployed.
- Eleven newly acquired photographs were decoded, visually reviewed and matched
  to their recorded SHA256 values. Corrected subjects and rejected source
  alternatives are recorded in `sources/collections/interpretation-review.md`.
- Retry/offline suite passed against this revision with1104 cached resources.
  It first opened16 added subjects offline, including the new ten; it also
  decoded second views of the triptych, Momo stair and Djedmut coffin offline.
- Full80-route offline regression passed this revision with no missing precache
  resources. Every indoor guide opened in2D at its reviewed arrival floor and
  passed3D switching, canvas pixels and all-floor label/route-number checks.
- Full74-guide desktop/phone regression passed148 cases after the final
  shared-dialog change, with no page errors or horizontal overflow. It checked
  images, indoor2D defaults, exterior canvas pixels/keyboard controls, work and
  sequence dialogs, on-site mode and practical checklists. This validates
  operation, not the architectural fidelity of the71 pending exterior models.
  Current screenshots/report: `work/experience/site-review`.
- Image-viewer regression also passed desktop1440x960, phone390x844 and
  landscape844x390, including nested dialogs, focus return, second photographs
  and emulated two-finger pinch/one-finger pan. Physical-device testing remains
  outstanding; browser emulation is not recorded as real phone performance.

## Previous Twenty-Subject Verification

- Twenty existing Vatican, St Peter and square subjects now have separately
  reviewed background, observations and archive fields. The inventory remains
  417 subjects across74 guides, including44 Vatican subjects; no duplicated
  venue, route or booking was created. Reference interpretation audit45/45.
- Seven new local photographs were decoded, individually viewed and hash
  checked. Full Chair/Baldachin/Alexander views replace poor compositions;
  dome ribs, lower drum and lantern photographs have distinct honest captions.
- AlexanderVII now joins existing map feature42 after checking pages15/16
  of the pinned Churches of Rome PDF. No geometry or source anchor changed.
- Full suite passed49 files/631 tests, typecheck, lint and `git diff --check`
  after the shared-dialog corrections. Production export completed locally at
  revision `f60bfc876bd754b11b1a`; nothing was committed, pushed or deployed.
- A failing unit regression exposed delayed native close notifications clearing
  a newly reopened work. Reopened dialogs now ignore the earlier notification;
  Escape follows the same controlled close path. Actual browser close/hash
  switching passed72 cycles across desktop, portrait and landscape. The browser
  test does not claim its timing reproduces every possible original event order.
- Screenshot review found unspaced observations and a floating close control
  covering scrolled copy. Decimal markers,1.8 line height and14px item gaps now
  separate observations; an opaque full-width sticky toolbar contains the close
  button. Scrolled phone reading, toolbar hit testing and focus were checked.
- Full74-guide desktop/phone regression passed148 cases after the final toolbar
  change, with no page errors or horizontal overflow. Map2D defaults, all images,
  exterior pixels/keyboard, work dialogs, sequence links, on-site mode and
  practical checklists passed. Report: `work/experience/site-review/report.json`.
- Detail/zoom/map round-trip checks passed42 subjects at1440/390 widths (84
  cases). Missing precise map locations remain explicit; an unavailable room is
  not fabricated to make a round-trip assertion pass.
- Viewer checks passed1440x960,390x844 and844x390, including nested dialogs,
  focus return, second photographs and emulated pinch/pan. Latest reading and
  interaction screenshots: `work/experience/artwork-images`.
- Full80-route offline refresh passed revision `f60bfc876bd754b11b1a`, with
  zero missing precache entries. Every indoor map retained its entrance default,
  all documented floor/room labels, route numbers and2D/3D switching. The retry
  suite passed an intentional503, UI retry and1111 cached resources, plus36
  first-opened-offline works and their available alternate photographs.
- Local preview `http://localhost:55910/` returned HTTP200 after verification.
  Tests used temporary headless Chrome profiles. Native user-browser access was
  unavailable while the Mac was locked; no physical-phone/Safari verification
  or user acceptance is claimed.

## Current Thirteen-Subject Verification

- Expanded the remaining five existing Vatican and eight St Peter records with
  separate background, three/four visual observations and reviewed attribution.
  The catalog stays417 subjects, including44 Vatican and15 St Peter subjects;
  no visit order, bookings or map geometry changed. Reference correspondence
  remains45/45, which is not full museum collection coverage.
- Six replacement/context photos passed individual visual/hash review. Added a
  seventh photo after finding a clear narthex long-axis view by Sean Da Ros
  (CC0,2019); the vault detail is now the second image, not a space overview.
  The historical photograph's barriers are not current access instructions.
- ClementXIII and GregoryXIII join existing plan features28 and15 after visual
  inspection of the pinned plan and legend. Lantern-platform geometry remains
  unavailable and is not replaced with the indoor dome's ground projection.
- Before the seventh photograph,49 files/647 tests, typecheck and lint passed.
  Revision `08e7acc7aae6bcd87a2d` passed the local production build,55 subjects
  at two browser widths (110 detail/photo/map-round-trip cases),80 offline
  routes with no missing precache entries, and an intentional503/retry test
  caching1117 resources.49 works and their alternate photos were first opened
  offline successfully. These results belong to that revision, not subsequent
  media edits.
- Final local export revision `da926a50c8d470f06d9e` includes the seventh photo,
  acquisition-manifest preservation and the controlled-dialog correction below.
  All50 test files/650 tests, typecheck, lint and production build passed.
- The final offline retry exposed a distinct close/hash ordering failure: an old
  native close event could clear the next work URL before its hashchange handler
  had reopened the dialog. A deterministic regression failed before the fix.
  Removed the native close-to-state feedback; buttons and cancelled Escape now
  own close transitions, while the effect drives native visibility one-way.
  Both before-hashchange and after-reopen regressions pass. Evidence:
  `work/experience/hash-close-regression.log`.
- Final shared-component regression passed all74 guides at1440/390 widths
  (148 cases), with no page errors or horizontal overflow. This checks rendering
  and interaction, not architectural fidelity of the unfinished exteriors.
- Detail/photo/map checks passed55 subjects at both widths (110 cases), including
  both narthex views. Image-viewer checks passed three viewports,72 rapid reopen
  cycles and emulated pinch/pan. Physical touch/Safari remains unverified.
- Final80-route offline refresh passed with no missing precache entries.
  Intentional503/retry recovery cached1118 resources;49 works and available
  alternate galleries were first opened offline successfully, without errors.
  Reports under `work/experience/offline` and `work/experience/offline-retry`
  both record revision `da926a50c8d470f06d9e`.
- The acquisition manifest retains31 visually reviewed output records with
  matching local hashes. Subprocess regressions verify that an interrupted full
  acquisition keeps previous records and that changed output invalidates old
  visual acceptance. No artifact was committed, pushed or published.

## Explicit Reference Gaps

### Whole-Compound Source Pass

- Reopened the live reference and compared its compound interaction, work
  detail and practical sections with the local implementation. The current
  difference matrix is `docs/reference-comparison-2026-09-08.md`; it separates
  existing features, actual unfinished work and reference details that must
  not override the user's itinerary or evidence requirements.
- Obtained and visually inspected the official whole-state plan and a 2012
  architectural-superintendence publication. The former gives the compound's
  planar context; the latter only includes a small Belvedere elevation detail.
  Public survey descriptions do not supply the complete museum 3D geometry.
- Added a pinned-source, reproducible colour-ink extraction with five passing
  tests. All445,654 selected source pixels survive in valid vectors, with an
  independent pixel-centre round trip yielding zero differences or overlaps.
  The1,028 fragments and398 holes are NOT buildings or rooms. Number badges,
  text, cutaways and non-orange colonnades still need semantic reconciliation.
  The extraction remains internal, not imported into the app. Full review:
  `sources/exteriors/vatican-compound-review.md`.
- This turn is research/extraction progress, not a finished exterior or a
  release. No app, booking, route or deployment change; previous application
  QA remains tied to91f5a8b5994031be3c90. The69 exterior,40 map-scope and349
  interpretation gaps remain open rather than being relabelled complete.

### St Peter Exterior Batch

- Found and inspected the public basilica viewer's actual GLB, not only its
  rendered overhead pictures. Extracted the separate exterior subtree into one
  local7.1MB asset. It retains every684,737 vertex and501,503 triangle, plus
  source normals and vertex colors. Source/output decoded byte hashes match.
  No hand-sampled colonnade positions or generic dome boxes remain on the two
  St Peter exterior pages. The preliminary hand reconstruction now lives only
  under `sources/exteriors/studies`, explicitly superseded and not imported.
- Basilica and square chapters share this model. Their default exterior framing
  selects the respective venue; whole-compound and other-region views remain
  available. Phone canvas height is capped at480px and the square has a higher
  viewing angle. Model loading is deferred until the exterior is opened, stops
  abandoned fetches, and disposes abandoned decoded geometry. The model pauses
  when out of view or when the page is hidden.
- Added a static local snapshot from the same mesh and an explicit retry action.
  GLB assets now join precaching and build-revision hashing. The basilica's
  native interior still opens at its reviewed2D entrance floor; indoor topology,
  guide sequence, collection records and bookings were not changed in this batch.
-52 files/656 tests, typecheck, lint and the final local export build pass.
  Four phone/portrait/desktop widths (320,390,820,1440) passed region selection,
  default focus, pixels, keyboard and mouse controls, visibility suspension,
  interrupted loading, static failure fallback, retry and return to2D.
  These are Chromium viewport tests, not proof of physical touch or phone30FPS.
- Final export `91f5a8b5994031be3c90` passes all74 guides at1440/390 widths
  (148 cases, no page errors or overflow) and all80 offline routes, with zero
  missing precache resources. Both St Peter exterior models were first opened
  while offline and retained their region controls. Reports:
  `work/experience/st-peters-source/full-production-final` and
  `work/experience/st-peters-source/offline-complete`.
- Forced WebGL context loss now shows the static fallback; retry replaces the
  lost canvas, not just the renderer on that same canvas. The final production
  test passed this recovery at1440/390,12 independent exit/context-release
  cycles, and CDP-emulated two-finger zoom followed by region selection.
  Headless Mac Chrome sustained about60FPS over180 sampled frames at each
  viewport (p95 about16.7ms;501,505 rendered triangles including the ground).
  This does not establish physical-phone30FPS or Safari performance. Report:
  `work/experience/st-peters-source/performance.json`.
- The download-failure/retry and49 unvisited-work gallery suite passed the
  preceding5f4d294deb1b173504f4 export with1120 cached resources and no errors.
  The subsequent change is renderer context-loss recovery, not worker/cache
  logic; full offline refresh was repeated on the final revision above.
- A preceding live-dev sweep passed147/148 cases with one Fenice desktop
  renderer timeout. Its screenshot showed the failure fallback; the cause was
  not captured and is not dismissed as an assumed HMR problem. Both immutable
  production reruns passed that case and the whole148-case sweep. One full unit
  run also hit the existing5-second lazy-module-test timeout during a concurrent
  build; the same complete suite passes unchanged with `--maxWorkers=2`.
- This repairs two exterior chapters, not all remaining69 exteriors, the missing
  Vatican museum-wing compound, the40 recorded venue map gaps or349 still-short
  catalog interpretations. No commit, push or deployment was made.

The45 reference themes now pass the explicit interpretation check. This does
not mean that the remaining349 catalog subjects outside the68 enriched works
have the same depth. Their short records remain visible and are not reclassified
as fully reviewed because the Vatican reference correspondence is now covered.

Current venue depth is44/44 Vatican,15/15 St Peter,2/3 square,4/21 Uffizi and
3/18 Borghese subjects. Other guides still need enrichment. These ratios refer
only to the current selected catalog, not all holdings or every architectural
feature in each venue. Research and media decisions are retained in
`sources/collections/interpretation-review.md`.

The spatial scope inventory contains47 venues,40 with explicitly recorded
gaps, including missing floor plans, vertical links or object positions. The
seven without recorded scope gaps are not automatically proof that every
current artwork position is verified. For example, Picasso has floor geometry
but lacks reliable current object-room assignments.

The reference relates the Vatican museum wings, St Peter and the square in one
overview. The St Peter compound is now supplied by the official exterior mesh
described above; the museum wings are still not included in that model. The
native Vatican museum rectangle courtyard remains an unaccepted coarse mass.
A coherent evidence-backed museum-wing context remains required; adding more
work descriptions cannot substitute for it. Baseline comparison screenshots:
`work/experience/reference-current-map.png` and the Vatican/St Peter exterior
images in `work/experience/site-review`. The reference is an experience target,
not authority for measured building geometry or current access rules.

The new library-hall and lower-necropolis entries do not repair missing plans.
Department-level associations are not exact cabinet/wall coordinates. The
reference's multi-image count is also not an acceptance target: tiny thumbnails,
watermarked copies and unrelated works are rejected rather than replicated.

## Still Required

Complete the remaining exterior review, collection-depth and image audit,
remaining guide-specific practical review, map evidence gaps, physical touch and
mobile30FPS checks. Repeat full desktop/mobile/offline acceptance after the
remaining content/model work; the passing current revision is not full product
acceptance. Rebuild and
give the user the verified local production URL only when that work is ready.

## Local Runtime Note

The legacy media-dimension generator imports OpenCV, absent from the current
system Python. An isolated runtime at `/tmp/europe-guide-map-runtime` now has
the exact four versions in `scripts/map-requirements.txt`; its PyMuPDF/OpenCV/
Shapely pipeline successfully extracted the new Colosseum source study. This
does not by itself prove that every older source generator is reproducible.
New collection images were fully decoded with installed Sharp and their
actual dimensions merged mechanically into the existing generated index; do not
invent sizes or weaken media tests. The Vatican acquisition script now records
decoded output sizes in the index itself; gallery tests also require those
dimensions. No project JavaScript dependency versions were changed by this
runtime setup.

Large geometry chunks remain a performance follow-up: the biggest current lazy
venue chunk is Casa Batllo at4,673,199 uncompressed bytes. Do not delete room
geometry to silence the build's500KB warning. Distinguish transfer/compression
cost from mobile frame-rate measurements; neither has been fully signed off.

## Vatican Campus Context, 2026-09-08

- Added a native, lazy-loaded2D whole-campus view to the Vatican museum,
  St Peter basilica and square chapters. Its fourteen area choices link the
  source-derived compound context to existing indoor place IDs or local
  chapters. This is a2D addition, not replacement of the coarse museum3D
  exterior. The exterior improvement count remains5, with69 still to review.
- Preserved the official state plan's orthographic orientation and actual
  coloured pixels, adding separately classified grey colonnades. Classification
  overlap is unioned rather than subtracted. Printed badge holes remain a
  documented limit of this context drawing; it is not usable as an extrusion
  footprint or a source of artwork coordinates. Full records are in
  `sources/exteriors/vatican-campus-review.md`.
- Room actions return to the reviewed indoor floor in2D; manual indoor floor
  state survives ordinary view switches. Native map defaults, all itinerary
  ordering, bookings and collection counts remain unchanged. The square's
  outdoor default remains its existing exterior view.
- Corrected the shared view switch from a fixed two-column grid to one row
  accommodating the actual number of views, and matched active styling to
  the buttons' actual `aria-pressed` state. Campus headings no longer say3D.
-53files/663tests, typecheck, lint,7Python extraction/classification tests and
  local production build pass. Export revision is `a183d2683b2a8d35b369`.
  The focused production campus suite passes320/390/820/1440:14region choices,
  source-map pixels, visible single-row view switches, keyboard zoom/pan/reset,
  correct room/floor link, no page errors and no overflow.320/390 also pass
  CDP-emulated two-finger pinch followed by region/room selection. This is
  emulated input, not physical phone or Safari testing.
- The preceding `6ae6308814e602062cac` export passed80offline routes with zero
  missing precache entries. The campus was first opened offline on the museum,
  basilica, square and Vatican alias; museum/alias room actions selected
  `second-8-1`. The only later runtime change is the view-switch CSS above.
  Final regression results are recorded below after completion.
- Acquired and reviewed historical palace plans, Belvedere sections and the
  Braccio Nuovo plan/transverse section from ETH's Letarouilly publication.
  Captions distinguish historical reconstructions from then-current drawings;
  they must be reconciled with current evidence before modeling. No heights
  or geometry from these plates have been added to the public3D scene yet.

This milestone does not complete the40 recorded spatial gaps,349 still-short
interpretations, remaining venue practical/media reviews,69 exterior reviews
or physical-device acceptance. All work remains local. No commit, push,
GitHub Pages deployment or Sites publication was made.

### Final Campus Validation

- Shared view-switch changes passed all74guides at1440/390,148cases with no
  page errors or overflow on export `a183d2683b2a8d35b369`. Report:
  `work/experience/vatican-campus-full-production/report.json`.
- A final campus-only16px inset then fixed a320px entrance marker clipping
  against the right edge. Camera focus includes this inset; underlying source
  coordinates never move. This does not alter other chapters or their maps.
- Final export `855ba1ab0f6d999ec292` passes53files/663tests, typecheck, lint,
  local build, and the campus production suite at320/390/820/1440. The suite
  checks the full marker is visible initially and after each of14selections,
  plus keyboard, emulated pinch, room links, view tabs and nonblank pixels.
  Gold pixel counts are6197/10376/54273/89051 respectively. Reports:
  `work/experience/vatican-campus-production-final`.
- This final export also passes all80offline routes with zero missing precache
  resources. The four campus entry points load their previously unopened
  local SVG while offline; museum and alias still select `second-8-1` in2D.
  Report: `work/experience/vatican-campus-offline-final/report.json`.
- The dev URL `http://localhost:55910/guides/vatican-museums/` returns200 after
  its canonical-path redirect. Temporary production QA servers were closed;
  the user's local development preview remains running. No deployment occurred.

These checks verify this limited local addition, not whole-goal completion.

## Braccio Nuovo Architectural Cutaway, 2026-09-08

- Calibrated the historical plan and central section independently using their
 24m/12m graphic bars. The printed18.42m portico width provides an independent
 check, not a claim of modern survey accuracy. Full source and approximation
 records: `sources/exteriors/braccio-nuovo-review.md`.
- Added semantic source-coordinate geometry for the long gallery,28 wall
 recesses with their floors,52 sampled columns (8 in the portico), central
 hemicycle and the indicated stair flights.63 polygon features are valid in
 Shapely; all52 column centres are covered by floor polygons. Stair landing
 height interpolation, simple capitals and omitted shafts/roofs/detail remain
 explicit limitations. Do not call this a complete modern exterior.
- Replaced the local Vatican renderer's use of the unsupported seven-part
 recipe with this clearly labelled partial building cutaway. The14-region
 campus and existing reviewed visitor-plan bindings stay separate and intact.
 Entire-compound registration and all adjacent wings are still unfinished;
 the accepted exterior-improvement count remains5, with69 pending review.
- Added shared-data no-WebGL plan, lazy geometry modules, whole-wing/gallery/
 portico/hemicycle focus, mobile-specific framing, offscreen render suspension
 and retry after context loss. No itinerary, hotel, ticket or catalogue data
 changed. No commit, push, Pages deployment or Sites publication occurred.
- Fixed two defects found by actual screenshots before acceptance: a new scope
 note displaced the map into a300px legacy sidebar, and niche floors stopped
 at the gallery wall line. The final viewer uses the full-width frame, and all
28 recesses have floor surfaces instead of false holes.
-54test files /668tests pass, plus typecheck/lint and local production export.
 One integration test initially exceeded Testing Library's default1s wait
 while validating the real large plan during the full concurrent suite. Its
 existing positive assertions remain unchanged; the bounded load wait is10s
 and the test's total limit15s. The complete rerun passed, not a skipped test.

### Braccio Validation Results

- Export `d82b149c4eae06aa77fe` passed all74chapters at1440/390:148cases,
 no page errors or page overflow. Report: `work/experience/braccio-full-production/report.json`.
- A final Braccio-only framing adjustment changed the narrow-screen overview
 to a diagonal view and aligned first-load framing with reset. It did not
 change geometry or other venues. Final export: `82f342d5f8fade084505`.
- This final export passes320/390/820/1440 focused screenshots/pixels, all4
 focus ranges, initial-versus-reset framing, desktop-to-phone resize, keyboard,
 drag, CDP pinch at320/390,3interior/exterior remount cycles, offscreen
 suspension, actual WEBGL_lose_context recovery and fully blocked WebGL.
 Report: `work/experience/braccio-nuovo-production-final/report.json`.
 The rendered model uses11draw calls/34,346reported triangles including shadow
 passes. This is not a physical-phone30FPS claim.
- Final export passes all80offline paths with1047precache assets and zero
 missing resources. Vatican canonical/alias routes first open the new model
 and plan offline, and the campus room link still selects `second-8-1` in2D.
 Report: `work/experience/braccio-offline-final/report.json`.
- Four reproducible Shapely tests pass via
 `/tmp/europe-guide-map-runtime/bin/python scripts/test_braccio_plan.py`.
 They check polygon validity, column floor coverage, niche floor/wall separation
 and the absence of elevated slabs hiding stair flights.

This is progress, not completion of40 spatial gaps,349 short interpretations,
remaining exterior/practical/media reviews or physical-device acceptance.

## Registered Basilica and Campus Context, 2026-09-08

- Registered the original official St Peter exterior against the native state
  plan using the main dome axis and square obelisk. Withheld north/south
  fountain checks differ by1.698/2.830 source pixels. One uniform similarity
  preserves source lengths and handedness; runtime3D uses only rotation and
  translation. Exact source hashes, points, calculation and limits are in
  `sources/exteriors/vatican-registration-review.md` and its JSON ledgers.
- Added an optional lazy3D campus to the existing2D campus module. The actual
  basilica, square and colonnades now share a scene with the source-derived
  flat museum/palace context. Museum roofs/facades and site terrain have not
  been fabricated; Braccio's old/current footprint and shared elevation remain
  unaccepted. The complete-compound and69 outstanding exterior-review gaps
  are not resolved by this partial assembly.
- Preserved2D entrance defaults and14 area/indoor links. Both campus views
  share selection; returning to2D resets its transform and scale together.
  Added mobile framing, real keyboard/pointer/touch controls, on-demand
  rendering, context disposal/retry and a2D fallback even if the dynamic3D
  module cannot load. No itinerary, booking, collection or source-map geometry
  changed. No commit, push or public deployment occurred.
- Full suite56files/672tests passed. The final fallback/2D-state changes then
  passed the focused4files/13tests plus typecheck and local production export.
  Production/offline verification results follow below; earlier Braccio/campus
  report revisions are not being presented as validation of this new scene.

### Registered Campus Validation

- Local export `ac1239c400fce927a4c5` passes the compound suite at1440,820,390
  and320px. It checks all14area selections, source model pixels, distinct
  rotated pixels, keyboard/drag, emulated pinch at390/320, initial/reset frame
  equality, resize, on-demand idle behaviour, fetch failure, actual WebGL
  context loss/retry,3disposed/remounted contexts, unavailable WebGL and a
  deliberately failed dynamic module. Report:
  `work/experience/vatican-compound-production/report.json`.
- The source scene uses2or3draw calls,501,505or501,601triangles depending on
  the area annotation. This includes the unsimplified official mesh and is
  not evidence of30FPS on a physical phone.
- Existing2Dcampus checks pass all4widths,14regions, marker framing, keyboard,
  emulated pinch and `second-8-1` room/floor return. Original standalone
  basilica/square exterior checks also pass both chapters at all4widths.
  Reports: `work/experience/vatican-compound-2d-production/report.json` and
  `work/experience/vatican-compound-st-peters-production/report.json`.
- The same export passes80/80offline routes,1048precache assets and zero
  missing entries. New registered compound views first open offline from
  Vatican canonical/alias, basilica and square entry points. Switching back
  retains the selected campus region, reports the actual100%2Dtransform,
  and museum/alias links still reach `second-8-1` in2D.
  Report: `work/experience/vatican-compound-offline/report.json`.
- Final lint/typecheck pass; the added source-vector hash check also passes
  the registration unit suite. No source-map image/geometry was altered.
- The same `ac1239c400fce927a4c5` export passes all74chapters at1440/390,
 148cases with no page errors or horizontal overflow. This checks default
 2D, existing map interactions, rendered exterior pixels, image decoding,
 highlight dialogs and on-site views; it does not certify missing architecture
 or interpretation as complete. Report:
 `work/experience/vatican-compound-full-production/report.json`.
- After production export, the live dev server at `http://localhost:55910/`
  also passes the390px compound suite, including rotation pixels, shared
  selection, lifecycle recovery and a genuinely failed dynamic import.
  Report: `work/experience/vatican-compound-dev-final/report.json`.
  Temporary QA servers are closed; the existing dev preview remains running.
- A final full unit-suite rerun after all runtime edits passes56files/672tests.
  Typecheck, lint and whitespace checks are clean. Existing test-environment
  localStorage/canvas warnings are not browser-runtime failures; actual WebGL
  is covered by the browser suites above.

Complete museum/palace exterior geometry, Braccio campus/height registration,
40venue map-scope gaps,349short interpretations and remaining practical,
media and physical-device review remain outstanding. This is not acceptance
of the full local rebuild and has not been published.

## Library Study and Stable Overview Scale, 2026-09-08

- Acquired and visually inspected LetarouillyII Belvedere plate14, with the
  library, Braccio and flanks on one plan and an independently scaled
  transverse section. The2010 technical restoration report and the54-page
  architecture publication establish major later changes to storage and
  circulation. Those floors are not copied from the historical drawing.
  Corrected a prior PAVM attribution: its hidden-balustrade/modern-roof
  paragraph describes the EAST corridor, not the Braccio south facade.
- Added an independent library architectural study to the library area detail:
  same source-coordinate data for2D and3D, both end connections, six sampled
  piers, seven unequal bays per aisle, low wall cuts with openings, and open
  section-profile frames. This is NOT a complete library, exact current vault
  surface, reconstructed fresco cycle or registered compound addition.
  Unverified lower floors, current lifts, full roof detail and common site
  height are still absent. Its approximately80m source extent includes end
  connections and is not substituted for the modern70m hall claim.
  Detailed provenance and limits: `sources/exteriors/vatican-library-review.md`.
-2D is the study default. On phones it turns vertically with numbered spaces
  and a full-name legend. Pan/zoom/reset are available by buttons and keyboard.
  Optional3D reuses the campus renderer lifecycle but loads only this study;
  it never downloads the unrelated basilica mesh. The resulting open study
  has4draw calls and516triangles, not a completed exterior quality claim.
- Fixed an actual shared viewer defect: selecting a region previously changed
  the orthographic frustum and relabelled that local view as100%. The frustum
  now derives from the full model, minimum zoom is1, and zooming out to100%
  recentres the whole model while retaining the current orientation. Focus
  retains the global baseline. Resize does not erase manual rotation/zoom.
- Local export `97ac496b408b313eaf8c` passes study screenshots/rotation pixels,
  planar and3D zoom/reset, geometry disposal and no-extra-mesh checks at
 320,390,820,1440. Report:
  `work/experience/vatican-library-production/report.json`.
  The full campus lifecycle suite also passes all four widths, including
  focus-to-overview via repeated zoom-out, all14selections, pointer/keyboard,
  emulated pinch, unavailable WebGL, real context loss and failed module:
  `work/experience/vatican-library-campus-production/report.json`.
- The same export passes the three directly affected chapters at1440/390,
  six page cases, with no errors/overflow. The previous148case result belongs
  to the previous revision, not this one. Current report:
  `work/experience/vatican-library-pages-production/report.json`.
- All80offline paths pass on this export;1050assets have zero missing cache
  entries. Library study first opens offline from canonical Vatican, alias,
  basilica and square pages. Default indoor2D/entry floor, all old numbering
  and room links remain intact. Report:
  `work/experience/vatican-library-offline/report.json`.
-58files/677unit tests passed before the final label/floor-trace cleanup;
  the final focused4files/13tests, typecheck, lint and whitespace checks pass.
  Source meshes and other venues' geometry were not modified. Temporary
  production test servers closed. The existing local55910server remains.

No commit, push, publication or acceptance request. This study does not
increment the five improved exterior treatments or close any of the40venue
spatial gaps,349short interpretation records,69exterior reviews, or the
physical-device/performance and practical-content work. The full goal is
still active and genuinely incomplete.
# Uffizi Collection and Room Review, 2026-09-09

- Uffizi now has32 selected works instead of21, preserving all21 existing IDs
  and their order. All32 have individual background/observations and localized
  archive fields;17 old short entries were enriched and11 new subjects added.
  Whole-trip inventory is74 guides,428 works,96 enriched/332 still short.
  This is not complete large-museum or whole-trip collection coverage.
-31 official object pages are acquired as structured records with IDs and
  hashes.17 local images are acquired/replaced and visually reviewed. Full
  triptych/diptych images, reverse faces and one explicitly named detail are
  distinct gallery entries; no full scene is substituted by that detail.
- Reviewed the exact July-labelled visitor PDF underlying existing geometry.
  Corrected five room associations: A25 diptych,D23 Venus,E4 Medusa/Judith,
  E5 Bacchus. Retained qualified A9 references for Spring/Venus; removed
  unsupported precise positions for Fortitude/Lami Adoration after the
 2026 reinstallation conflict. The print remains unlocated.29 references,
 3 unlocated works; no geometry, closure-based filtering or itinerary change.
  Evidence: `sources/collections/uffizi-room-review.json` and
  `sources/collections/uffizi-interpretation-review.md`.
- Fixed field-wise archive merging that otherwise erased existing images.
  Also fixed a real reduced-motion zoom-reset defect: a global CSS rule was
  briefly transitioning the engine canvas despite an inline identity and
 100%label. CSS no longer interpolates the transform; browser checks assert
  actual computed identity and complete-image containment, not just labels.
-59 test files/742 tests, typecheck, lint and whitespace checks pass. Export
  `26448c1fe66972c4740f` and the retained dev-tab navigation/reload test pass.
  The dev server remains at `http://localhost:55910/`.
- The export passes96 work cases at1440/390/320, including deep links, all39
  gallery images per viewport, reset, reading, selection and map round trips.
  All32 works also first open offline after root precache. Reports:
  `work/experience/uffizi-collection-room-reviewed/report.json` and
  `work/experience/uffizi-collection-room-offline/report.json`.

- The same export passes all74 chapters at1440/390,148 cases, plus Uffizi at
 1094/320. Checks include default2D, room-layer controls, exterior canvas
  pixels and keyboard, collection image decoding, details, on-site mode,
  sequence links, checklists, overflow and page errors. Reports:
  `work/experience/uffizi-full-regression/report.json` and
  `work/experience/uffizi-narrow-regression/report.json`.
  Actual Uffizi map captures at1440/390 were inspected; this does not certify
  incomplete source geometry or every screenshot as visually reviewed.
- Shared image-viewer checks pass1440x960,390x844,844x390, including emulated
  pinch/pan, reset, gallery changes, nested-dialog dismissal and24 rapid
  reopenings per viewport. Report:
  `work/experience/uffizi-shared-viewer-final/report.json`.
- All80 exported routes pass real offline reloads on the same revision with
  zero missing precache entries. Report:
  `work/experience/uffizi-all-offline-final/report.json`.
  Temporary production QA servers close normally; the dev55910server remains.
- The final internal media review metadata passes all37 Uffizi unit tests;
  no runtime code changed after the production/browser checks. The reference
  was reopened in Chrome on September9, confirming its45 work choices and
 14 region entries. Its claims and approximate positions are not copied as
  authority.

This pass does not close the40 venue map gaps or69 exterior reviews, or
physical-device/Safari/performance work.
No commit, push, deployment or user acceptance request; the full goal remains
active and incomplete.

## Vatican Visitor Information, 2026-09-09

- Added a typed visitor-information collection and shared unframed topic/FAQ
  section to four chapters: Vatican Museums, St Peter Basilica, St Peter Square
  and Vatican Post. The section contains20 topics and17 independently
  expandable questions. Other70 chapters do not receive generic copied advice
  and still need their own visitor-information review.
- Reviewed first-party entry, security, clothing, photography, baggage,
  accessibility, rest and postal guidance. Internal evidence and rejected
  inferences are in `sources/visitor-information/review.json`. The Italian and
  English postal pages disagree about Sunday; this remains explicitly
  unconfirmed. The two dome route orders are not replaced by a universal
  basilica-before-dome rule. No booking data, arrival time, itinerary order,
  new spatial coordinates or geometry changed.
- Twelve contextual map buttons target existing reviewed places. Explicitly
  requesting a service now restores a previously hidden service layer before
  selecting its floor and place. Exact floor/selection/viewport-focus checks
  cover these links, including the basement and grottoes links. Normal manual
  layer selection and the default2D/entrance-floor behavior remain intact.
- Local production export `52e53aeacc7beefa5192` passes16 visitor-section
  cases at1440,1094,390,320: all topic paragraphs, local chapter URLs, every
  FAQ by keyboard, controls at least44px tall, responsive stacking, no
  horizontal overflow,200%root text size and persisted checklists. Actual
  overview, FAQ, enlarged-text and map-link screenshots were inspected.
  Reports: `work/experience/visitor-information-production/report.json` and
  `work/experience/visitor-information/report.json` for the development build.
- Four additional first-open offline visitor cases pass at390px, including
  FAQ expansion, map links and reload after caching only the home page.
  Report: `work/experience/visitor-information-offline/report.json`.
  All80 site paths also pass the complete offline regression against this
  revision, with1068 assets and no missing cache entry. Report:
  `work/experience/visitor-update-offline/report.json`.
- Full unit run passes61 files/756 tests. The final copy-only adjustment then
  passes both new files/14 tests; typecheck, lint and whitespace checks pass.
  The export-and-retained-tab test confirms navigation and reload on the
  original dev tab remain functional while the production build runs.
  Local development remains at `http://localhost:55910/`.
- The same export completes all74 guide pages at1440/390,148 passing cases:
  default2D and layer controls, exterior canvas pixels and keyboard, all
  selected-work images decoded, detail and on-site dialogs, sequence links,
  practical checklists, overflow and page errors. Report:
  `work/experience/visitor-update-site-review/report.json`.
  These automated captures do not certify all remaining source geometry or
  imply that every one of the148screenshots was manually accepted.

The dense Vatican entrance-floor annotations still require a separate
small-screen readability pass; a working map button is not proof that this
visual issue is solved. Complete compound geometry,40 source-map scope gaps,
332 short selected-work records,69 exterior reviews, other70 visitor chapters
and physical-device/Safari/performance verification remain outstanding.
No commit, push, deployment or acceptance request was made.

## Indoor Map Reading and Pointer Recovery, 2026-09-09

- Replaced phone-width compression with a readable drawing that may extend
  beyond its viewport. Geometry keeps equal x/y scale; labels remain13px in
 28px targets at all map zooms, with collision spacing. All1166 existing
  place IDs, exact room text, guide numbers and physical coordinates remain.
  Layer switches filter the stable label layout instead of shifting every
  annotation. No floor source, room position, itinerary or booking was edited.
- A source-shared overview shows the full floor and the current viewport.
  Pointer or keyboard activation moves the main map to that physical point.
  The main2D viewport height is bounded by both floor proportions and label
  density: compact house plans no longer inherit a tall empty phone panel,
  while the dense Vatican entrance floor retains460px. Zoom does not resize
  the viewport. Reviewed entrance defaults and remembered manual floors remain.
- Fixed two observed defects, not just the tests: the reduced-motion global
  rule gave every element a0.01ms transition, leaving SVG/plane dimensions at
 1408x1840 while the new inline drawing was2042x2099; reduced motion now has
  zero transition duration and map dimensions never interpolate. Also fixed
  bubbled `lostpointercapture` from a room button clearing the viewport's
  newly acquired drag. The actual Chrome event trace and real CDP touch
  reproduction established that cause. No refresh workaround is required.
- Pinch retains its physical focal point, one-finger pan can begin on a label,
  and cancellation/outside release recover. Explicit visitor/work map links
  select canonical coordinates and wait for2D remount before focusing the
  viewport, including links requested from a3D view. A marker becoming
  selected is no longer accepted as sufficient evidence of correct focus.
- Final local export `80d30f813ea2e58feb91` passes62 files/800 unit tests,
  typecheck, lint and whitespace checks. The retained-dev-tab build test
  passes navigation, reload and2D interaction at `http://localhost:55910/`.
  Expected JSDOM canvas warnings are separate from real-browser pixel tests.
- The same export passes606 floor/zoom/width cases across42 plans and101
  modeled floors at1440,390,320. Checks include exact identities/text/numbers,
  feature inventory, constant label dimensions, no label collision/clipping,
  immediate SVG dimensions, physical-anchor focus, nonblank overview and no
  page overflow/errors. Report: `work/experience/plan-reading-final/report.json`.
- Four real Chrome touch cases cover390/320 in both normal/reduced-motion
  modes: pinch/focal stability, pan from a room, capture transfer, cancellation,
  release outside the map, floor/view/reset persistence, overview tap and
  keyboard. Report: `work/experience/plan-touch-final/report.json`.
  These are emulated browser touch tests, not physical-device/Safari acceptance.
- Sixteen visitor cases verify the contextual map links, including3D-to2D
  remount, correct floor, physical anchor, visible label and keyboard focus;
  four additional first-open offline cases pass. Reports:
  `work/experience/plan-visitor-links-final/report.json` and
  `work/experience/plan-visitor-offline-final/report.json`.
- All74 chapters pass desktop/phone regression,148 cases, and all80 routes
  pass offline refresh with1068 assets and no missing precache entries.
  Reports: `work/experience/plan-site-final/report.json` and
  `work/experience/plan-offline-final/report.json`. Final entrance-map and
  overview captures for Vatican, Uffizi, Casa and Cologne are under
  `work/experience/plan-visual-final`; selected desktop/390/320 captures were
  manually inspected. Automated coverage is not manual acceptance of every
  screenshot or of the remaining incomplete source plans.

The available official St Peter source GLB was also inspected for a reusable
whole-compound exterior. Its retained exterior mesh does not establish the
missing museum/palace buildings; `Piazza_PARENT` has no separate child geometry.
No additional exterior was reconstructed or counted as completed in this pass.
The40 spatial-source gaps,332 short interpretations,69 exterior reviews,
other70 visitor chapters and physical-device/Safari/performance work remain.
No commit, push, publication or user acceptance request. The full goal remains
active and incomplete.

## Pisa Source-Derived Exterior, 2026-09-09

- Replaced the local leaning tower's seven shifted cylinders with an open,
  source-derived model. The ISPRS2003 publication's May2001 laser survey
  supplies six distinct loggia heights, section diameters, gallery widths,
  bell footing and changing inclination. Historical gallery plans corroborate
  the30-column rings. The full source manifest and derivations are in
  `sources/exteriors/pisa-review.md`.
- The model includes15 base blind arches,180 loggia columns and180 true open
  arch bays, a hollow curved shaft, open upper-core bays and six large/six
  raised bell-chamber apertures. Four material batches avoid hundreds of
  draw calls. Proportional capitals, lozenges and handrails are simplified
  display details, not a current sculptural or measured ironwork inventory.
  Interior stairs, bell positions and undocumented windows are not invented.
- It loads only for this exterior. Four named framing choices, mouse orbit,
  keyboard/reset and touch zoom share the existing viewer. A separate toolbar
  row prevents mobile top clipping; two-character visible region labels avoid
  single-character wrapping at320px, with full accessible names retained.
  Indoor geometry, five source-plan groups, visitor entry defaults, itinerary
  and bookings are unchanged.
- The local portrait fallback is rendered from this same geometry, not a
  substitute photograph. Its1080x1800 WebP SHA256 is
  `1ebe40cef3cd4c9858d912658961660761c48ced91cf6ae2588265aee57f4e10`;
  public and final exported copies match. Both fallback and lazy model chunk
  are in the1070-asset offline manifest.
- Final export `16d306966a4e39120717` passes63 files/804 unit tests, typecheck,
  lint and whitespace checks. The export/retained-tab test passes local
  navigation and reload at55910. Four source/model tests cover finite meshes,
  section dimensions, continuous changing tilt, open entrance/shaft/arch rays,
  counts, focus bounds and batching; these do not prove every carved detail.
- Production exterior QA passes1440,820,390,320, including nonblank unclipped
  full-height framing, focus presets, keyboard, actual mouse drag, phone CDP
  pinch, interior/entry restoration, real WebGL context loss, decoded static
  fallback and retry. Each reports9 draw calls and129650 rendered triangles
  including shadow passes. Report: `work/experience/pisa-exterior-final/report.json`.
- A separate390px final-export check first precaches only the homepage, goes
  offline, and opens the tower for the first time. Lazy exterior, controls,
  forced-context-loss image and retry pass without network. Report:
  `work/experience/pisa-exterior-final-offline/report.json`.
- All80 routes also pass offline refresh on the final `16d306966a4e39120717`
  export, with no missing precache entries. Every existing indoor floor retains
  its exact place/route-number inventory and reviewed2D entrance default.
  Report: `work/experience/pisa-update-final-offline/report.json`.
- Final shared-viewer regression passes10 cases for Pisa, Pantheon, St Peter,
  Sagrada and Casa at1440/390. Report:
  `work/experience/pisa-update-final-site/report.json`. The larger148-case
  all74-guide regression passed on `e4a108c5b9a504879afc`, immediately before
  only the four visible Pisa button labels were shortened. Its report is
  `work/experience/pisa-update-site/report.json`; do not relabel it as the
  final revision's full148-case run. The same earlier export also passed all
 80 offline routes with no missing cache entry.
- A prior same-geometry production lifecycle probe at390px and4x Chrome CPU
  throttling measured33.3ms median/33.4ms p95 frame intervals, confirmed orbit,
  offscreen suspension and zero retained canvases after six exit cycles.
  `work/experience/pisa-exterior-production/lifecycle.json` is emulation on a
  Mac, not physical-phone30FPS/Safari proof or a complete GPU leak audit.
- Final320px fallback/control and390px overview screenshots were manually
  inspected. Four-width image captures do not imply complete visual source
  fidelity. The old seven-cylinder screenshot is retained separately for
  comparison, not used as the new model's acceptance evidence.

There are now six improved venue exterior treatments and68 remaining exterior
reviews. The40 spatial-source gaps,332 short selected-work interpretations,
other70 visitor chapters, whole-compound geometry and physical-device work
remain open. No commit, push, publication or acceptance request was made.

## Sistine Source-Mesh Focus, 2026-09-09

- Identified the Sistine Chapel roof in the official exterior scan's northern
  context patch, corroborated by the Vatican Museums2014 exterior photograph
  and dimensions, the registered state plan and Letarouilly palace/chapel plans.
  Acquisition hashes, page references, source-space ray samples and limitations
  are in `sources/exteriors/sistine-mesh-review.md`; reproducible inspection is
  in `scripts/inspect-sistine-mesh.mjs`. No original source PDF is embedded.
- Replaced its flat area-anchor camera target with bounds around the actual
  scan, a high northern view and an above-roof selection annotation. The
  documented area anchor and canonical indoor `first-12-1` remain unchanged.
  The new camera centre Y=31 and roof ring are display choices, not surveyed
  building boundaries, an entrance or an artwork location. Full-view100%
  remains the same complete-campus baseline.
- Corrected the scope text: the source includes the chapel exterior as well
  as basilica/square and parts of their surroundings. It does not establish
  the complete museum/palace. No second chapel was constructed, no scan
  geometry/material was altered, and no new exterior completion is counted.
  The GLB SHA256 remains `c674af8ffc340d7362ee044b5f3e00312abe91d0484989ed4cb12ea7294f6508`.
- Local export `a7eac4c4d6439838901c` has1070 cached assets and75 manifest
  routes. All805 tests in63 files, typecheck, lint and whitespace checks pass.
  Export with a retained development tab also passes navigation/reload/default
 2D at55910: `work/experience/sistine-retained-local-build/report.json`.
- Final compound QA passes1440/820/390/320:14 area selections, source-height
  chapel focus, actual rendered pixels, rotation, keyboard/pinch, reset and
  zoom-out to full context, exterior-to-indoor `first-12-1` linkage, three
  disposed remounts with restored chapel selection, fetch failure, actual
  context-loss retry, no-WebGL and failed-module2D fallback. Report:
  `work/experience/sistine-compound-final/report.json`. Phone and desktop
  chapel screenshots were visually inspected. A test initially waited for
  a new frame while the canvas was offscreen; it now restores visible framing
  before examining rendered state, retaining the intentional offscreen pause.
- The same export passes four-width shared library checks and six affected
  venue/page cases for Vatican Museums, St Peter and the square at1440/390.
  Reports: `work/experience/sistine-library-final/report.json` and
  `work/experience/sistine-shared-final/report.json`. Four first-open offline
  routes, including `/vatican-guide/`, pass the new chapel focus plus existing
  indoor floor/number/entry inventory, compound, cutaway and local image checks:
  `work/experience/sistine-focus-offline/report.json`, zero missing cache entries.
  The previous80-route full offline report remains tied to the preceding Pisa
  export; it is not relabelled as an80-route rerun for this focused change.

The full local objective remains active. Six improved exterior treatments,
68 remaining exterior reviews,40 spatial-source gaps,332 short selected-work
interpretations,70 visitor chapters and physical-device work retain their
previous statuses. No push, public deployment or acceptance request.

## Colosseum Research-Mesh Review, 2026-09-09

- Acquired the public MACARONS research dataset's Colosseum OBJ and texture,
  credited to Brian Trepanier. Preserved original source hashes and captured
  its provenance separately from official HBIM work. The source is not claimed
  to be an official metric survey or a current visitor-access record.
- Added a repeatable mesh-only OBJ adapter and conversion script. The source's
 396trailing loose edges no longer cause OBJLoader to treat all faces as lines.
  No loose line is extruded or triangulated. Six focused tests covering that
  adapter and the earlier arcade study pass; full typecheck/lint also pass.
- Converted all1,509,784source triangles for inspection, preserving parsed
  positions/normals and correcting OBJ-to-glTF texture V orientation. Also
  created a13.56MB neutral-material selection retaining417,071whole triangles
  around the dataset's reviewed camera ROI. No shape smoothing, simplification,
  nonuniform scaling, gap filling or new surfaces were performed.
- Two widths1440/390, five directions and two materials produce20verified
  render cases per candidate, with nonblank canvas pixels and mouse orbit.
  The close-up of the northern arcades reveals capped recesses rather than
  complete openings. Texture triangulation, faceted masonry and incomplete
  context edges also fail the visual/detail gate. **Not accepted for guides.**
  Evidence: `sources/exteriors/colosseum-mesh-review.md` and
  `work/experience/colosseum-source-study/venue-mesh-north-arcade-detail.png`.
- All candidate files remain outside `public/` and are not application imports.
  Export `a7eac4c4d6439838901c`, local55910, original2D entrance defaults,
  indoor data, itinerary and booking records are unchanged. No new offline or
  full-site acceptance is claimed by these research-only tests.

The Colosseum model remains unfinished. The active full objective and previous
coverage counts are unchanged; no deployment or user acceptance request.

## Accademia Collection and Visitor Pass, 2026-09-09

- Enriched all seven existing Florence Accademia entries and added six works:
  Botticelli's Madonna, Pacino's Tree of Life, Monaco's Annunciation, the
  Adimari wedding panel, Pontormo's Venus and Cristofori's oval spinet.
  The13entries preserve old IDs/order, itinerary timing and route sequence.
  Every entry now has its own background, three observations and localized
  archival fields. This remains a selected guide, not the whole collection.
- Added12 uncropped local institution images, with16 catalogue/service-page
  snapshots and source hashes. All four Prisoners have individually identified
  images in the retained group entry. Matthew's full view precedes its labelled
  detail. The800px retained viola photograph remains an explicit media gap.
- Corrected the Perugino lower-register figures (saints, not apostles), the
  clay-versus-plaster Sabines identity, Matthew's different commission,
  later reconstruction of Monaco's frame and the wedding panel's old title.
  Original instruments and playable reconstructions are distinguished.
- Added Botticelli's supported giant-hall link and the spinet instrument-area
  link. Four new works remain unpinned pending fine-grained room evidence.
  Accepted two-floor geometry/digest, entrance default and2D mode are unchanged.
- Added five Accademia practical topics/five FAQs. Corrected no-indoor-cloakroom
  versus MyAccademia storage, without inventing charges or early arrival rules.
  Conflicting official toilet-floor descriptions are not turned into map pins.
- Full tests:837 passed in65files; TypeScript and lint passed. Local export
  `b1fa45bba6ca9aff5cb0`:1082assets/75route manifest. Export with a retained
  development tab passed navigation, reload and2D default at55910.
- Production collection QA:39work cases at1440/390/320, deep links, observations,
  full image/zoom/gallery controls, mapped room-to-work round trips, empty search
  and no horizontal overflow. Screenshots visually inspected, including narrow
  reading and full wide-panel framing. Report:
  `work/experience/accademia-production-final/report.json`.
- First-open offline collection QA:all13work cases at390 pass, all related
  images decode. Five practical chapters also pass offline refresh, FAQ and
  room links. Reports:`work/experience/accademia-offline-final/report.json`
  and`work/experience/accademia-visitor-offline-final/report.json`.

Current counts:434selected entries,109with expanded context/observations,
325still short;25practical topics/22FAQs across five chapters,69chapters
remaining. Six exterior treatments,68remaining exterior reviews,40spatial
source gaps and physical-device acceptance retain their prior statuses.
No push, public deployment or user acceptance request; full goal stays active.

## Bridge of Sighs Exterior and Trial Packaging, 2026-09-09

- Replaced the generic bridge with source-normalized exterior geometry. The
  current MUVE loggia diagram establishes two separated adjacent passages;
  southern official and northern primary photographs support the arch,
  four grille windows, pilasters, cornices, crown and differing central shields.
  Full hashes/projection caveats are in `sources/exteriors/sighs-review.md`.
- Real arch/window/passage openings replace closed cuboids. Only the bridge
  is modeled; connection end cuts are not street entrances. No invented
  neighboring blocks, public route markers, indoor geometry or itinerary edits.
  Roof section/thickness, figurative sculpture and fine relief remain gaps.
- The shared viewer loads this model only for the bridge. Four named views
  include an upward-looking intrados detail, without changing other venues'
  orbit limits. Existing indoor2D defaults and manual-floor behavior remain.
- Export `438aa3a844541924195a`:1084assets/75manifest routes. The retained
 55910development-tab export test passes navigation/reload/default2D. Reports:
  `work/experience/sighs-retained-build/report.json` and build log.
- Four-width bridge production QA passes1440,820,390,320: nonblank fully framed
  overview, north/south/arch focus, keyboard, actual mouse drag, CDP phone pinch,
  reset, actual context loss, decoded same-model fallback and retry. All report
 9draw calls and123538rendered triangles including shadows. Independent390px
  first-open-offline test also passes. Reports:
  `work/experience/sighs-production-final/report.json` and
  `work/experience/sighs-offline-final/report.json`.
- Full74-guide production regression passes148cases at1440/390 on the same
  revision: current highlight inventory, decoded images, dialogs, sequence
  links, preparation state, exterior canvas/keyboard/zoom/reset and indoor2D
  defaults/layer/floor counts. Report:
  `work/experience/sighs-site-regression/report.json`. This is interaction and
  rendering evidence, not manual source-fidelity acceptance of all screenshots.
- Full tests pass847cases in67files after adding five standalone trial-server
  tests, plus typecheck and lint. The local server uses standard Node modules,
  loopback only, real missing-asset404s, correct JS/RSC MIME and no mutation
  endpoint. Its tests do not replace package or browser-offline checks.
- The user requested an up-to-date trial before the full goal is complete.
  Added `scripts/package-local-preview.mjs`, a Mac launcher and a Chinese
  README distinguishing completed interaction work from remaining content/maps.
  The package contains the static website and local launcher only: no original
  tickets, raw research, credentials, development dependencies or source tree.
  Archive `europe-guide-local-2026-09-09-438aa3a8.zip`,287260860bytes; SHA256
  `4b6ed151e7f4013ff6d641a36abb9d7563e5427cf18327f7c6412325eff72e9a`.
- The actual ZIP was extracted to a new folder; all1360listed files match
  their sizes and SHA256 values, the Mac launcher retains its executable bit,
  and the extracted standalone server reports the same build revision.
  Twelve core-page cases at1440/390 pass with no overflow/runtime errors.
  The exact extracted package then passes all80offline routes with zero
  missing precache entries, including existing map/room/stop inventories,
  entrance defaults and lazy Vatican models. Report:
  `work/experience/local-preview-package/report.json` and its`offline/`reports.
  These results are actual archive checks, not inferred from the source build.
- Started the packaged snapshot at
  `http://127.0.0.1:55911/europe-cultural-guide-2026/` for the requested trial,
  preserving the55910development server. The package's loopback revision probe
  matches`438aa3a844541924195a`. This is a user-requested preliminary trial,
  not a full-goal acceptance request or a public release.

Current coverage: seven improved exterior treatments/67still needing review,
40spatial-source gaps,434selected work/group entries with109expanded/325short,
five visitor-information chapters/69remaining. Whole-compound geometry and
physical-device/Safari/performance acceptance remain open. The local trial
does not mark the full goal achieved or authorize public deployment.
