# Sistine Library Architectural Study

Local-only partial geometry, 2026-09-08. NOT an accepted full Vatican museum
compound or current whole-library survey. The study is separate from the
registered campus because no common current vertical datum has been verified.

## Evidence And Reconciliation

- Letarouilly/Simil, *Le Vatican*,1882, volumeII, Belvedere plate14,
  ETH e-rara canvas7007670. Full plate, both scale bars, transverse section,
  and common plan containing library/Braccio/flanks were visually inspected.
  https://www.e-rara.ch/i3f/v20/7007670/full/4000,/0/default.jpg
  Local `work/experience/vatican-compound-source/library-plan-section-4000.jpg`,
  SHA256 `e50a3309c20d0b701240202fba42fd08cc4c3344266e2d5f2fbf33415ae6591a`.
- Fondazione Italcementi/Pesenti, *La Biblioteca Vaticana nelle sue
  architetture: un disegno storico*,54PDFpages. Read relevant text and inspect
  images separately; this is historical synthesis, not a modern BIM model.
  Actual downloaded publication:
  https://fondazionepesenti.it/wp-content/uploads/2011/12/La-Biblioteca-Vaticana-nelle-sue-architetture-un-disegno-storico.pdf
  Local `library-architecture-2011.pdf` in the source directory above,
  SHA256 `10223dd50a9135a20be36de35d6ffc34c7faeb18e9df4cac8cae94abe6eea26b`.
  PDFp31 discusses the Leonine rooms and new connecting stair;
  p40 discusses1931collapse/1933restoration; p42 explicitly labels the
  four-storey periodicals section as an ORIGINAL project, now restructured.
  Do NOT clone that section into a present-day four-floor model.
- Vatican press office,2010-09-13, technical director's restoration report:
  https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2010/09/13/0534/01144.html
  Confirms renewed pitched roof over the Salone Sistino; four-storey wholesale
  interior reconstruction concerns the WEST periodicals deposit, not the
  Sistine hall. New circulation/lifts and lower storage are not modeled here.
- BAV institutional history:
  https://www.vaticanlibrary.va/it/la-biblioteca/la-storia-della-BAV.html
  Confirms the double-aisle hall and quotes70x15m. The plate-based study includes
  spaces at BOTH ends. Its approximate80m extent is NOT identified with that
  70m hall measurement or stretched to fit it. The scope discrepancy remains
  a gate against calling this a modern metric floor plan.

## Geometry Contract

Data: `app/data/vatican-library.ts`. Source coordinates4000x5490, not a resized
screenshot. Plan bar(1521,2687)..(2344,2687)=48m. Section bar
(1527,2557)..(2348,2555)=8m. Separate multipliers about17.146 and102.625px/m.
Picking uncertainty is several source pixels, not sub-centimetre accuracy.

- Both ends and the central double-aisle space remain separate polygons.
  Historical A=library galleries and B=reading-room classifications are not
  relabelled as current operating functions; UI uses neutral connection names.
- All six central dark pier footprints are individually picked. Dotted vault
  diagonals, furniture, lettering and print hatching do not become walls.
- Seven bays per aisle use actual pier centres, not equidistant duplication.
- Side-wall openings remain breaks in the LOW wall trace. Their full current
  sill/lintel heights are not established, so the walls stop at a declared
  display cut1.1m. No invented window schedule or full-height wall extrusion.
- Pier spring height and crown height use the transverse section. Arch frames
  interpolate its envelope; no claim of exact three-dimensional groin vault
  masonry, rib moulding, frescos or coffers.
- Gabled roof is an outline, not a cap. The modern roof's continued pitched
  form is supported by2010report; no historical truss is asserted to survive.
- No lower floors, modern lift shafts, room/artwork pins, public admission or
  route/accessibility claims are added. Itinerary/entry floor remain unchanged.

2D and3D read the same data.3D reuses the existing scene lifecycle/controls,
loading only after selection.2D stays local, inspectable without WebGL.
This adds a partial architectural study, NOT one more completed exterior.

## Verification

`vatican-library-model.test.ts`: independent scales, all piers/bays, distinct
bay spacing, finite merged geometry, open floor ray and explicit scope.
`orthographic-framing.test.ts`: independent whole-model scale, portrait and
rotation projections. Runtime screenshots/interaction reports are recorded
in the progress ledger after execution, not assumed from these unit tests.

Final local export97ac496b408b313eaf8c: four-width study and shared-campus
browser suites, six affected guide-page cases, and all80offline paths pass.
The study uses4draw calls/516triangles. See progress ledger for exact reports.
This does not validate the approximate vaulted-envelope interpolation as
surveyed masonry, reconcile the modern70m description, or supply omitted
wall-profile/pilaster details, roof engineering or complete modern floors.
