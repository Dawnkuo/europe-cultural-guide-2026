# Florence Exterior Trial

Local-only trial requested on 2026-09-14. No deployment is included.

## Current Status: OSM Restored

The user clarified that replacing the landmark must retain the existing OSM
streets and neighboring buildings in the same 3D scene. The iframe trial did not
meet that requirement. Its guide override has been removed; the guide again
uses its unchanged original local model and OSM context. The scan remains on
`/models#florence-duomo` only. This is a rollback, not a completed scan/OSM fusion.

The selected scan's original file has not been acquired. Sketchfab's documented
download flow requires an authenticated account. Do not extract viewer internals
or overlay independent canvases as a substitute for registered geometry.
Before another replacement, acquire the asset, align scale/orientation/ground
level, account for scanned neighbors and duplicate OSM features, and verify the
composed scene. The earlier trial verification below is historical.

## Scope

- Guide: `/guides/florence-duomo#guide-spatial`, existing exterior tab.
- Candidate: Sketchfab `382fa42bca4346979e673c12e93a2df8`, eyesCloud3D, CC BY 4.0.
- Source: https://sketchfab.com/3d-models/santa-maria-del-fiore-cathedral-florence-382fa42bca4346979e673c12e93a2df8
- Uses the public online viewer, not a downloaded or offline model.
- No decimation, street alignment, or OSM composition is claimed.
- Partial surrounding scan geometry and unverified rear/roof completeness remain source limitations.
- Other guides, indoor 2D/entry-floor defaults, itinerary, and service worker are unchanged by this trial.

## Rollback

Remove only the `'florence-duomo': 'florence-duomo'` entry from
`app/data/guide-exterior-trials.ts`, leaving an empty object.
The guide then renders its original local exterior. Do not reset the worktree.
The original GLB, SVG, exterior-context JSON, and indoor-plan JSON were not changed.

## Failure Behavior

Remote failure/timeout or an offline transition unmounts the online viewer and
uses the original local renderer. Local 3D still requires its original cached
assets; first-use offline rendering is not guaranteed. The guide and previously
loaded indoor 2D remain usable. A failure retry is not a model-selection control.

Keep the fallback React component bundled with the guide exterior wrapper.
Making that component a second lazy import caused a first-use offline transition
to reach the page error boundary; that case was reproduced and retested after fixing it.

## Verification

- 79 focused component tests passed; TypeScript and scoped lint passed.
- `scripts/qa-florence-exterior-trial.mjs`: desktop/mobile online readiness,
  nonblank pixels, mouse rotation, reset, interior selection preservation,
  blocked remote fallback, warm offline transition, and overflow checks passed.
- First-use offline transition was tested separately: guide and indoor 2D stayed usable.
- Guide viewer framing uses a landscape aspect ratio at intermediate widths too,
  rather than a mobile-only breakpoint that cropped the bell tower in a narrow app panel.
- This is browser testing, not a physical-phone performance or fresh offline-load certification.
