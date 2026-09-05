# Pisa Baptistery upper-floor increment v2

Status: ready source-exact handoff. This supersedes the uninstalled v1 package.

## Corrected classification

- The 12 pairs of radial arch/vault strokes remain flat detail; they are not low wall extrusions and do not divide the ambulatory into wedges.
- Wall pixels are limited to original filled outer masonry and actual ink in the 12 detected support-symbol windows.
- All 35,253 retained pixels form a disjoint wall/detail partition; 0 wall or detail pixels occur outside the direct author source.
- No ideal circle, standardized support, contour fill or inferred connection is generated.

## Floor-surface decision

The unmodified source-ink topology does not provide a closed annular floor face. Reviewed seeds in the gallery, central void and page exterior all resolve to background component 1. The PNG alpha defines an outer disc but does not separately encode the central void. V2 therefore emits no `sourceSpaces`, floor slab or void polygon.

## Coverage

The model retains the ground plan and first-floor women's-gallery diagram, four evidence anchors, and all four guide-stop bindings. It emits no vertical link because the reviewed upper plan does not show stair treads, shafts or landings.

## QA

`qa/baptistery-upper-v2/pisa-baptistery-first-floor-contact-v2.png` compares the direct map, semantic source pixels and final model. Black is wall and blue is flat detail. A second clean rebuild reproduced both the derived PDF and model hashes exactly.
