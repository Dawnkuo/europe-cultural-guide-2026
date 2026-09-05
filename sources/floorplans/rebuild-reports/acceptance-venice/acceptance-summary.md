# Venice sidecar acceptance summary

## Scope

Read-only acceptance of current main `correr`, `accademia-venice` and `fenice` configs, models, evidence and pinned source files. No repository files were edited. Browser/runtime QA is intentionally excluded because the main thread owns it.

## Result

- Correr: PASS within collection-zone source scope; no blocking source/model defect.
- Accademia Venice: PASS within official-map scope; no blocking source/model defect.
- Fenice: PASS within the three extracted plan scopes and documented omissions; no blocking source/model defect.

The frozen canonical replay used `/tmp/europe-map-current-acceptance/replay/build-architectural-plans.py`, SHA-256 `5def3873d9e690de1ebe97b222fe7735a05b780d68b98aebb8efbe7886b0c937`. All three replayed models and evidence files are byte-identical to the pinned current-main files. If the main builder, config, model or evidence hashes change, rerun this sidecar before carrying forward its verdict.

## Commands passed

- Current TypeScript `validateArchitecturalPlan`: zero errors for all three models.
- Scratch `validate_acceptance.py`: all common Shapely, binding, language, source-digest, native-ID and canonical-replay assertions passed.
- Main targeted regressions: Correr service leaders/WC footprint and Accademia 64 source checkpoints passed.
- Main Fenice source-coordinate semantic validator: 2,123 assertions passed.

## Integration note recorded

Campanile is not re-audited here. Main removed four misleading exact-focus bindings: modern ticket/lift stop 1 to the historical tower-base centre, and directional viewpoint stops 2/3/4 to one bell-room centre. All eight places, four floors and six text stops remain; only stop 0 is bound. That conservative correction is the accepted record for later Venice QA.
