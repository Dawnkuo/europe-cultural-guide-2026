# Indoor Map Release Acceptance

Local production revision: `456d77b72f06f2ff8c9e`.

## Scope

- 42 source-derived models, 95 floor diagrams, 1,119 positioned places, 444 selection regions, 31 supported vertical links and 252 stop-to-place bindings.
- All original itinerary, booking and guide-stop records are retained.
- Guide-step badges are derived from the existing 252 stop-to-place bindings at 243 places. They remain separate from source room identifiers in both views; unlocated steps retain their text and explicitly describe the mapping gap.
- Florence Duomo's five exterior/dome steps are not mapped to its ground-floor diagram. The displayed 0/5 status is an evidence gap, not a claim to have completed the dome route.
- Selecting a masked lower-floor stop adjusts only the camera to find a clear angle. Source geometry, stacked floors and occlusion remain intact.
- Each model's exact reviewed coverage and omissions are in its JSON packet. A verified diagram is not a claim that every current public floor, artwork position or access route has been surveyed.
- Chocolate Museum, Gaudi House, Sinopie, Vasari Corridor and Vatican Post remain evidence-limited. They do not receive invented interior geometry.
- Historical plans, independent diagram coordinate systems and unlocated modern stops remain explicit in the individual source reviews and visitor map notes.

## Executed Checks

- 298 Vitest tests across 35 files; 43 Python extraction/geometry tests.
- Lint, TypeScript and GitHub Pages production build passed.
- 126 browser map cases: every model at 1440x1000, 1094x768 and 390x844, including exact floor/place IDs, original label glyphs, guide-number identity, zoom, keyboard, interrupted dragging, stop selection and visible focused 3D badges.
- 42 Chrome CDP touch cases: drag, pinch, cancellation recovery and every floor control. These are emulated tests, not physical-device certification.
- 42 isolated performance cases: 95th-percentile frame intervals below 34ms; each repeated scene-switch case created seven WebGL contexts, disposed six and retained one.
- 240 full-page screenshots: all 80 routes at the three viewport sizes, with indoor canvas readiness/pixels, image decoding, page errors and horizontal overflow checked.
- 80 production routes reloaded offline, including every floor's exact label and guide-number inventory and local images; no precache omissions.
- Source-to-browser comparisons and desktop/phone map contact sheets were visually reviewed. Individual packets pin source, model and shared renderer hashes.

`package-map-acceptance.mjs` assembles these packets only after their checks pass. `audit-architectural-migration.mjs --release` rejects stale model or renderer acceptance before deployment. Post-deployment browser evidence is kept separately from these local-build packets.
