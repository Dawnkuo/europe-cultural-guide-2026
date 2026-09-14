# Vatican Campus: Limited 2D Context Review

Reviewed 2026-09-08. This adds an interactive two-dimensional area overview,
not the unfinished reference-style three-dimensional museum compound.

## Source and Geometry Boundary

The official state plan, source hash and native 2067x2923 image are pinned in
`vatican-compound-review.md`. `scripts/generate-vatican-campus.py` selects source
ink inside reviewed building-cluster classification regions. It excludes the
door photograph, unrelated administrative buildings and garden hatching.
Those classification regions are not synthetic building outlines. Every drawn
polygon remains a union of actual selected source pixels, with no morphology,
simplification, hole filling or inferred height. Native north points right.

The final selection contains 199218 gold pixels and 9221 grey colonnade pixels.
Grey colonnades come from source pixels, not invented evenly spaced columns.
`vatican-campus-extraction.json` records the selectors, classification regions,
source hash and output hash. `public/maps/vatican-campus.svg` has SHA256
`1df82a74893da58be5338b78fdd30cc612dc2614554fb796d86d117cb6081908`.

Important limit: printed badges, labels and architectural cutaways interrupt
the source fill. Therefore this SVG is accepted only as source-derived area
context. It is not a room map, surveying dataset, roof plan or extrusion base.
The older unclassified trace remains an internal study, not this served asset.

## Area Associations

The fourteen entries in `app/data/vatican-campus.ts` identify the entrance,
Pinacoteca, modern wing, Pio Clementino, Pigna, west galleries, Chiaramonti,
Braccio Nuovo, transverse library, Belvedere courtyard, papal palace, Sistine
Chapel, basilica and square. This is not a count of museum departments, rooms,
works or all Vatican buildings. Each coordinate is a representative area
anchor. Display callout offsets are separate and never move that anchor.

The current visitor-plan place IDs supply separate indoor links. Area anchors
are never reused as artwork coordinates or route nodes. The state plan's
Sistine label was checked against its legend (23, Cappella Sistina). The
Pinacoteca description places it north of Giardino Quadrato, consistent with
the source compass. Braccio Nuovo's north portico and south hemicycle are
corroborated by the museum's own architectural description:
https://www.museivaticani.va/content/museivaticani-mobile/en/collezioni/musei/braccio-nuovo/Presentazione-Braccio-Nuovo.html

No adjacency is promoted to ticket reciprocity, an open visitor shortcut,
inter-floor access, an optimized itinerary or an exact object location.

## Runtime and Validation

The campus module and its local SVG are lazy-loaded from the museum, basilica
and square chapters. Indoor maps still open in 2D on reviewed entrance floors;
the square retains its existing exterior default. Selecting a reviewed room
returns to the indoor map and selects its actual floor. Existing floor state
is retained when merely changing views. Mobile uses map-above-list layout;
all fourteen region choices remain available when small-map callouts hide.

Seven component tests cover chapter defaults, area selection, valid visitor
plan links and failed-image retry. Two Python tests prevent overlapping
classification masks from subtracting one another or duplicating selections.
Production browser tests at320,390,820,1440 cover all region choices, nonblank
pixels, keyboard pan/zoom/reset, room selection, no overflow and no page errors.
They also assert all three view switches share one row with a visible selected
state. Phone widths pass CDP-emulated two-finger zoom and subsequent selection;
this is not physical-device touch or Safari validation.
An additional fixed16px canvas inset prevents the entrance marker from being
cut off on narrow screens. Camera calculations account for that inset without
moving source anchors. Every selected region's full marker is checked against
the viewport bounds. Final focused production reports live under
`work/experience/vatican-campus-production-final`.

The offline suite also opens the campus for the first time while offline
on all three chapters and the Vatican alias, decoding the local SVG and
testing region selection plus the museum's second-floor map-gallery link.
All80routes pass on final export `855ba1ab0f6d999ec292`, with zero missing
precache entries. Report: `work/experience/vatican-campus-offline-final`.
The whole product remains incomplete; passing these checks does not validate
the remaining exterior or content backlog.
