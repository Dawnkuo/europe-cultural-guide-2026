# Gallerie dell'Accademia di Venezia read-only acceptance

## Verdict

PASS within the pinned 2026 official-map scope. No blocking source/model defect was found in the current bytes. Runtime and browser acceptance remain with the main thread.

## Pinned inputs

- Official visitor map: `sources/floorplans/accademia-venice-2026.pdf`, page 1, SHA-256 `6809eac6370f94b3a12017d6e243e3789135a4f9c97d1dc810f7c3d462a11264`.
- Config SHA-256: `a75af8bfd6bdc0e7230654d7bb61c0933d717b68e944c6a5f7c22d0396e97d85`.
- Model SHA-256: `206d0faf5e7070944b6f61cfd34afdfb54fe33acf409947fa0ae2fafd2b2a63b`.
- Evidence SHA-256: `c6b0a6d0fa8be9a2fb811958af85edf6aeb02f6d19cd5164550cc310b7c2dc3a`.

## Concrete pass scope

- Both published diagrams are present: `ground` and `first`. The model has 48 places, 228 features, two evidenced vertical links and 24 stop bindings covering all six guide-stop indexes.
- Every unique printed identifier is retained once: ground rooms 1-13 and first-floor I-XXIV plus XIIIa and XIVa, for 39 room anchors. The remaining nine anchors are the source-supported service points.
- The two source fills, native path 845 on ground and native path 843 on first, are explicitly `scope:"floor"`. They are not represented as 39 room polygons and are excluded from room-level semantic selection.
- The independent 64-point source-coordinate regression passes: 30 wall checkpoints, 16 flat detail checkpoints and 18 door-gap clearance checkpoints. The checks reference native `page.get_drawings()` path IDs and cover both floors.
- Door swings and individual stair treads stay flat; room boundaries and perimeter segments stay walls. Source icon leaders, room-number strokes, hatching and decorative dot fields are not promoted to wall geometry.
- The central elevator symbols occupy the corresponding shaft on both official diagrams and form the `gallery-elevator` link. The immediately adjacent matching stair enclosures form the `central-stair` link.
- All manual service labels, floor labels, link labels and limitations are Chinese; printed Arabic/Roman room identifiers are preserved verbatim.

## Bounded limitations

- The map has two exact whole-floor fills only. It must not be described as having individual selectable room boundaries; room focus is anchor-based.
- The current official map prints one room VI and does not separately locate VIa and VIb. Those subdivisions remain unresolved and are not invented.
- The east entrance stair drawings are retained as geometry but are not linked across floors because the source does not explicitly identify them as one continuous stair.
- Independent floor diagrams retain their own source scale and are not asserted to be survey-registered vertically.

## QA artifacts

- `/tmp/europe-map-current-acceptance/qa/accademia-venice-ground-contact.png`
- `/tmp/europe-map-current-acceptance/qa/accademia-venice-first-contact.png`
- `/tmp/europe-map-current-acceptance/qa/accademia-venice-ground-classification-overlay.png`
- `/tmp/europe-map-current-acceptance/qa/accademia-venice-first-classification-overlay.png`
