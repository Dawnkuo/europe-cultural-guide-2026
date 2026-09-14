# Vatican Compound: Source Review

Reviewed locally on 2026-09-08. This is progress towards the complete exterior,
not acceptance of the existing coarse model or a replacement model release.

## Source Records

1. Vatican Museums, `Mappa turistica dello Stato della Citta del Vaticano`:
   https://m.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/notizie/2023/144_mappa_stato_vaticano.pdf
   Local file: `work/experience/vatican-compound-source/state-plan-2023.pdf`.
   SHA256: `fa1697d17ed7247aa471c7d1f6e3492c5ac57de3218e57a2b65bb3e2f54cdb9a`.
   One A4 page, one 2067x2923 embedded image, no vector paths. The publication
   path says 2023; the drawing itself does not establish a 2023 survey date.
   Visually inspected the full native image, not just OCR. The compass puts
   north at the right. The printed 1:1000 cannot be applied to the resized A4
   page as metres per PDF point. No real-world scale is assigned yet.

2. Vatican Museums, architectural-superintendence presentation, 2012:
   https://www.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/iniziative/spazioincontro/2012/2_Restauro_patr_architettonico_IV_sovrintendenza.pdf
   Local file: `work/experience/vatican-compound-source/restoration-2012.pdf`.
   SHA256: `ca6f0f9b156796bc4b7a8073991c3754c22a21d0bc6f36eb869c4a2e518cfa21`.
   Page 1 shows a cropped east Belvedere elevation detail (bays II-IV) and an
   Urban VIII chapel survey. It does NOT contain complete museum elevations,
   roof profiles or a registered whole-compound model. Do not repeat this bay
   detail along every wing or treat the chapel as the entire museum.

3. Archimede Arte, project owner's description of the Vatican GIS survey:
   https://www.gestionearte.it/scheda_news.asp?id_news=7669750
   https://archimedearte.it/il-ricordo-di-antonio-paolucci-pioniere-nella-digitalizzazione-del-patrimonio-artistico-grazie-a-lui-le-metodologie-3d-di-archimede-arte-sono-entrate-nei-musei-vaticani/
   These document a laser/photogrammetric survey and resulting panoramas. The
   inspected public pages do not supply a complete downloadable model. A
   statement that a survey exists is not possession of its geometry. Do not
   substitute a 360-degree panorama for a 3D building mesh.

## Supported Relationships

The state plan provides the missing whole-compound context: Pinacoteca and
the newer museum buildings around Giardino Quadrato; Pigna and Belvedere
courtyards with transverse buildings; the palace complex, Sistine Chapel,
St Peter's Basilica and square. It can establish their plan relationships at
the source's graphic resolution. It is not a floor-by-floor museum guide.

The current Vatican exterior in `guide-3d-models.ts` is seven generic parts
with no accepted source registration. It is still pending replacement. The
official St Peter exterior GLB covers the basilica and square, not the museum
wings; the remaining small meshes in that original GLB are not a hidden
complete Vatican model.

## Reproducible First Extraction

Run:

```sh
/tmp/europe-guide-map-runtime/bin/python scripts/trace-vatican-compound-source.py work/experience/vatican-compound-source/state-plan-2023.pdf
/tmp/europe-guide-map-runtime/bin/python scripts/test_vatican_compound_trace.py
```

The extractor pins the PDF hash and image dimensions. It selects a documented
HSV range of coloured source ink and excludes printed margins and the door
photo inset. It performs no morphological closing, hole filling, contour
simplification or synthetic drawing. Unit pixel cells are joined into valid
polygons, keeping even one-pixel fragments. Original axes and aspect ratio
remain unchanged.

Result: 445,654 selected pixels, 445,654 square-pixel vector area, 1,028 source
fragments and 398 holes, with no topology repairs. Independently rasterizing
the serialized polygons at source pixel centres reproduced the complete
selected mask with zero differences and zero overlapping cells. Five focused
tests cover single pixels, corner contacts, courtyard holes, one-pixel gaps,
asymmetric axes and empty input.

Outputs are internal under `work/experience/vatican-compound-source/trace`:
`source.png`, `selected-mask.png`, `trace.json`, `trace.svg` and `render.png`.
JSON SHA256: `35846f17a0dbb9c48ec1805364638c1c787fa29a0b4b91d3334581633cad50b5`.
SVG SHA256: `ce0ad987d183b9f1fe6e34f97b62858cd50d401dd2a9de867530703320e08a33`.
Visually compared the result with the source. The selection correctly exposes
the long compound and courtyards but also demonstrates why colour tracing is
NOT a ready building model: printed number badges leave false holes, outlines
and lettering fragment building fills, and the largely grey square colonnades
are not in the orange colour class. Fragment counts are not room/building
counts. None of this output is imported by the app or copied into public.

## Subsequent 2D Campus Module

`vatican-campus-review.md` records a separately classified, source-derived 2D
overview now available locally. It has fourteen selectable area associations
and links to the existing visitor plans. This does not promote the unclassified
trace above to building geometry or replace the seven-part museum exterior.

## Historical Plan and Elevation Acquisition

Paul Letarouilly, edited by Alphonse Simil, *Le Vatican et la basilique de
Saint-Pierre de Rome*, 1882, ETH Library e-rara:

- Volume1: https://www.e-rara.ch/zut/content/titleinfo/7007483
  IIIF manifest: https://www.e-rara.ch/i3f/v20/7007483/manifest
  Cached manifest SHA256:
  `1baba255cbb9aec0555315f73b264851858a61394e7fb6c0c6063b9da631ed02`.
- Volume2: https://www.e-rara.ch/zut/content/titleinfo/7007642
  IIIF manifest: https://www.e-rara.ch/i3f/v20/7007642/manifest
  Cached manifest SHA256:
  `0730a007a1f778d9cb0697c1e00b0b3e8b41f31a035b3be93ee282f3f7c25380`.

Selected plates, not entire multi-hundred-megabyte volumes, are cached under
`work/experience/vatican-compound-source`. Reviewed material includes:

- Volume1, Ensemble plate2 (scan142), whole compound orthographic plan, and
  plate3 (scan143, canvas7007628), detailed ground-floor palace plan.
  The latter's4000px image is `palace-ground-4000.jpg`, SHA256
  `dbe7b5a660d04dd6843c27c759d26133cc9ad6934f4654db4962edda5a94f9c7`.
- Volume2, Cour du Belvedere plate6 (scan18, canvas7007662), longitudinal
  sections. The middle and bottom drawings identify then-current west/east
  sides with library and Braccio Nuovo; the top drawing predates the new wing.
  Its graphic scale is0..48metres, not0..40. `belvedere-section-4000.jpg`
  SHA256 is
  `b75022c4e7865995f49edceb78e0e8dd35e92c5bd935fea0e01c6bbd82375080`.
- Plate11 distinguishes Bramante's reconstructed original (A) from altered
  facades (B/C). Plate13 details the Pigna niche and stairs.
- The Chiaramonti chapter (canvases7007825..7007831) contains two plates,
  not seven architectural drawings. Its table of contents and both plates
  were visually reviewed. Plate1 (canvas7007829) gives the Braccio Nuovo
  plan and a transverse section through its central portico/hemicycle;
  plate2 (canvas7007830) is an interior perspective, not another plan.
  `chiaramonti-7007829.jpg` SHA256:
  `a4ab53273c466045ddf7a5b71665bddcd14eec96d1f6fa503fe18f3ecba19579`.
  Its higher-resolution copy `braccio-nuovo-plan-section-4000.jpg` is from
  https://www.e-rara.ch/i3f/v20/7007829/full/4000,/0/default.jpg ; SHA256
  `dab4b00eb641861c31be5f51692d312480692d0deb62d163cb0ea5ced96739a7`.
  `chiaramonti-7007830.jpg` SHA256:
  `ca98027d219d19ca6d620b3645c182a7c5f3dcc508480e5f4f36eff7f085ea2d`.
  The plan and section have separate graphic scales: calibrate each before
  measuring. Neither plate has yet been accepted as modern mesh geometry.

These are historical architectural evidence, not proof of unchanged modern
conditions. Some plates are reconstructions or unbuilt proposals. Read each
caption, reconcile current footprints and later restorations, establish metric
controls and check registration residuals before deriving a current exterior.
No height or museum mesh has yet been imported from these plates.

### Subsequent Braccio Nuovo Cutaway

The preceding paragraph describes the acquisition milestone. A subsequent
local implementation now uses independently calibrated plan/section features
for an explicitly partial Braccio Nuovo architectural cutaway. See
`braccio-nuovo-review.md` for claims, drawing coordinates and omissions.
Its renderer bypasses the old seven-part museum recipe without pretending
that this one wing is the full museum compound. Current roofs, adjoining
wings and registration to the St Peter mesh remain unaccepted and unfinished.

## Remaining Work

- Classify source boundaries and distinguish true open courts from printed
  badges, lettering, domes and interior plan cutaways. Do not fill holes by
  area alone or count colour fragments as buildings.
- Review each museum wing, the transverse library and Braccio Nuovo, entrance,
  Pinacoteca, Pio Clementino and palace in the appropriate current plan.
- Register the accepted planar features to the St Peter mesh using multiple
  supported landmarks and independent residual checks, not visual nudging.
- Obtain usable height/elevation/roof evidence before a faithful exterior
  reconstruction. Unverified heights must not be presented as actual geometry.
- Build named, selectable regions and coherent whole-compound framing; retain
  existing reviewed indoor floor and work bindings. Do not infer a walkable
  connection or replace the user's itinerary from mere plan adjacency.
- Then perform local desktop/mobile, interaction, geometry and offline QA.
  Public deployment remains prohibited until the user's local acceptance.
