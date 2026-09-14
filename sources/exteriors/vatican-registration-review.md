# Vatican Campus Horizontal Registration

This is a local, partial compound scene, not a complete reconstruction.

## Evidence and Coordinates

- State plan: <https://m.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/notizie/2023/144_mappa_stato_vaticano.pdf>.
  Measurements use its native2067x2923 embedded image, north to the right.
  The PDF's printed1:1000 is not used as an unverified PDF-point conversion.
- Official exterior: <https://virtual-cdn.basilicasanpietro.va/basilica-viewer/gltf/basilica_low_241217_opt.glb>.
  Runtime uses the previously verified exterior-only extraction. Original
  vertex positions, indices, vertex colours and node transforms remain intact.
- Exact hashes, native control coordinates and selection notes are in
  `vatican-registration-controls.json`. `fit-vatican-registration.mjs`
  regenerates `vatican-registration-fit.json`; the unit test checks the runtime
  coefficients against that result.

Fit the main dome axis and square obelisk with one2D similarity. Hold out
both fountain centres: residuals are1.698/2.830 source pixels, under the
declared5px check threshold. Manual symbol measurements have approximately
2px uncertainty. These residuals do not establish surveyed accuracy.

The transform from original mesh world X,Z to source image U,V is:

```
U = 0.037694703625716953*X - 2.160052845571907*Z + 639.453170280671
V = 2.160052845571907*X + 0.037694703625716953*Z + 1673.5970633468105
```

The viewer divides campus pixels by2.160381722368694 and recentres them at
[1100,1890]. The actual mesh consequently receives only a rotation and
translation, not a nonuniform scale, changed dimensions or mirrored axes.
Its standalone20-unit viewing normalization is not reused for registration.

## What Is and Is Not Three-Dimensional

- Basilica, square, colonnades, Sistine Chapel exterior and the surrounding
  patch contained in the official mesh are genuinely3D. Sistine identification
  and source-height camera framing are documented in `sistine-mesh-review.md`.
  Other campus regions remain the existing
  source-derived flat SVG context, not invented solid roofs or facades.
- The flat underlay is at scene Y=-28, below the source mesh minimum of
  approximately-27.59024. This is a display plane only. No common surveyed
  campus altitude, terrain, accessible ramp or inter-building route is claimed.
- The14 existing region anchors remain area annotations, not entrances,
  room positions, artwork positions or roof heights. Selection frames a
  region for viewing; camera boxes are not building boundaries. The Sistine
  selection marker is a separate roof annotation, derived from the existing
  scan, rather than lifting an area anchor to an invented building height.
- Braccio Nuovo's historical cutaway remains separate. Its common vertical
  datum and historical-to-modern footprint registration are not accepted.
  The PAVM modern roof/balustrade warning applies to the EAST corridor, not
  Braccio Nuovo. That previous attribution is corrected: current Braccio
  roof details remain unverified, not demonstrated to have changed by that
  paragraph. Its original spatial data has not been repositioned.

## Runtime Contract

The campus still opens in2D and the venue still opens at its reviewed indoor
entry floor. The optional3D campus loads Three.js, the original mesh and flat
campus texture only when selected. No new remote asset or model is required.
The14 region choices and reviewed indoor links share selection across views.
On re-entering2D, its transform and scale label both restart at100%.

The scene renders on demand, suspends offscreen and disposes graphics
resources when leaving3D. It offers keyboard pan/zoom/reset, pointer rotation,
touch zoom, responsive framing, fetch failure recovery, real context-loss
retry and a2D escape when WebGL or the dynamic scene module cannot load.
This is not a physical-device30FPS claim. The full compound and other
recorded spatial/content gaps remain open. No public deployment is authorized
by this local verification pass.
