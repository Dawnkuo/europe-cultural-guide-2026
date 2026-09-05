# Local Rebuild Verification

Date: 2026-09-05 (Asia/Hong_Kong). Target: local Europe guide only.
Status: incomplete. No release approvals, commit, push or deployment.

## Observed Checks

- All 20 floor diagrams were visited in the browser at 390x844. Every extracted place ID and its exact label was compared with the visible 2D DOM. All 332 markers remained present; label boxes stayed inside the map viewport, without page-wide horizontal overflow. This is completeness against the reviewed extraction inventory, not proof of rooms absent from the source.
- All 12 3D pages were visited at 390x844. Every page had exactly one active map canvas and nonzero GPU samples from its actual scene/camera. Console error retrieval after this pass returned no errors.
- Last Supper: clicking non-label floor areas selected the refectory and classroom; selection/highlighting survived switching between 2D and 3D. Accademia: clicking the Gipsoteca floor selected room 5 and survived the same view switch.
- Picasso: dragged from inside the canvas to outside, released, then changed floor and reset successfully. Repeated real ArrowUp key presses rotated to an overlapping view; six hidden lower-floor labels had tabIndex -1. Reset restored visible labels. This is desktop-browser mouse/keyboard evidence, not real multitouch-device certification.
- 2D keeps all room IDs even where the 3D view legitimately occludes a lower-floor label. Occlusion does not delete the canonical place data.
- Desktop screenshots inspected the source-derived maps; portrait screenshots inspected Brera, Accademia and Picasso. A GPU-pixel/DOM pass is not a substitute for detailed visual acceptance of every room.
- Source/geometry tests reject invalid polygons, lost holes and doorway segments that do not follow their room boundary. The ticket-office boundary failed this stronger check and was corrected to retain its jamb vertices.
- After La Scala's seven masonry profiles were filled, its 390x844 2D/3D views were checked again: all eight exact room IDs remained, with no horizontal overflow. The floating onsite launcher was moved into the sticky chapter navigation because it had covered the lower map. Its modal was opened and closed through the real UI; it is portaled to body rather than trapped inside the navigation's stacking context.

## GPU Samples

Each sample is from a 64x64 offscreen target using the viewer's same scene/camera. Non-background counts are compared with the corner color. CPU milliseconds include a single render dispatch and label layout, not GPU frame time or device FPS.

| Draft | Draw Calls | Triangles | Non-Background Samples | CPU ms |
| --- | ---: | ---: | ---: | ---: |
| Uffizi | 21 | 10184 | 529 | 2.80 |
| La Scala (wall-profile revision) | 4 | 14096 | 131 | 0.30 |
| Accademia Florence | 16 | 4984 | 253 | 0.50 |
| Doge's Palace | 59 | 65496 | 799 | 1.10 |
| Last Supper | 16 | 2176 | 296 | 0.40 |
| Picasso Barcelona | 26 | 12784 | 889 | 0.70 |
| Correr | 24 | 11224 | 359 | 0.80 |
| Pitti | 8 | 31580 | 259 | 0.90 |
| Cologne Cathedral | 4 | 714188 | 132 | 0.30 |
| Sagrada Familia | 2 | 52288 | 146 | 0.70 |
| Borghese | 6 | 26400 | 103 | 0.60 |
| Brera | 4 | 92220 | 101 | 1.40 |

Ray picking/occlusion uses a per-mesh BVH, without modifying Three.js global prototypes. The underlying polygons are not simplified for this optimization. See the upstream implementation: https://github.com/gkjohnson/three-mesh-bvh

## Offline Evidence

An earlier production export was served at localhost:55839/europe-cultural-guide-2026/. After the full-cache badge appeared, its own server was terminated. Uffizi still refreshed and switched 2D floors; a full navigation to previously unvisited Pitti still loaded local pictures and its lazy 3D map. This was a stopped-origin test, not an OS-level network-off test.

The content-versioned export `3380263feb8be89570c2` (723 assets, 80 static RSC files, 141,961,782 bytes) was also exercised. After its guide index showed the complete-cache badge, the owned preview server was stopped. Clicking the actual Accademia link loaded the page and its local picture. Switching 2D/3D and changing to the upper floor retained labels 10/11/12/13 and a nonzero-sized 3D canvas, with no browser errors. This was again a stopped-origin test, not OS-level network disablement. The later La Scala geometry revision is not covered by this content hash.

The final export `78caf6e016f08ca13396` (723 assets) includes the La Scala wall profiles and the navigation-mounted onsite launcher. After its complete-cache badge appeared, the owned preview server was stopped again. A real reload retained all eight La Scala room IDs, all seven masonry profiles, the launcher in NAV, and working 2D/3D switching. Error logs were empty. This test covers that final bundle; it is not full offline acceptance of all venues.

## Automated Verification

- 191 Vitest tests across 32 files passed; 9 Python source/geometry tests passed.
- `npm run lint`, `npx tsc --noEmit` and `git diff --check` passed.
- `npm run build:github` exported 81 routes, including 74 native guide pages. Large lazy map chunks still produce the bundler's size warning; no physical-phone FPS claim follows from this successful build.
- `node scripts/audit-architectural-migration.mjs --release` correctly exited 1: 12 drafts, 35 unrebuilt entries, 0/47 approved. Reviews must pin both the source PDF and the generated model digest.
- Only the local development server is left running. Temporary production-preview servers were stopped. No public deployment was attempted.

## Still Required

- Rebuild the 35 untouched inventory entries from inspected spatial evidence, or document a venue-specific limitation after a proper source search.
- Finish room semantics, doors, all route bindings and verified vertical connections across the drafts. There are only 11 semantic spaces across three venues and four explicit openings, not complete building models.
- Resolve missing Pitti/Borghese/Cologne floors, improve the Sagrada source, finish La Scala's unclosed central contours and review any raster text residue in Brera. Seven closed La Scala masonry profiles were separately compared with the source and filled; none contains a Sala anchor.
- Distinguish independent source diagrams from registered architectural floors. Display offsets are not real floor heights or horizontal registration.
- Complete per-venue interaction, detailed desktop/phone visual acceptance, true touch/low-performance-device checks and long-session GPU resource profiling. No 30 FPS phone claim is made.
- Run the release gate only after real acceptance. It currently must report 0/47 ready and block deployment.
