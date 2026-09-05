# Indoor Map Release Acceptance

Local production revision: `b3029fc4fe115b7524e5`.

## Scope

- 42 source-derived models, 95 floor diagrams, 1,119 positioned places, 444 selection regions, 31 supported vertical links and 252 stop-to-place bindings.
- All original itinerary, booking and guide-stop records are retained.
- Each model's exact reviewed coverage and omissions are in its JSON packet. A verified diagram is not a claim that every current public floor, artwork position or access route has been surveyed.
- Chocolate Museum, Gaudi House, Sinopie, Vasari Corridor and Vatican Post remain evidence-limited. They do not receive invented interior geometry.
- Historical plans, independent diagram coordinate systems and unlocated modern stops remain explicit in the individual source reviews and visitor map notes.

## Executed Checks

- 293 Vitest tests across 35 files; 43 Python extraction/geometry tests.
- Lint, TypeScript and GitHub Pages production build passed.
- 126 browser map cases: every model at 1440x1000, 1094x768 and 390x844, including exact floor/place IDs, labels, zoom, keyboard, interrupted dragging and stop selection.
- 42 Chrome CDP touch cases: drag, pinch, cancellation recovery and every floor control. These are emulated tests, not physical-device certification.
- 42 isolated performance cases: 95th-percentile frame intervals below 34ms; each repeated scene-switch case created seven WebGL contexts, disposed six and retained one.
- 240 full-page screenshots: all 80 routes at the three viewport sizes, with indoor canvas readiness/pixels, image decoding, page errors and horizontal overflow checked.
- 80 production routes reloaded offline, including every floor's exact label inventory and local images; no precache omissions.
- Source-to-browser comparisons and desktop/phone map contact sheets were visually reviewed. Individual packets pin source, model and shared renderer hashes.

`package-map-acceptance.mjs` assembles these packets only after their checks pass. `audit-architectural-migration.mjs --release` rejects stale model or renderer acceptance before deployment. Post-deployment browser evidence is kept separately from these local-build packets.
