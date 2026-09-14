# Interpretation review, 2026-09-08

Authored visitor observations are separate from the catalog and its stable IDs.
Records below enrich reviewed works; new reference additions are appended to
the existing catalog. They do not change itinerary order,
bookings, admission entitlements, or assign new physical coordinates.

| Existing work ID | Primary catalog | Reviewed facts and uncertainty |
| --- | --- | --- |
| uffizi-highlight-1 | https://www.uffizi.it/en/artworks/botticelli-spring | Medium, 207 x 319 cm, 1890 n.8360, domestic context; iconographic interpretation not unique. Gallery manifest is separate. |
| uffizi-birth-venus | https://www.uffizi.it/en/artworks/birth-of-venus | Canvas tempera, 172.5 x 278.5 cm, 1890 n.878; patron remains uncertain; depiction is arrival at shore. |
| uffizi-highlight-2 | https://www.uffizi.it/en/artworks/annunciation | c.1472, A35, oil on wood, 90 x 222 cm, 1890 n.1618; commission and original location unknown. Low/right view is a hypothesis, not a recovered installation. |
| uffizi-highlight-3 | https://www.uffizi.it/en/artworks/holy-family-known-as-the-doni-tondo | A38, tempera grassa, diameter120cm, 1890 n.1456. Header dates1505-06 but catalog discusses1507; retain both rather than silently settle it. Original carved frame. |
| borghese-highlight-1 | https://www.collezionegalleriaborghese.it/en/opere/apollo-and-daphne | CV, room3, 1622-25, Carrara marble, h243cm; original wall placement favored Apollo's right side. Current room anchor is not the original sculpture position. |
| borghese-highlight-2 | https://www.collezionegalleriaborghese.it/opere/ratto-di-proserpina | CCLXVIII, room4, 1621-22, white marble, h255cm without base; transfer to Ludovisi1622, state purchase1908. Narrative is abduction/resistance. |
| borghese-david | https://www.collezionegalleriaborghese.it/en/opere/david | LXXVII, room2, 1623-24, white marble, h170cm. Catalog questions Carrara provenance; not asserted. Original wall placement explains unfinished back. |
| vatican-museums-highlight-2 | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/Cortile-Ottagono/laocoonte.html | Vatican's c.40-30BCE date remains disputed; 1506 discovery and JuliusII acquisition. No exact present display coordinate inferred. |
| vatican-museums-highlight-1 | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/la-pinacoteca/sala-viii---secolo-xvi/raffaello-sanzio--trasfigurazione.html | Narbonne commission, subsequent Montorio altar, combined successive narratives. Medium/date corroborated by Vatican News below; do not import the reference's canvas-transfer claim. |
| vatican-museums-highlight-3 | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/sala-delle-muse/torso-del-belvedere.html | 1st century BCE, signed Apollonios, acquired1530-36; Ajax is a hypothesis. No fabricated missing limbs or current object pin. |
| vatican-apollo | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/Cortile-Ottagono/apollo-del-belvedere.html | Early2nd century Roman copy, probable Greek prototype by Leochares. Recent rear support and Baia-based left-hand restoration distinguish present sculpture from older photographs. |
| vatican-jerome | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/la-pinacoteca/sala-ix---secolo-xv-xvi/leonardo-da-vinci--s--girolamo.html | c.1481-82, uncertain origin, five cut panel pieces vs traditional two-piece discovery story,1856 acquisition. |
| vatican-caravaggio | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/la-pinacoteca/sala-xii---secolo-xvii/caravaggio--deposizione-dalla-croce.html | Vittrice chapel,1817 return. Depicts anointing-stone placement, not a body already inside a tomb. Existing c.1600-04 dating retained;1603 sort key only approximates that interval. |

Transfiguration medium/date: https://www.vaticannews.va/it/vaticano/news/2021-08/trasfigurazione-raffaello-pinacoteca-vaticana-musei-arte.html
(1516-20, tempera grassa on panel). The authored observation lists describe the
inspected images; they are not verbatim translations of reference-site prose.

## Reference image acceptance, 2026-09-08

Paths below are under `public/vatican-guide/assets/images/`, already vendored from
the user's reference. Each was opened at its native resolution before selection.

- `87a903cd3ef4e8f849.webp`: Transfiguration full composition,960x1447; keep.
- `cacdad5c08411de1a1.webp`: Transfiguration upper detail,981x734; keep.
- `04d8e6ddc16448942f.webp`: another full composition,566x820; omit redundancy.
- `327dbec0ea6a54fede.webp`: framed Entombment,870x938; keep as display context,
  explicitly not its original altar placement. Pair with the existing catalog
  photograph `/images/collection/vatican-caravaggio-cdbc0c9644.jpg`.
- `1407ce707041bfc94c.webp`: duplicate complete Entombment; do not inflate count.
- `8d2f5658674f120e04.webp`: torso black-and-white image,879x1079; keep as primary.
- `d1875b814c7f84bf37.webp` and the previously reviewed derivative
  `/images/reviewed/2a88c00fb056997178-d90bdbfff1.webp`: stock-watermarked torso;
  not selected. This replaces the prior derivative in the current catalog.
- `ad2b734eeb6b0c86f0.webp`, `2a88c00fb056997178.webp`,
  `ebb38c08c72f3d2e02.webp`, `7c3d9b48250c4b31d0.webp`,
  `07f2b01203d6b7f52c.webp`: tiny thumbnails; not suitable for detail galleries.
- `a91f379bff0a72c228.webp`: geography gallery, not Apollo. Reject that association.
- `1b0c44e9aa481797e4.webp`: Jerome full composition; valid subject but not an
  additional view distinct from the existing full catalog image.

## Reference catalog inspection

User reference repository: https://github.com/dawnkuo/vatican-offline-guide
Inspected commit: c873bd44cb7d3be3a06c6d7684648c87d9b805d1.
`scripts/extract-reference-works.mjs` statically decodes its45 work records without
executing reference JavaScript. Output goes to the ignored internal work folder.

This is a structure/media candidate inventory, not a blanket factual approval.
In particular, do not import claims about a reclining Michelangelo, an
Etruscan-language inscription on the Mars of Todi, repeated source photographs,
unverified work-to-hall assignments, or low-resolution details merely because
the reference contains them. Retain current verified 2D geometry/entrance floors;
the reference's exterior masses are not evidence for room-level reconstruction.

## Reference additions reviewed 2026-09-08

The supplemental `collection-reference-metadata.json` is hand-reviewed and
independent from generated legacy metadata. Five new objects append to the
existing 26 Vatican highlights, retaining all previous IDs and catalog order.
With the three separately reviewed Sistine additions below, it is an interpreted
selection of 35 after the Angelico addition, not a claim to contain the whole museum.

| New work ID | Primary catalog | Review |
| --- | --- | --- |
| vatican-hermes | https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/Cortile-Ottagono/hermes-del-belvedere.html | Hadrianic, found c.1540 near Hadrian mausoleum, Paul III purchase; historical Antinous naming vs Hermes Psychopompos.125 is approximate sorting key, not a precise production date. |
| vatican-perseus | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/museo-pio-clementino/Cortile-Ottagono/perseo-trionfante.html | Late1800-early1801; PiusVII purchase, Apollo pedestal after Tolentino removal. Vatican2024 Canova publication https://static.museivaticani.va/kkshop/Musei-Vaticani/Antonio-Canova-nei-Musei-Vaticani/D1348/2_1505.do confirms1802 purchase and two boxers. Not the only modern sculpture, not the later Met version. |
| vatican-stefaneschi | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/la-pinacoteca/sala-ii---secolo-xiii-xv/giotto-di-bondone-e-aiuti--trittico-stefaneschi.html | Giotto/workshop1315-20, roomII. Front/faithful: Peter with donor/model, one surviving predella panel. Rear/priest: Christ with Peter/Paul martyrdom, Mary/apostles predella. Original precise altar placement not asserted. |
| vatican-heliodorus | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/stanze-di-raffaello/stanza-di-eliodoro/cacciata-di-eliodoro-dal-tempio.html | 2Maccabees3:21-28, Onias praying, rider/two youths, JuliusII carried at left. Private audience room context: https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/stanze-di-raffaello/stanza-di-eliodoro/stanza-di-eliodoro.html. No invented exact year or direct Laocoon influence claim. |
| vatican-nile | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/braccio-nuovo/Nilo.html |1513 discovery, probable Iseum Campense provenance;16 children/flood cubits, cornucopia/grain/sphinx, Nilotic base. Lost black-basalt prototype remains a possibility. Braccio Nuovo, not the reference's tapestry hall. Room anchor only, not exact statue pin. |

### Additional media acceptance

All files below were visually inspected, not selected by filenames alone.

- `6492423780e249eb59.webp`904x1200: complete Perseus, accepted.
- `000ad71c5703d85d38.webp`981x734: Perseus/Medusa head detail, accepted.
- `0ed6d59576c48c86c0.webp`1800x1350: Canova cabinet with Perseus and two
  boxers, accepted as context, not as another work count.
- `6d755748e105253ac6.webp`806x1800: complete Hermes, accepted.
- `cad09a63846fc348b4.webp`: duplicate Hermes; not another gallery view.
- `b07c6f83e1f8ebd49a.webp`1202x702: full Heliodorus composition, accepted.
- `3e5c36827428e36556.webp`1800x1578: complete Peter-face triptych, clean,
  accepted as catalog thumbnail. Gallery uses matched official front/back photos.
- `2103b99fd4e9061a62.webp`: Christ-face image with signature watermark,
  rejected in favor of the official complete photograph; no watermark removal.
- `d9b91e949742dae685.webp`: cropped stock-watermarked Nile, rejected.
- `ed77a9601c29576a00.webp`, `0ffc4f84cc10560be3.webp`,
  `ba45b1d349e5e0669e.webp`, `cd4eb9da77b0a92c7e.webp`,
  `aa5237788a0059988f.webp`: tiny thumbnails, rejected.

New local museum images in `galleries/vatican-reference-additions.json` were
visually accepted 2026-09-08: Nile1280x844, Peter face952x1280, Christ face1088x1280.
The script records acquisition as `pending` each time it is rerun; this dated
review applies to the currently checked-in hashes. Images are uncropped and
retain the triptych's missing predella panels, frame and supporting furniture.

### Sistine and Raphael review, 2026-09-08

All three new ceiling subjects bind to the existing Sistine room, not invented
ceiling coordinates or separate venue chapters. Date1508-12 is the ceiling
campaign, not an unsupported precise date for each panel. Existing work IDs and
the original26-work order remain intact. Eight additions are appended.

| Work | Primary evidence | Authored limits |
| --- | --- | --- |
| vatican-expulsion | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/storie-centrali/peccato-originale-e-cacciata-dal-paradiso-terrestre.html | Genesis3:1-13 and3:22-24; repeated Adam/Eve, dividing tree. Do not copy reference's wrong panel ordinal or speculative Lilith identity. |
| vatican-deluge | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/storie-centrali/diluvio-universale.html | Genesis6:5-8:19; left flight, middle boat, right high ground, background ark. No wrong panel ordinal, asserted death of carried figure, or invented production motive. |
| vatican-libyan-sibyl | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/sibille-e-profeti/sibilla-libica.html | Picking up OR putting down the book. Prophecy-completed reading remains an interpretation. Seat supports body, not sole toe balance. Seven prophets/five sibyls: https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/sibille-e-profeti.html. Met preparatory drawing is not a Vatican-held work. |
| vatican-museums-highlight-6 | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/storie-centrali/creazione-di-adamo.html | Finger gap, resting athlete vs advancing group; no certain brain-shape or Eve identity claim. Nine central Genesis stories: https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/volta/storie-centrali.html. |
| vatican-museums-highlight-7 | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/cappella-sistina/giudizio-universale.html |1536-41, circular motion, saint attributes, resurrection/damned, Dante figures.1564 and later draperies; do not copy unsupported claim that restoration removed most additions. |
| vatican-museums-highlight-5 | https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/scuola-di-atene.html | Bramante-inspired imaginary architecture; Plato/Timaeus, Aristotle/Ethics; Pythagoras, Diogenes, geometric lesson, Raphael. JuliusII private study/library context: https://www.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/iniziative/mostre/2021/26_dante_effigie.pdf. |

Media visually accepted at current hashes:

- `537d2956ae0d2a6805.webp`1800x1203: Expulsion complete, frame retained.
- `/images/details/vatican-deluge-complete.webp`1800x1183: whole scene and
  painted frame, original pale damaged area retained, not filled by generation.
- `/images/details/vatican-libyan-sibyl-complete.webp`1200x1800: full figure,
  seat and LIBICA plaque; genuine photograph, no upscaling. Photographer and
  license remain in acquisition manifest.
- `f4e2e8fd0a4f3ef42f.webp`1200x800: Adam and hand connection detail, explicitly
  captioned partial rather than complete God-side composition.
- `203ef9794c196d1f2c.webp`1691x1295: Judgment in chapel context, not another
  counted artwork.
- Rejected`f6bcb085448f289cc0.webp`: Athens Alamy-watermarked image. Rejected
  `00a24ca9de664354fc.webp`, `dc20456128e96d783a.webp`,
  `4276f17f5aa6cca1dd.webp`:100-150px thumbnails. No watermark removal.
- Did not use the Libyan fresco/Met-study montage as the primary work photo or
  manufacture extra gallery views from duplicate resizes.

Acquisition sources are in `galleries/vatican-reference-additions.json`. Script
resets visualReview to pending on regeneration; this review is dated and must be
repeated if its source or output hashes change. No public deployment authorized.

### Grottoes scope correction

The legacy `st-peters-basilica-highlight-4` combined Grotte and the lower Roman
necropolis in its title. Kept its ID, existing grottoes photograph and existing
grottoes-only binding; corrected title, caption and access distinction. The
reference Scavi subject was still missing at this stage. The later dedicated
`peter-necropolis` addition below supplies its interpretation, not new geometry.
Do not count this earlier wording correction as a new work or a new floor.

- https://www.basilicasanpietro.va/en/faq/what-are-the-vatican-grottoes-and-the-vatican-necropolis
- https://www.basilicasanpietro.va/en/san-pietro/the-necropolis
- https://virtual.basilicasanpietro.va/en/explore-the-basilica
- Existing photo provenance is `sources/media/replacements-applied.json`,
  Grotte_Vaticane_jun_2025_28.jpg. Visually verified: decorated grottoes corridor,
  not an ancient Roman mausoleum. Its legacy filename is not evidence of subject.

Further rejected reference media: `9d37a1eec592c5ff63.webp` is an Alamy-watermarked
Angelico Madonna photograph. `ca58ec3b62396b617d.webp` is a different multi-panel
altarpiece; `1fed4c26c9dd93fbd0.webp` is the Maps Gallery ceiling. Neither is a
detail view of the Madonna with Dominic and Catherine.

The exact Angelico work is now `vatican-angelico-madonna`, appended after the
previous eight additions. Reviewed primary record:
https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/la-pinacoteca/sala-iii---secolo-xv/beato-angelico--la-madonna-col-bambino-fra-s--domenico-e-s--cate.html.
Unknown original provenance/commission; probable c.1435; small private-devotion
panel; Mary/rose and Dominic/Catherine. Do not invent precise size, material
composition or a certain patron. III room is documented; only Pinacoteca area
is mapped, not a made-up room polygon or hanging position.

`/images/details/vatican-angelico-madonna-complete.webp`974x1280 visually accepted
2026-09-08: complete board, clean detailed photograph, intact edges, no stock
watermarks or enlargement. No false gallery from the other two reference images.

### Remaining reference themes, 2026-09-08

Nine Vatican records and one St Peter record were appended without changing any
existing ID, visit sequence, ticket or booking. Vatican now has44 subjects.
The45-theme correspondence audit now has45 present topics, but only25 pass
the separate enrichment test. Presence does not certify equivalent depth.

| Work | Reviewed evidence and limits |
| --- | --- |
| vatican-borgia | Vatican Borgia Apartment record: six rooms,1492-94, Pinturicchio with collaborators, substantial dry painting/stucco/gold. The Catherine lunette illustrates one room, not every decoration. Three existing apartment-area bindings, no invented wall position. |
| vatican-momo | University of Michigan image record and Vatican2021 bulletin: Momo1932, not Bramante1505. Two clean Colin photographs show the double circulation and shallow steps. Photographic fisheye is not plan geometry. Existing exit-area binding only. |
| vatican-djedmut | Vatican cat.25008: Thebes945-900BCE, outer wooden coffin209x72cm. Lid and case belong to the same outer coffin; inner coffin is in La Rochelle. RoomII catalog and2022-23 RoomI exhibition are distinguished; Egyptian department anchor, no current cabinet position. |
| vatican-lady-shroud | Vatican cat.17953:3rd-century painted linen from Antinopolis,173cm long,13-52cm wide. This is the cloth, not a picture of a mummy. Its documented historical transfer with a mummy does not prove joint current display. |
| vatican-hercules | Vatican Hercules record: dating late1st to early3rd century is disputed; gilt bronze with later plaster repairs, lightning burial,FCS,1864 recovery. Pio Clementino area anchor only. |
| vatican-candelabra | Vatican Gallery record: six sections1785-88, LeoXIII decoration and named19th-century painters. Corrected the reference's chronology. The accepted photo shows sectionI, not the whole gallery. Existing gallery-room binding. |
| vatican-sphere | Columbia MCID work record, Pomodoro Foundation and Barbara Jatta in L'Osservatore Romano:1990 bronze sphere,400cm. Courtyard location only; no visitor-touch claim or one definitive allegory. |
| vatican-sistine-hall | Vatican Library history, Vatican News and2013 museum publication:1587-89,70x15m, double nave/library context. Not the Sistine Chapel and not interchangeable with library museum label15. No map pin; access limitation explicit. |
| vatican-dogmatic | Vatican Pio Cristiano double-register sarcophagus record:about340, unfinished couple portraits, OT/NT scenes. Trinity is an interpretation, not the only certain identification. Pio Cristiano18 anchor, not Museo Cristiano14 or Pinacoteca. |
| peter-necropolis | St Peter official necropolis page, Grotte/Scavi FAQ and dedicated reservation page: Roman mausolea below the basilica, distinct from the upper grottoes. No fabricated floor, route or booking entitlement. |

Primary URLs and acquisition hashes are retained in
`collection-reference-metadata.json` and
`galleries/vatican-reference-additions.json`. No public source text was added.

Media accepted after visual inspection at their manifest output hashes:

- Borgia Catherine1243x800: full lunette, clean, not stock-watermarked.
- Momo downward1800x1144 and upward1800x1185: two genuinely different views,
  Colin / Wikimedia Commons, CC BY-SA3.0 verified on both file pages.
- Candelabra1800x1200: Fabrizio Garrisi's sectionI, not Braccio Nuovo.
- Sphere1280x720: official news photograph of the actual courtyard work.
- Hercules859x1280 and Dogmatic1280x853: complete objects, not cropped stock.
- Djedmut lid1041x1280 and case822x1280: same coffin, differentiated captions.
- Lady shroud639x1280: genuine damage and irregular edges retained.
- Necropolis975x1125: brick funerary passage, not the upper grottoes.
- Existing `894ba2e57fe4237e03.webp`1800x1050: accepted Salone Sistino
  two-aisled library photograph. No invented gallery from duplicate photographs.

Rejected reference alternatives include tiny Momo/Borgia thumbnails,
watermarked Borgia`6ed3c5d742c6a04da3`, Hercules`f2a0f9095a36680110`,
Sphere`04508b7eb476ab424e`, Salone`f0ee5cf9b286b929ee` and
`3ea67399b4ecb753a1`, Necropolis`a11b9555b83ba6826b`. Candelabra candidate
`2d0e784e80462991c2` actually shows Braccio Nuovo; sarcophagus candidate
`b51b92a6f34d02b613` is a different single-register object. Neither is used.
No watermarks were removed and no replacement was generated from imagination.

### Twenty existing reference themes enriched, 2026-09-08

The following are expanded existing identities, not twenty new catalog objects.
Each now has an authored background and three or four distinct visual observations.
No dates, tickets, visit sequence or geometry were changed. The correspondence
audit now reports45/45 themes enriched; this is not complete collection coverage
for every museum and does not certify map completeness.

| Work | Reviewed evidence and interpretive boundary |
| --- | --- |
| vatican-keys | [Vatican Keys](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina/parete-nord/storie-di-cristo/consegna-delle-chiavi.html): Matthew16 authority, background tax and stoning, Renaissance central building and Constantine arches. Self-portrait identification remains qualified. |
| vatican-disputation | [Vatican Disputation](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/stanze-di-raffaello/stanza-della-segnatura/disputa-del-ss--sacramento.html): theology, Trinity, Eucharist and church fathers; not a documented hostile debate. |
| vatican-fire-borgo | [Vatican Fire](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/stanze-di-raffaello/stanza-dell-incendio-di-borgo/incendio-di-borgo.html) and room introduction:847 narrative in Liber Pontificalis, LeoIV/LeoX,1514-17 workshop context. Miracle is attributed to the text, not presented as independently demonstrated history. |
| vatican-museums-highlight-4 | [Vatican Maps Gallery](https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/galleria-carte-geografiche.html): Danti, Muziano/Nebbia,32 territorial plus8 smaller maps,51 ceiling scenes. Not40 modern administrative regions. |
| vatican-foligno | [Vatican Foligno](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/la-pinacoteca/sala-viii---secolo-xvi/raffaello-sanzio--madonna-di-foligno.html):1511-12, tempera grassa panel transferred to canvas,308x198cm, cat.40329; Aracoeli/Foligno/France/Vatican history. |
| vatican-melozzo | [Vatican lute angel](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/la-pinacoteca/sala-iv---secolo-xv-xvi/melozzo-da-forli--un-angelo-che-suona-il-liuto.html): specific removed fresco fragment, c.1480,93.5x117cm, cat.40269.14.10. The14 fragments are not14 copies of this object; original Christ survives elsewhere. |
| vatican-augustus | [Vatican Augustus](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/braccio-nuovo/Augusto-di-Prima-Porta.html): early1st century, diplomatic return of standards, Doryphoros-derived stance. Cuirass is not a battle scene. |
| vatican-todi | [Vatican Todi](https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/museo-gregoriano-etrusco/sala-iii--bronzi/marte-di-todi.html): late5th century BCE,141cm, cat.13886, Umbrian language in Etruscan letters. Warrior libation, uncertain Mars identity and lightning burial; detached attributes not restored imaginatively. |
| vatican-round-basin | [Vatican Round Hall](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/sala-rotonda/sala-rotonda.html):13m circumference, Imperial public-object origin uncertain;1779 hall, later mosaic assemblage. Not a proven Nero private bath. |
| vatican-tapestry | [Vatican Tapestries](https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/galleria-arazzi/galleria-arazzi.html):18th-century ceiling, later unified gallery and varied textiles distinguished. Not all tapestries woven by Raphael. |
| vatican-pigna | [Vatican2020 restoration](https://www.museivaticani.va/content/museivaticani/it/eventi-e-novita/iniziative/Eventi/2020/restauro-pigna.html):1st-2nd century, Publius Cincius Salvius, probable Campo Marzio, separate Alexander Severus bath capital. Sphere remains a separate artwork. |
| vatican-fibula | [Vatican fibula](https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/museo-gregoriano-etrusco/sala-ii--tomba-regolini-galassi/grande-fibula-da-parata.html):675-650BCE, cat.20552, gold techniques, burial and cross-Mediterranean motifs. No invented dimensions. |
| st-peters-basilica-highlight-1 | [Basilica Pieta](https://www.basilicasanpietro.va/it/san-pietro/la-pieta-di-san-pietro): French cardinal tomb commission, former chapel, single Carrara block, signature. Current placement is not original context. |
| st-peters-basilica-highlight-2 | [Vatican2024 restoration presentation](https://press.vatican.va/content/salastampa/it/bollettino/pubblico/2024/01/11/0030/00058.html):1624 commission, Bernini/Borromini/craftspeople, composite structure, ancient columns and textile-canopy analogy. |
| st-peters-basilica-highlight-3 | [Basilica Chair](https://www.basilicasanpietro.va/it/san-pietro/la-cattedra-di-san-pietro): wooden relic with Carolingian ornament distinguished from1656-66 bronze monument; four fathers, real window and sculpted glory. No claim of proven1st-century personal chair. |
| st-peters-basilica-highlight-5 | [Basilica Dome](https://www.basilicasanpietro.va/it/san-pietro/la-cupola): Michelangelo drum,1588-90 Della Porta/Fontana,1598-1613 Provenzale mosaics,16 ribs, approximately3000sqm. Photos do not establish inaccessible shell geometry. |
| peter-bronze | [Basilica attribution FAQ](https://www.basilicasanpietro.va/it/faq/la-statua-di-san-pietro-all-interno-della-basilica-di-san-pietro-e-originale) and [Musei Reali labels p.11](https://museireali.beniculturali.it/wp-content/uploads/2022/09/3b_MRT_didascalie-Le-meraviglie-di-Roma_per-web.pdf): Arnolfo attribution,13th century, right-hand blessing, left-hand keys, worn foot and historical devotion; not permission to cross barriers. |
| peter-alexander | [Published Marder/Wittkower excerpts](https://www.stpetersbasilica.info/Monuments/AlexanderVII/AlexanderVII.htm):1672-78 workshop, real door, jasper curtain, Death/hourglass, four virtues; Truth's white-painted lead drapery distinguished from marble. Avoid disputed assistant assignments. |
| st-peters-square-highlight-1 | [Basilica Square](https://www.basilicasanpietro.va/it/san-pietro/la-piazza):284 columns/four rows/140 statues, oval plus trapezoidal space,1656-67. Ground colonnade-center discs are not mathematical ellipse foci. |
| st-peters-square-highlight-2 | [Vatican Obelisk](https://www.vatican.va/content/vatican/it/ra/obelisco.html):25.36m shaft, uncertain earliest provenance, Caligula import,1586 relocation/cross and later base ornaments. No invented exact ancient date. |

Media decisions, matched to current output SHA256 in the acquisition manifest:

- Baldachin1349x1800: Jebulon, CC0; whole canopy, columns, base and top cross.
- Chair1357x1800: Dnalor01, CC BY-SA3.0; four fathers, chair and dove window.
  Rejected the old960x641 cropped chair as primary and the initial D.Gayo
  candidate with a severely overexposed central window; no synthetic repair.
- Alexander1350x1800: Sailko, CC BY-SA3.0; whole niche, monument and real door.
  Companion1224x1800 photo is explicitly a Death/hourglass detail, not another tomb.
- Dome1800x1200: Jean-Pol GRANDMONT, CC BY-SA3.0; upward ribs/mosaic-band
  composition, not a full building panorama. Edges of the drum extend beyond
  this photograph; captions do not promise a complete circular outline.
- Dome1800x750: official drum/lower mosaic panorama, top cropped in the source;
  used only as a captioned lower-part detail, not the primary full-dome image.
- Dome1800x1350: ZohaStel, CC BY-SA3.0; lantern close-up. Corrected the initial
  whole-dome candidate description after inspection; never published as a whole dome.
- Replaced the old side-pier-dominated dome image in this work. Existing photos
  for the other16 subjects were checked together for matching subject and
  intact object composition. The basin/tapestry catalog images are context views,
  not newly acquired high-resolution detail photographs.

## Final Five Existing Vatican Records, 2026-09-08

Primary pages and photographs rechecked on2026-09-08 for the five remaining
short Vatican records. All five are now enriched existing records, not additions
to the44-subject Vatican inventory. With eight St Peter records below, this
raises the reviewed interpretation count from55 to68 across the whole site.

| Existing ID | Primary evidence and interpretive boundary |
| --- | --- |
| vatican-apoxyomenos | [Vatican object page](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-pio-clementino/vestibolo-quadrato-e-gabinetto-dell-apoxyomenos/apoxyomenos.html): marble Roman copy c.50CE after Lysippus's c.320BCE bronze;1849 Trastevere discovery; left hand cleans extended right arm with strigil. Existing full-body photo visually checked, not a reason to invent original bronze surface or dimensions. |
| vatican-braccio | [Vatican New Wing](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/braccio-nuovo/Presentazione-Braccio-Nuovo.html): post-Napoleonic collection reorganization, Stern followed by Belli after1820, opening February1822; Canova-led display committee;68m gallery,28 niches, Roman mosaic inserts, Laboureur friezes. Axial, niche, floor and central-hemicycle observations match the existing photograph. |
| vatican-temptations | [Vatican fresco page](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina/parete-nord/storie-di-cristo/tentazioni-di-cristo.html): three background trials, Santo Spirito-like temple; foreground sacrifice usually interpreted as healed leper's offering. Moses/Christ symbolic identifications are alternative readings, not settled identities. Full fresco composition visually checked. |
| vatican-last-supper | [Vatican Christ cycle](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/cappella-sistina/parete-nord/storie-di-cristo.html) and [Vatican News2023](https://www.vaticannews.va/it/vaticano/news/2023-04/musei-vaticani-arte-preghiera-giovedi-santo-6-aprile-quaresima.html): Rosselli1481-82; three background Passion episodes are garden prayer, arrest and Crucifixion. Existing complete fresco photograph visually checked: angular table, isolated foreground sitter, vessels and three separate rear openings. Does not assign individual passages to a named assistant without evidence. |
| vatican-anubis | [Vatican object page](https://www.museivaticani.va/content/museivaticani/en/collezioni/musei/museo-gregoriano-egizio/sala-iv--l_egitto-e-roma/statua-del-dio-anubi.html): Anubis assimilated to Mercury, short tunic/cloak/shoes, caduceus, solar disc over crescent;1749 Anzio/Pamphilj discovery, BenedictXIV gift,1839 transfer. Direct official head/chest detail is now the captioned primary image; whole figure is a distinct secondary context view. Material remains stone and period Roman Imperial; no unsupported specific marble or exact date. |

## Eight Existing St Peter Records, 2026-09-08

| Existing ID | Evidence and interpretive boundary |
| --- | --- |
| st-peters-basilica-highlight-4 | [Official grottoes](https://www.basilicasanpietro.va/it/san-pietro/le-grotte-vaticane):1590-91 vaults, old-basilica remains and support for the new floor. Retains the separate lower-necropolis distinction, current grottoes bindings and access caveat. |
| st-peters-basilica-highlight-6 | [Official dome](https://www.basilicasanpietro.va/it/san-pietro/la-cupola) and [square](https://www.basilicasanpietro.va/it/san-pietro/la-piazza): roof, facade, square and urban-axis observations. An outward lantern panorama is not the inward dome ledge; no invented platform plan or museum walking-distance claim. |
| peter-longinus | [Official Bernini presentation](https://www.basilicasanpietro.va/en/products/bernini-and-the-barberini-in-st-peter-s-basilica) and [published monument account](https://www.stpetersbasilica.info/Statues/StLonginus/StLonginus.htm): Bernini, lance, open arms and folds. Religious identity is attributed to tradition. Retains existing1631-38 chronology, does not reproduce the secondary page's contradictory dates or incorrect10m height. |
| peter-clement | [Accademia di San Luca](https://accademiasanluca.it/collezioni/opere/testa-di-clemente-xiii), [Italian catalog](https://catalogo.cultura.gov.it/detail/HistoricOrArtisticProperty/0800437675) and [published account](https://www.stpetersbasilica.info/Monuments/ClementXIII/ClementXIII.htm):1792 completion, kneeling pope, Religion, funerary genius, inverted torch, lions and separately placed crown. Marble/travertine distinguished. Does not copy the Accademia page's inconsistent commission date. |
| peter-gregory | [Published accounts](https://www.stpetersbasilica.info/Monuments/GregoryXIII/GregoryXIII.htm): Rusconi workshop1715-23,1582 calendar relief, pope and allegories. Differing names for the helmeted figure remain explicit rather than silently choosing one. |
| peter-filarete | [VIVE Filarete](https://vive.cultura.gov.it/it/antonio-averlino-detto-filarete), [official history](https://virtual.basilicasanpietro.va/en/st-peter-history) and [correct door page](https://www.stpetersbasilica.info/Interior/DoorFilarete/DoorFilarete.htm):1445 completion, six main panels, smaller narrative borders, relocation from old basilica. Not the adjacent20th-century Holy Door. |
| peter-holy-door | [Official Jubilee page](https://www.iubilaeum2025.va/it/pellegrinaggio/porta-santa-san-pietro.html): Consorti's bronze door opened Christmas Eve1949,16 panels, redemption narrative. Historical ritual and physical20th-century door distinguished; closed photograph does not promise access. |
| peter-narthex | [Published portico accounts](https://www.stpetersbasilica.info/Interior/Portico/Portico.htm) and [Pietro Zander publication](https://www.museivaticani.va/content/dam/museivaticani/pdf/eventi_novita/iniziative/eventi/2018/99_saggio_catalogo_mostra_zander.pdf): Maderno1608-12, five outer openings/five inner doors, horizontal circulation, later stonework and floor. Contradictory small-statue counts omitted. Ceiling photograph is explicitly a detail, not a complete portico view. |

Six photographs were individually decoded and visually accepted. The full
SHA256, creator, source URL and transformation are retained in
`galleries/vatican-reference-additions.json`:

| Asset | Pixels | Output SHA256 | Accepted role |
| --- | --- | --- | --- |
| vatican-anubis-complete |787x1280|40809477ea4a090fc6f0e49eb0b44f31a261f22ba2512e2672685c455da76f86|Whole-figure context, secondary only|
| vatican-anubis-head |864x1280|d33636f8202aacb5b6249784b177081043b8639a44049a492cefaeb9ccbab440|Head/chest detail, captioned primary|
| peter-clement-complete |1200x1800|0e1deb565809a9b2b4227697673b935751682ac6c666f2728f8147901de2f7e5|Oblique overall monument, all main figures/base retained|
| peter-gregory-complete |1195x1800|63f8191c62921552d553ea8f200432873a322b899f1dd1c0ba7caa2a80be8424|Overall monument, pope's head/hand and calendar relief retained|
| peter-holy-door-complete |1084x1800|83669e091bd5aeac7d3dda685eb5652ef37758d90c2e3947c272512c4291d429|Closed door, all16 panels and surrounding frame|
| peter-narthex-vault |1200x1800|486d232855856811b0056c4dc55c5abb3457a23a9fc46564fcd9df78f147d6cd|PaulV arms and vault decoration detail, not complete space|

Replaced the old blurred/watermarked Clement picture, head-cropped Gregory
picture, small Holy Door picture and stock-watermarked portico picture. No
watermark was removed. Search candidates `Portico san pietro.jpg` showed
Bologna rather than Vatican; `Porta Santa San Pietro Vaticano.jpg` showed a
foundry archive, and `San Pietro in Vaticano 4.jpg` showed a door, not the whole
portico. None is substituted as the current space.

### Narthex Overall Photograph Follow-Up

Found and visually inspected Sean Da Ros's2019 long-axis photograph,
[20190811 roma jpeg2 12](https://commons.wikimedia.org/wiki/File:20190811_roma_jpeg2_12.jpg),
CC0. The1800x1200 local photograph shows the actual transverse hall, openings,
vault and end space with visitors/railings retained. It now precedes the vault
detail in a two-image gallery. The image is not a measured plan, a panoramic
view of every door, or evidence of current crowd-control arrangements. Two
Delso2022 candidates showed a ceiling/opening detail instead of the full hall;
they were reviewed but not added. This resolves the missing spatial-overview
photo without pretending the earlier ceiling close-up already did so.

The narthex overall output SHA256 is
`53fe1f49f849d664feb0aafc14c75f0c66b7572dcd81fb8b57d785dc89219fa4`.
During acquisition-tool repair, earlier records were regenerated or restored
from this task's recorded tool outputs; every existing output was compared
against the previously reviewed local asset hashes before preserving acceptance.
No old asset changed. The31-record Vatican media manifest is complete again.
The acquisition tool now preserves existing records during a full run, retains
review only for identical output hashes, and marks changed output pending.
Two subprocess tests interrupt a full run after one photograph and verify both
record preservation and changed-image invalidation.
# Uffizi Continuation

The 2026-09-09 Uffizi pass, including catalogue identities, new-installation
room discrepancies, 32 authored interpretations, 17 acquired images and
browser image review, is recorded in [uffizi-interpretation-review.md](uffizi-interpretation-review.md).
It does not certify the remaining guide catalogue as complete.
