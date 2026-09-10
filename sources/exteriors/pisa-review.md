# Pisa Exterior Review, 2026-09-09

This replaces the seven shifted cylinders and anonymous belfry in the local
`leaning-tower` exterior only. It is a source-derived architectural model,
not the original laser point cloud, a current survey or an indoor stair map.
No guide stop, booking, source-plan geometry, entrance-floor default or
map-coordinate binding is changed. The existing five source-plan groups are
not relabelled as the tower's eight architectural orders.

## Primary Geometry

- Lucio Amato, Giovanni Antonucci, Barbara Belnato (Tecno In), *The Three
  Dimensional Laser Scanner System: The New Frontier for Surveying*, ISPRS
  Archives XXXIV Part 5/W12 (2003), printed pp.18-19, PDF pp.2-3. The team
  describes the May2001 survey, four stations, registered point clouds and
  sections, with acknowledgements to OPA and the safeguarding committee.
  https://www.isprs.org/proceedings/xxxiv/5-W12/proceedings/04.pdf
  SHA256 `355c9658dc086d76f0764376aa7d836e3045cd45cdcbde51bf81f03545e10c56`.
- Carlo Viggiani, University of Napoli Federico II, GeoVirginia2018,
  *Lessons Learned from the Stabilization of the Leaning Tower of Pisa*.
  Slides6/7/17/22/23 were rendered and visually inspected. They corroborate
  the hollow shaft, six loggia rings, reduced bell chamber, counter-curved
  profile and historical elevation/section. The1817 elevation on slide22 is
  not treated as a present-day detail survey.
  https://geovirginia.org/wp-content/uploads/2019/06/Viggiani-Geovirginia-2018.-2.pdf
  SHA256 `030580f5c353058d61f9d9fa3d044171353beaeeb229dfd282fec29b7dbc20b5`.
- M.B.Jamiolkowski, *The Leaning Tower of Pisa: End of an Odyssey*,2001.
  Historical inclination and stabilization record, not copied as current tilt.
  https://www.issmge.org/uploads/publications/1/30/2001_04_0071.pdf
  SHA256 `35ce927b25ed78566313d1ad80b75562e4bff7f44402de5866241a67787a0094`.
- Brooklyn Museum William H. Goodyear measured gallery plan,1910, image1071,
  visually rechecked against the existing indoor source. Its ring has30
  drawn column profiles. This directly corroborates the loggia count; the
  total207 capitals alone is not used to deduce an unobserved arrangement.
  https://commons.wikimedia.org/wiki/File:S03_06_01_008_image_1071.jpg
  Local `sources/floorplans/tower-goodyear-1071.jpg`, SHA256
  `acd3c1475c58915201b95eb9eb6e19fef86645c2761e9a399b1fe240a0819aa6`.
  Its annotated historical stair levels are not transferred into the exterior
  or interpreted as current visitor access.

Downloaded files and rendered review pages are in
`work/experience/pisa-exterior-source/`. No source PDF is shipped in the UI.

## Coordinates and Derivations

`app/data/pisa-exterior.ts` retains the Fig.6 dimensions as written, not a
photograph-traced outline. Height origin is the drawing's lower base/plinth
reference,46.98m below the upper loggia datum. This is a model-local vertical
datum, not sea level or the entire sloping piazza pavement.

| Feature | Evidence and derivation |
| --- | --- |
| Six loggia floor heights | Fig.6 descending dimensions35.36,29.51,23.56,17.72,11.96,6.30m subtracted from46.98. No equal-height copy. |
| Inner shaft diameters | Fig.6:7.50,7.53,7.57,7.59,7.62,7.65m. |
| Shaft-wall/gallery widths | Corresponding Fig.6 labels retained separately in the data. Using section widths as circumferential radii is an axisymmetric reconstruction, not a claim about every azimuth. |
| Raised bell footing | Fig.6:1.24m above the loggia datum. |
| Bell chamber height | Fig.6 opposing sides7.40/7.21m;7.30m central average, rounded. Total55.52m above model datum plus2.9m foundation interval gives58.42m, consistent with58.4m contextual dimension to drawing precision. |
| Changing tilt | Six Fig.6 angles transcribed as degrees/minutes/seconds; upper value3deg10min from Fig.3. Slopes interpolate continuously between measured sections and are integrated for the centreline. Floor sections rotate with that slope, rather than remaining horizontal on a sheared cylinder. Interpolation is not a new measured deformation field. |
| Base |7.50m interior plus4.08m walls gives7.83m radius. Fifteen engaged-column/arched bays, one entrance opening. |
| Loggia repetition | Six rings,30 columns each.180 open bays/columns; number agrees with180 loggia columns plus15 base and12 belfry =207 capitals in OPA's published count. Equal angular sampling does not reproduce individual irregularities or unique carved capitals. |
| Upper shaft | Six large openings shown in sections/elevation and historical description; not a solid cylinder behind the upper arcade. |
| Bell chamber | Six low large apertures alternate with six raised small apertures; twelve exterior column axes. Smaller circular footprint and top cornice follow the elevation. |

OPA's public monument description:
https://www.opapisa.it/en/square-of-miracles/tower/
lists58.36m,15m external diameter,207capitals and5.115deg inclination.
Those general dimensions do not identify the same cornice/section datum as
the measured paper. They are cross-checks, not replacements for each labelled
section width, nor proof of the current time-specific shape.
The published educational description confirms the six large and six raised
small bell openings:
https://www.pisanromanesquemeets.it/teaching-materials/the-leaning-tower/
Its3.97deg value and the historical5.5deg are not substituted for Fig.6's
segment angles. In particular this model does not assert one current tilt.

## Explicit Detail Limits

- Bell chamber radii, arch profiles, capital/block sizes, mouldings, entrance
  outline and base lozenges are simplified proportional elevation details.
  They are not independently measured dimensions. Base entrance azimuth is
  local presentation orientation; no compass or geographic route uses it.
- Three-dimensional carving, block joints, shaft window census, internal
  stairs, structural cracks, current conservation fixtures and individual
  bell shapes/positions are not reconstructed by these sources. Seven bells
  in the guide is not permission to place seven invented bell coordinates.
- Iron handrails/supports are display-sampled elevation detail; their count
  and spacing are not a measured ironwork inventory.
- Circular floor bands retain the open shaft, outer gallery passages and
  true curved arch reveals. No dark painted rectangle stands in for a hole.
- Display scale is one isotropic factor0.18 in all three axes. Local exterior
  data does not replace the authoritative2D visitor plans.

## Verification Boundary

Geometry tests cover all six heights/diameters, continuous lean,15base arches,
180loggia columns,6+6bell apertures, true passage/shaft/door rays, finite
vertices, material batching and focus-region bounds. Browser and fallback
results are recorded in the progress log after the final local build.
An improved exterior is not whole-site or complete-detail acceptance.
