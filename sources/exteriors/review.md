# Exterior silhouette review, 2026-09-08

These models interpret visible exterior form. They are not measured BIM models,
room maps, photographs, a route graph, or evidence of public access. Stop text
must not be sampled onto a massing recipe's arbitrary line. No scene coordinates
are assigned to guide stops without a separately reviewed binding.

## Pisa Leaning Tower

The local exterior now uses the2001 laser-survey publication's dimensioned
sections and six separately specified loggia levels. Base, open column rings,
counter-curved hollow shaft and reduced bell chamber replace the former
seven-cylinder recipe. The rendering preserves true arch passages and open
central wells; it does not fabricate an internal stair model or current bell
positions. Primary sources, hashes, coordinates, simplified details and
verification boundaries are in `sources/exteriors/pisa-review.md`.

This is the sixth improved venue exterior treatment, not the sixth fully
surveyed model. The other68 exterior chapters and complete-site acceptance
remain outstanding. Tests of rendering/interaction do not close evidence gaps.

## Colosseum research and unreleased arcade study

A second, independently acquired research mesh has now been converted and
visually inspected. Its capped arcade recesses and faceted surfaces fail the
detail gate; it remains outside all application routes. Source hashes,
conversion and close-up evidence are in `colosseum-mesh-review.md`. Neither
the research mesh nor the procedural study increments completed coverage.

- Soane drawing SM115/2, c.1513-14:
  https://collections.soane.org/ARC10192. Plan is a four-centre oval, not a simple
  ellipse;80 bays. Historical idealization omits some stair detail and cannot
  directly establish today's surviving ruin. Inspected image571x768; long axis
  vertical, centre approximately(289,380). No formal geometry trace committed.
- Soane SM115/41a: https://collections.soane.org/ARC16675. Three north bays,
  three arcaded orders and attic; historical reconstructed stairs/awning poles
  are not automatically current features. Inspected image572x768.
- Official restoration page: https://colosseo.it/restauri/colosseo/. Records
  recent3D/HBIM work, north upper levels and Stern/Valadier buttresses. No
  accessible complete3D download located.
- https://colosseo.it/en/southern-ambulatories/ and
  https://colosseo.it/evento/tutela-piazza-colosseo-scavo-settore-sud/ describe the
  lost outer southern rings, sectors XVIII-LX, and modern ground-surface work.
  Paving that indicates a former footprint must not be modelled as rebuilt walls.
- Official82MB booklet exceeded the web reader's limit; local TLS/download
  attempts failed. Other institutional PDF403 responses were not bypassed.
  These failures are access limits, not evidence that the current ruin geometry
  is known. Keep this model pending until trace and current-form review exist.
- Additional primary publication obtained and visually reviewed: Coccia, Como,
  Conforto and Ianniruberto, "Historical Static Analysis of the Coliseum",
  Proceedings of the Second International Congress on Construction History
  (2006), pp.759-776. Author/institution record:
  https://art.torvergata.it/handle/2108/25987. Public paper copy:
  https://the-colosseum.net/docs/Coccia%20Como%20Conforto%20-%20Statical%20analysis.pdf.
  The Cambridge-hosted URL returned HTML rather than a PDF; the paper mirror
  supplied the actual18-page document. Fig.6 (p.765) reproduces Rea2002's
  current first-level plan. This is not a hypogeum plan or a height survey.
- `scripts/trace-colosseum-current-plan.py` extracts the1081x825 source figure
  with PyMuPDF and a reviewed radial-pier-zone mask. Its176 polygon parts are
  an **unreviewed selection**, not176 rooms or complete map coverage. All rings
  are valid after40 logged GEOS topology repairs;38 small components remain
  unclassified. Closing/threshold effects and each component must be reviewed
  against the source before any extrusion. Source PDF/hash, original figure,
  trace SVG, rejected components and parameters live in
  `work/experience/colosseum-source-study`. No source figure is a site asset.
- `sources/exteriors/studies/colosseum.ts` is deliberately not imported by a
  guide. The four-centre fit uses equal units: half-axes94/78m and the paper's
 69m minimum radius, with tangent side-circle centres derived analytically.
  These dimensions define an illustrative fit, not surveyed pier positions.
  Facade panels contain actual holes; northern exterior and lower inner ring
  are distinct. There is no solid arena lid, invented seating bowl or velarium.
- The study is **not accepted as the existing ruin**. The paper's39 surviving
  arches, official lost-sector XVIII-LX description, historical bay widths,
  modern buttress envelopes, upper windows and each ring's surviving extent
  still require reconciliation. Repeated lower-ring panels are only an arcade
  construction study, not an accepted current-state wall/height inventory.
  The second northern ambulatory, cavea, radial supports and hypogeum have not
  been authored into this study. Do not count it as the fourth finished model.
- Study-only verification:3 unit tests passed (curve continuity/equal scale,
  finite batched geometry, open arch and arena ray tests). Browser1440/390
  screenshots passed nonblank pixel checks and mouse orbit with no page errors.
  These tests do not establish architectural correctness, touch performance
  or release readiness. The main guide/default2D remains unchanged.

## St Peter Basilica And Square: Official Exterior Geometry

- Public visitor experience inspected:
  https://virtual.basilicasanpietro.va/it/basilica-viewer/st-peters-square.
  Its normal client configuration loads
  https://virtual-cdn.basilicasanpietro.va/basilica-viewer/config/basilicaconfig_2025.json.
  The configuration's `parentFile` points to
  https://virtual-cdn.basilicasanpietro.va/basilica-viewer/gltf/basilica_low_241217_opt.glb.
  Retrieved normally without authentication or bypass. Original 14,733,672 bytes;
  SHA256 `da626a28c1c791908cb0872f40ccdd44e1ec7ab491bb5600063e6b20be9417b5`.
- The complete source contains41 meshes/266 nodes, including camera helpers,
  interior, grottes, collision volumes and an independent exterior mesh. Only
  `EXTERIOR_PARENT > exteriorMesh` enters the website. Source vertex colors
  are retained; no downloaded texture, remote image or online viewer is needed.
- `scripts/extract-st-peters-exterior.mjs` decodes the shared meshopt buffers,
  selects the exterior accessor slices and losslessly re-encodes them into the
  local `public/models/st-peters-exterior.glb` (7,101,684 bytes). All684,737
  exterior vertices and501,503 triangles remain. No simplification, smoothing,
  invented ornaments or resampling is applied. The source transforms and all
  decoded position, normal, color and index byte hashes match the output.
  Provenance and accessor hashes: `sources/exteriors/st-peters-model.json`.
- Visually inspected the source in front/rear/overhead views, both clay and
  vertex color. It depicts the basilica's actual facade, drum, lantern, domes,
  roof articulation, open colonnades, obelisk, fountains and nearby context.
  The published low-detail geometry has irregular triangulated boundary caps
  and surface noise. It is not a measured BIM, a current access map, or proof of
  each tiny ornament's accuracy. Do not equate its vertex total with room count
  or collection completeness.
- `app/lib/st-peters-model.ts` applies a rigid90-degree turn and uniform scale
  to present the square in front of the basilica. No independent axis scaling.
  Camera regions are visual framing boxes only: source x about100 corresponds
  to the facade (the source's facade POI is x100.606926); the obelisk POI is
  x291.510468. These do not define walls, floors, route segments or artwork
  locations. Both guide chapters share this exterior asset, while their own
  native content and the basilica's default2D entrance floor remain separate.
- The exterior loads on demand. Interrupted fetches are aborted; abandoned
  decoded models are disposed before a renderer is allocated. Failure retains
  a local static image and retry control. `scripts/render-st-peters-fallback.mjs`
  renders that image from the same local mesh, not an unrelated photograph.
  The GLB and fallback are included in the offline manifest and revision hash.
- Final local revision `91f5a8b5994031be3c90`: all148 guide viewport cases and
 80 offline routes passed, including first opening both St Peter exterior
  chapters while offline. Four-width focused QA covers region framing, default
  view, keyboard/mouse, interrupted loading, static fallback and retry. Final
  production QA additionally forces WebGL context loss and confirms that retry
  creates a fresh canvas;12 exit cycles release their old contexts. Headless
  Mac Chrome frame samples are about60FPS at1440/390, not physical-phone proof.
  Exact reports are under `work/experience/st-peters-source`. Full-product
  acceptance and the Vatican museum-wing exterior are still outstanding.

### Superseded Manual Study

- Before finding the GLB, a current roof/plaza overhead image was inspected at
  https://virtual-cdn.basilicasanpietro.va/explore-the-basilica/plaza.webp
  (1400x1976; SHA256
  `0cb7a033575c7e6eb956c144783dcf2b37f20af5376fe86077b16d0275f258ae`).
  Facade photographs and Fontana's1694 drawings informed a silhouette study.
  The Tohoku primary digitization is
  https://touda.tohoku.ac.jp/portal/item/13010000000001 with the public manifest
  https://touda.tohoku.ac.jp/collection/iiif/0/metadata/13010000000001/manifest.json.
  Canvas140 shows plan/colonnade detail;160 the column order;195 the drum plan.
  Some Fontana elevations include unexecuted small high domes and are not
  evidence for present-day roof form. Those extra domes were excluded.
- Official current references:
  https://www.basilicasanpietro.va/it/san-pietro/la-cupola and
  https://www.basilicasanpietro.va/it/san-pietro/la-piazza.
  Facade photographs were cross-checked at
  https://stpetersbasilica.info/Exterior/Facade/Facade.htm.
- This study is retained under `sources/exteriors/studies/st-peters-*` for audit
  only. It is not imported by the app. Its curve-sampled column/statue positions
  were not individually verified, so totals284/140 in those study tests never
  constituted positional acceptance. The official mesh supersedes it. The old
  `work/experience/st-peters-source/plan-overlay.png` predates a boundary correction
  and must not be reused as an accepted plan trace or current website screenshot.

## Pantheon

- Sir John Soane's Museum, drawing45/3/52: https://www.soane.org/plan-pantheon
  Plan reviewed at856x565. Front column centers u774, v144/183/222/261/302/341/380/418;
  back rows u736 and697, v144/222/341/418. Origin370,280 and uniform scale0.022.
  This corrects the former seven-column front and solid portico box.
- Museo Tattile Statale Omero: https://museoomero.it/en/opere/the-pantheon/
  Archival model photograph visually confirms8+4+4 columns, open portico,
  pitched pediment, intermediate block, brick-faced drum and stepped dome.
- Francesco Piranesi,1786, longitudinal section, University of Tokyo Library:
  https://da.dl.itc.u-tokyo.ac.jp/portal/assets/6a15d9db-97d9-4e7c-bb91-8f2a7b7172e8
  IIIF image0000-0000-2017-0301.tif reviewed at1800px. The external dome profile
  is traced in equal x/y scale0.0108, axis724 and floor1025, including seven
  stepped haunch courses and the open crown. Historical inscription/chronology
  hypotheses are not adopted as modern facts. This is a silhouette study,
  not a current measured model or reconstruction of the seven interior chapels.
- Capitals are simplified envelopes; repeated leaves/roof joints are material
  articulation, not a surveyed ornament count. Actual 2D indoor data remains
  unchanged and separate. The portico and oculus must remain visibly open.

## Sagrada Familia

- Official booklet 10, page 2: tower-group location diagram and exterior elevation.
  https://sagradafamilia.org/documents/20142/1205286/SF_Booklet_10_20240415_digital_AF.pdf/504e0081-e3b7-43ff-be2c-0efb05e2ebaf
- Pages 3-4 distinguish ribbed parabolic bell towers (12 ribs at Nativity,
  14 at Passion) from the central lanterns. The model represents this silhouette;
  repeated louvre bands do not purport to count all as-built openings.
- https://sagradafamilia.org/en/history-of-the-temple records the final cross arm
  installed on 20 February 2026. This exterior depicts the 14 erected towers,
  not the four projected Glory towers. Mary lies above the apse, Jesus at the
  crossing, with the four Evangelists around it and apostle groups at the sides.
- Coordinates are normalized relative to the printed diagram. Tower silhouettes
  and relative heights are diagrammatic. Symbolic Evangelist terminals remain
  small neutral forms; no invented figurative sculptures are presented as copies.

## Casa Batllo

- Official facade overview and close-up inspected:
  https://www.casabatllo.es/en/antoni-gaudi/casa-batllo/facade/
  https://www.casabatllo.es/wp-content/uploads/2025/06/Web_Facana-1.jpg
- Front elevation signed Hiroya Tanaka, August 1990, scale 1:50, reproduced at:
  https://es.wikiarquitectura.com/wp-content/uploads/2017/01/La_Casa_batllC3B3_dib_Hiroya_Tanaka.jpg
  Source drawing boundaries x305..930, ground y1595 in the displayed 1235px-wide
  review. Model uses x=(sourceX-617.5)/100, y=(1595-sourceY)/100.
- Four upper window columns; eight mask balconies and a distinct attic tulip;
  projecting noble-floor glass bay; left-of-centre turret and four-arm cross;
  non-symmetric dragon ridge. These are not repeated anonymous house primitives.
- Front coordinates follow the elevation. Depth, balcony relief and rear bulk
  are approximate massing, not a reconstructed interior or measured whole-site
  footprint. Ceramic discs are a material pattern, not a count of original tiles.
- Sources are for internal verification. Neither original source image nor PDF
  is embedded in the public map.

## Bridge of Sighs

- The official MUVE loggia plan supports two adjacent separated passages;
  reviewed southern MUVE and northern primary photographs support the open
  arch, four grille windows, pilasters, cornices and different central shields.
- The new source-normalized model is isolated to this chapter. It has real
  passage/window/arch voids, four camera ranges and a same-model local fallback.
  Neighboring palace/prison blocks and purported street entrances are not added.
- Full sources, hashes, derivation and production/offline evidence are recorded
  in `sources/exteriors/sighs-review.md`. Hidden roof dimensions, figurative
  sculpture, fine carving and current measured geometry remain unverified.
  This is the seventh improved treatment, not a seventh fully accepted survey.
