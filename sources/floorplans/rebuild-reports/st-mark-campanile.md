# St Mark Campanile rebuild

## Current-structure source

- Primary: `st-mark-campanile-rebuilt-1912.pdf`, SHA-256 `53e7180a82f4cb819bb1c489558699cbcec981c0eaa18f660675767996b03997`.
- Authority: Antonio Fradeletto, *Il campanile di San Marco riedificato*, issued for the Comune di Venezia in 1912.
- Geometry: printed page 144 / PDF 183, image xref 1448. Four scale-marked orthographic sections are extracted independently: Pianta AB, Pianta CD, Pianta cella and Pianta EF.
- The adjacent elevation and longitudinal section are evidence only and are not flattened into horizontal floors.
- `scripts/rebuild-st-mark-campanile.py` verifies source digests and calls the unchanged shared builder; it does not post-mutate model or evidence output.

## Delivered coverage

- Four floors, eight reviewed Chinese-labelled anchors, three documented stair/ramp links and five route bindings.
- Dense black structural masses are walls. Ramp edges, stair treads, fine outlines and section axes remain flat detail.
- Independent checks cover 34 wall points, 18 detail points and 19 source-white openings across all four plans.
- No source space is claimed: the scan has no exact vector floor-fill paths, and a coarse whole-floor polygon would misrepresent room selection.

## Archival source exclusion

The Cicognara 1858 plan remains supplementary archival evidence only. It predates the 1902 collapse, has no selected projection pages, and no generated floor points to it.

## Explicitly unresolved

The 1912 text confirms thirty-six ramps and an electric lift, but the plate does not label the current ticket entrance, lift shaft or landings. The bell-cell plan has no reviewed directional registration for the three viewpoint stops. The wind vane appears in elevation and remains unbound rather than being placed on an occupiable floor.
