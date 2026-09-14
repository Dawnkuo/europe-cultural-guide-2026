# Colosseum Research Mesh Review, 2026-09-09

## Decision

Research/reference candidate only. **Do not import this mesh into a guide or
count the Colosseum exterior as complete.** Close inspection of the northern
arcades shows recessed, capped openings, faceted parapets and surface noise.
The texture includes visible triangulation. Removing the texture makes these
geometric limits easier to inspect; it does not repair them.

The major ruin relationships are useful: the higher surviving outer ring,
lower exposed inner rings, radial remnants and hypogeum surface differ from
the unreleased procedural study. However, neither representation is accepted
as a complete/current architectural reconstruction. Do not fill the mesh's
holes or cut its capped arches from photos to manufacture an accepted model.

## Source Chain

- Primary research project: https://anttwo.github.io/MACARONS/ (CVPR2023).
- Authors' distribution and preprocessing description:
  https://github.com/Anttwo/MACARONS, dataset section2b. It states that meshes
  were obtained under CC licensing and rotated/scaled for their experiment.
- Public dataset folder:
  https://drive.google.com/drive/folders/1J4yz-5Ii2qfLX2DHLoDdtEcu4OaWPXf_.
- Original credited creator: Brian Trepanier, model
  https://sketchfab.com/3d-models/colosseum-rome-italy-535dc96e586f40bd956ea3cbff810055.
  The original model's capture methodology is not established by the paper.
- Research publication is not evidence of metric survey accuracy, a current
  visitor route, complete arcade topology or2026 restoration conditions.

The official2022 point-cloud illustration download failed TLS negotiation.
The complete official HBIM is described as an internal controlled resource;
no protected service was accessed. Zenodo's network restriction was not
bypassed. The authors' separately published public dataset was accessed
normally; no account or source executable was needed.

## Reproducible Local Conversion

Working files: `work/experience/colosseum-source-study/`.

- Original OBJ226,148,866bytes, SHA256
  `bf8251409aa7d9211e772f1c464a561ec27fbbcb3066a9b2c0e24afe121d4d97`.
- Original texture SHA256
  `e623e6070bb3804eb75232d5dd51f4afb6d097a16b150725a5494b65543f03ab`.
- Full study:1,509,784triangles,94,161,960byte GLB, SHA256
  `e348646ca23b19a3b9c2a4f01be8ff9dbfa434c6910aad1916edcb4a5084960d`.
- Venue-only study:417,071retained triangles,937,212exact position/normal
  tuples,13,556,772bytes, SHA256
  `bd69530cdf05e1c4b92076420cc4d589ab98a371c8a7b099cd0f82ce720985c1`.

`scripts/prepare-colosseum-mesh-study.mjs` parses triangle surfaces with
Three.js OBJLoader. The source also has396loose line records after the faces
within the same object. A narrow adapter inventories and excludes those
explicit lines to avoid OBJLoader turning the whole object into LineSegments.
Three focused tests cover preservation and changed/unsupported inventories.

No face is invented. Parsed float32 positions/normals are retained exactly;
only byte-identical tuples are indexed. The full textured study converts the
OBJ texture V origin to glTF and downsamples the8192texture to4096WebP. The
neutral venue study removes texture and retains whole triangles intersecting
the research dataset's horizontal ROI with a0.35source-unit context margin.
This is a display selection, not an architectural boundary. It leaves jagged
ground edges and partial context objects, another reason it is not release-ready.
Neither version smooths, decimates, closes holes, fills gaps or rescales axes.

## Visual Evidence And Remaining Work

`scripts/inspect-colosseum-mesh.mjs` produces five directions in source-texture
and neutral-material modes at1440and390widths, plus mouse orbit and finite
canvas-pixel checks. The venue variant adds a north-arcade close-up:
`venue-mesh-north-arcade-detail.png`, which exposes capped arch recesses.
These are20view cases per candidate, not20accepted attraction pages.

Still needed before integration: independently supported current-state arch
openings and ring extents, a reviewed perimeter/context treatment, trustworthy
detail geometry and its phone interaction/performance/offline acceptance.
The main application's indoor plans,2D arrival defaults, itinerary and booking
data are untouched by this study. The production export remains unchanged.
