# St Mark Basilica rebuild

## Portable derivation

- Parent: `st-mark-basilica-klein.pdf`, SHA-256 `3262fdff479ebc50a32a7c8982fc5880ea231ff8139d012a5be2ceb6674c383c`, page 6, image xref 11.
- Derived source: `st-mark-basilica-semantic-layers.pdf`, SHA-256 `ea2ef6f334469b99cb3e58594204d348485072d2615b7de63b18037aaebc5083`, page 1, image xref 4.
- Registration: identical 504 x 720 point page and identical source image rectangle; no resampling or geometric warp.
- Black pixels encode reviewed grey-stipple-density masonry. Red pixels encode remaining original dark detail after wall and annotation masks.
- `scripts/derive-st-mark-basilica-layers.py` produces byte-identical derived output on repeated runs.
- `scripts/rebuild-st-mark-basilica.py` only verifies the derived hash and calls the unchanged shared builder. It does not mutate the model or evidence afterward.
- Shared builder SHA-256: `73c59b755a171f52e67d464fc55a88c96f06dfaedab1d90c87c36f4edd26eb3b`.

## Delivered coverage

- One complete, scale-marked main floor.
- All 47 printed keys preserved: numbers 1-29 and mosaic keys A-R.
- Room semantics are limited to the Baptistery, four chapels and Treasury; corridor 11 is an area; the remaining numbered features and all mosaics are objects.
- Independent checks: 27 required wall points, 14 required open points and 47 printed-key masks.

## Explicitly unresolved upper route

The current museum, matronei, Foresti stair and facade loggia remain unmodelled. The authoritative Hopkins/De Franceschi publication excerpts name the complete matronei plate in their contents but omit the plate section. Current organ-project photographs show only cropped, oblique portions. No partial upper crop was promoted to a floor.

## Route bindings

- Stop 0, Porta San Pietro and narthex: unresolved because that door name is not keyed in the reviewed plan.
- Stop 1, Creation dome: bound to D.
- Stop 2, nave and gold mosaics: partially bound to Ascension dome B.
- Stop 3, high altar and Pala d'Oro: bound to 1 and 14.
- Stops 4-5, upper museum, horses and loggia: unresolved pending a complete current upper-floor plan.
