# Sistine Chapel: Existing Mesh Coverage and Focus

Reviewed locally on 2026-09-09. This is source identification and camera
repair, not a newly reconstructed chapel and not a complete Vatican compound.

## Primary Sources

- Vatican Museums, *La Cappella Sistina venti anni dopo*, 2014, PDF page33 /
  printed39, "FABBRICATO":
  <https://www.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/iniziative/eventi/2014/MV_2_Cappella_sistina_20_anni_dopo_guida_it.pdf>.
  Local PDF SHA256:
  `49ede37ea8ea31f551c2ead5980b41d9595ff898878fb28bd71aa4acf89f2aae`.
  The page was rendered and visually reviewed. It gives exterior43.90x17.80m,
  interior40.23x13.41m, vault apex20.70m, total building height approximately38m,
  and six windows per north/south wall. These are documentary dimensions;
  none has been used to rescale the existing scan or establish its Y datum.
- Official St Peter exterior model, unchanged extraction:
  <https://virtual-cdn.basilicasanpietro.va/basilica-viewer/gltf/basilica_low_241217_opt.glb>.
  Runtime `public/models/st-peters-exterior.glb` SHA256:
  `c674af8ffc340d7362ee044b5f3e00312abe91d0484989ed4cb12ea7294f6508`.
- Vatican state plan and the already accepted two-control/two-holdout
  horizontal registration: see `vatican-registration-review.md` and its JSON
  controls. The existing Sistine area annotation remains [797,1784]. It is
  not a surveyed entrance or roof centre and has not been moved.

## Additional Cross-Checks

Letarouilly, *Le Vatican*, Palais Pontifical, ETH/e-rara volume2:

| Plate | IIIF image | SHA256 | Use |
| --- | --- | --- | --- |
| 13 | `https://www.e-rara.ch/i3f/v20/7007760/full/4000,/0/default.jpg` | `2ceef9e292956adfa11147189078f57b9c56bd90d97885e23d05a0d9dd4ff8e0` | Palace, Sistine, Sala Regia, adjacent courts; historical relationships only. |
| 14 | `https://www.e-rara.ch/i3f/v20/7007761/full/4000,/0/default.jpg` | `0046351572b968f75de84ec36d5193bb00ae5cf2d2c833bdbe70247a97d5c31f` | Sistine plan, longitudinal window bays and screen. Not roof elevations. |
| 19 | `https://www.e-rara.ch/i3f/v20/7007766/full/4000,/0/default.jpg` | `c195502f0da1b36062ffdfa4590bc1e613fd4796293f63e480faa41b01927c9a` | Interior decorative bay only; not a full building section. |

The 1978 restoration text in *L'Osservatore della Domenica*, 15 October1978,
discusses removal of later blocking of the guard-walk crenellation:
<https://media.vaticannews.va/media/osservatoreromano/odd/pdf/OsservatoreDellaDomenica_19781015_41.pdf>.
Text could be read online, but local retrieval failed; no claim is made to
have visually verified its photographs. The small Steinmann/Letarouilly
composite from Sacred Architecture was visually inspected but is not used
for precise calibration or new current-state geometry.

## Identification and Reproducible Inspection

`scripts/inspect-sistine-mesh.mjs` loads the unchanged GLB and produces a
top view, two oblique source-space views, and vertical ray samples in
`work/experience/vatican-compound-source/mesh-sistine-*`.

The elongated, raised hipped roof north of the basilica nave is the Sistine
Chapel. Its relative position, independent raised roof, surrounding courts
and adjacent lower structures agree with the registered state plan,
Letarouilly plate13 and the official2014 exterior photograph. It is already
part of the scan's northern context patch; adding another chapel there
would duplicate the source building.

At source X=50, Z=-85 the roof sample is Y=49.385. Adjacent samples at
X=35..70, Z=-85 are Y=49.477..49.251; the long north/south roof slopes at
Z=-90/-80 are around Y=46.8..48.3. These are source mesh coordinates, not
elevations above sea level or a newly asserted surveyed metre grid.

## Camera Repair

- Previous selection used a130x130 flat camera box centred on the area
  annotation at Y=-28. The chapel roof was high above that target; the view
  mostly showed the basilica facade instead.
- New viewing box: source [27,11,-96] to [75,51,-71], transformed with the
  same rigid registration as the mesh. Its centre Y=31 is a framing choice.
  The bounds include margin and are not claimed as building boundaries.
- A steep northern view reduces foreground occlusion. A gold selection
  ring at [50,50.9,-85] sits just above the sampled ridge, as an annotation,
  not a room, entrance, artwork or new architectural element.
- The complete-campus100% baseline remains unchanged. Reset and zooming
  back to100% retain their existing full-overview contract. Other unmapped
  areas keep their documented flat anchors; no invented heights are added.
- The scope label now explicitly includes the Sistine exterior, while
  retaining the incompleteness of other museum and palace wings. The scan
  has low-resolution/context simplifications; this correction does not
  increase geometric detail or claim a restoration-quality chapel model.
- Indoor coordinates, floor selection, artwork bindings, itinerary and
  source GLB bytes are unchanged. Default venue/campus view remains2D.

Runtime and offline validation results are recorded in the ongoing local
upgrade log after tests, not inferred from source inspection alone.
