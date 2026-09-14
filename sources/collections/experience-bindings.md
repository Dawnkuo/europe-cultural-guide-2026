# Artwork / Place / Sequence Join Review

Reviewed 2026-09-08 against the existing authored object location records in
`app/data/guides/expanded-authorship.ts`, `app/data/guides/florence.ts`,
`app/data/guides/rome-vatican.ts`, `app/data/guides/barcelona.ts`, their linked
collection evidence, and the current source-derived architectural place IDs.
Bindings are explicit in `app/data/guide-experience.ts`; runtime text matching is
not used. All 42 existing architectural plans now have an explicit join review;
that does not establish map completeness or current on-display inventory.

- Vatican: Pinacoteca, Pio-Clementino, Raphael Rooms, Egyptian and Etruscan
  collections use department anchors (`area`), not individual gallery/artefact
  coordinates. Duplicate named department anchors share the same collection.
- Laocoon: the museum object page locates it in the Octagonal Court, within
  Pio-Clementino. The current map only supports the department-level join.
  https://www.museivaticani.va/content/museivaticani/it/collezioni/musei/museo-pio-clementino/Cortile-Ottagono/laocoonte.html
- Uffizi: existing verified room fields join matching room numbers, not nearby
  rooms. The Spring page currently lists A9 (checked 2026-09-08), matching the
  existing spatial stop binding. The museum announced renewed Botticelli rooms
  in June 2026; do not replace current object locations with remembered old rooms.
  https://www.uffizi.it/en/artworks/botticelli-spring
  https://www.uffizi.it/en/news/the-new-permanent-installation-of-the-botticelli-rooms
- Uffizi D29/D32 are not present in this version of the map. Their works remain
  searchable and readable without invented coordinates. Medusa has no precise
  room in the current authored record and remains unbound.
- Casa: the fireplace uses the study room, not a guessed fireplace coordinate;
  the private staircase uses its ground-floor hall. The combined facade/roof
  feature explicitly locates the roof part only.
- St Peter: the dome interpretation may locate the place to look upward from
  the crossing. It does not locate the high-level inner ring. The upper viewing
  platform remains unbound. Tombs lacking an identified room-marker mapping
  remain unbound rather than guessed.
- Sequence bindings retain existing sequence order and grouped steps. They do
  not generate walking paths, travel times, access permissions, or tour inclusions.

## Expanded join review

- Borghese: the collection's authored room records are retained (ground floor
  I-VIII; upper rooms IX, X, XX). `Melissa` stays unlocated rather than treating
  a storage record as a public room. Caravaggio's six works share room VIII.
- Florence Accademia: David, Prisoners, Gipsoteca, the Colossus room and musical
  instruments follow the numbered visitor-map zones. The viola is an area
  anchor, not a coordinate for its case.
- Doge's Palace: Giants' Stair, Senate, Collegio and Great Council room join the
  named/numbered floor places. The lion-mouth only joins the loggia area; the
  Carta portal remains unlocated. The Golden Stair has two evidenced landings,
  not a fabricated path between them.
- Brera: VI, IX, XXIV, XXVIII and XXXVIII follow the authored collection-room
  records. Palazzo Citterio works are not placed inside the historic Pinacoteca.
- Milan and Cologne cathedrals: broad nave/choir/apse and transept anchors are
  explicitly areas. No point claims the precise wall of a door, window or shrine.
  Tower tops and unlabelled chapels remain unlocated.
- Sagrada Familia: only six ground-level works/features have bindings. The
  Passion tower viewpoint and museum model do not inherit a tower-base or
  schoolhouse marker. Their sequence cards remain readable without a work pin.
- La Pedrera: the attic, visitor apartment, courtyards and roof are area-level
  joins. A dining-room description does not create an individual dining-room
  polygon. The exterior gate and facade remain unlocated.
- Palau: the historic concert hall and stage are supported. Do not interpret
  unexplained historical plan numbers as Lluis Millet Hall, or invent the
  modern underground Petit Palau on those sheets.
- Medici Chapels: tomb sculptures join the New Sacristy room; the Princes'
  Chapel dome joins its ground viewing room, not a roof-level coordinate.
- Pitti: the Saturn, Jupiter and Venus rooms are actual named source rooms;
  unidentified room locations for War and Sleeping Cupid remain unbound.
- Last Supper: both Leonardo interpretations share the north-wall anchor;
  Montorfano uses the independent opposite-wall anchor. Santa Maria delle
  Grazie's unlabelled Santa Corona chapel is not guessed from the lateral bays.
- Picasso: sequence-stage associations retain the source-defined collection
  zones, but no object is assigned to one particular room when the authored
  collection record explicitly leaves its display position unasserted.

These checks use the existing internally reviewed object records and the
source-derived current place IDs. They are not a new live inventory of displays.

## Remaining architectural guide review

- La Scala: spinet and singer portraits use rooms 1 and 3; room 9 is absent
  from the current plan. Concert programme entries are not museum objects and
  receive no exhibit coordinates.
- Galleria Vittorio Emanuele: dome and floor crests join the same octagon area
  with the vertical distinction retained in the note.
- Sforza: only the Filarete entrance tower has a work binding. Courtyard outlines
  do not locate Sala delle Asse, Sala del Tesoro, the tapestry hall or Rondanini.
- Correr: joins remain collection areas (Canova/history/paintings), never cases.
- St Mark: named Genesis/Ascension mosaic anchors denote ground projection;
  Pala d'Oro and Tetrarchs have their own feature markers. Original horses in the
  upstairs museum and unlabelled mosaic positions are not inferred.
- Fenice: the auditorium's platea is a viewing area, not the royal box. Five
  Apollinee halls are sequence-linked as identified on the plan.
- Venice Accademia: authored Roman-number room records join exact numbered
  rooms; Vitruvian Man is not treated as permanently displayed. Restoration
  notes remain separate from geometry and room identity.
- Campanile: Loggetta and bell cell use named plan spaces. An old ramp drawing
  does not establish the modern lift route or the precise angel position.
- Florence Duomo: dome subjects may locate the ground crossing for looking up;
  this is expressly not the upper internal ledge. Unmapped wall works remain
  readable without pins.
- Leaning Tower: numbered galleries and bell layer are supported; the entrance
  relief and top terrace are not given invented coordinates.
- Pisa Cathedral: the apse mosaic uses the apse area, not a pinpoint on the
  elevated surface. The pulpit has no individual map anchor in this version.
- Baptistery: basin and pulpit are explicit named features; an acoustic event
  is not given a fake fixed point. The women's gallery stays sequence-linked.
- Camposanto: north/south wall-cycle areas are distinguished; no invented
  sarcophagus or individual monument location is added.
- Opera Pisa: only the ground courtyard work association is supported. Museum
  upper galleries and unlabelled thematic rooms remain unbound.
- Mercato Centrale: historical stall grid is labelled historical, not today's
  stallholders; the roof view is anchored to the existing upper-floor viewpoint.
- Giunti Odeon: book area, auditorium decoration and stage axis are distinct;
  day/night programming is not represented as a physical artefact point.
- Pantheon: numbered source entries 1/2/3/9 correspond to portico/bronze-door
  entrance/rotunda/Raphael tomb. Dome work links denote viewing from the floor.
- Colosseum: hypogeum regions and arena viewpoint are supported; numbered
  exterior entrance LII and upper seating do not get arbitrary pins.
- Barcelona Cathedral: choir and cloister are supported. The separate crypt,
  sarcophagus and roof cannot inherit a main-floor marker.
- Santa Maria del Mar: only nave/aisles can be located from the present work
  list. Individual windows and Bastaixos details remain unbound.
- El Born: the archaeological view is explicitly the street-level overlook,
  not a route walking down inside the excavated remains.
- Ludwig: the Haubrich collection uses the documented second-floor theme area.
  Individual objects with unasserted current display locations remain unbound.
- Koln Triangle: no rooftop plan, so all panorama works remain unbound.
- Notre Dame towers: partial work associations explicitly refer to the bell
  framing/hanging zones, not modern stairs or the missing panorama deck.

### Alexander VII, 2026-09-08

Added `peter-alexander` to the existing `basilica-42-1` feature, without changing
floor geometry, source anchor or visit sequence. Churches of Rome's
`127-San Pietro in Vaticano.pdf` was fetched again and matched the pinned SHA256
`6a1dc0f4506c0dc2364a80812d21e8713f1c57771905299fa2ba9849d811e429`.
Rendered pages15 and16 verify the printed42 beside the west-side wall and the
legend "Monument to Alexander VII"; page41 discusses the actual doorway.
This is a labelled monument anchor, not a newly inferred wall/hanging coordinate.
Automated tests cover both work-to-feature and feature-to-work resolution.

### Clement XIII and Gregory XIII, 2026-09-08

Added `peter-clement` to `basilica-28-1` and `peter-gregory` to
`basilica-15-1`. Re-rendered and visually inspected pages15/16 of the same
Churches of Rome PDF (SHA256
`6a1dc0f4506c0dc2364a80812d21e8713f1c57771905299fa2ba9849d811e429`).
The plan/legend pairs identify28 as ClementXIII near the northeast ambulatory
and15 as GregoryXIII between the Blessed Sacrament and Gregorian chapels.
These join existing labelled features; no coordinates, geometry, itinerary or
floor order changed. Desktop1440 and phone390 round trips verified both joins.
The lantern panorama still has no verified upper-platform map and is not joined
to the indoor dome's ground projection to manufacture a successful map link.

Remaining work: review outdoor place associations, verify current collection assignments,
extend authoritative spatial evidence where available, and keep the outstanding
coverage inventory separate from a passing join-integrity test.
