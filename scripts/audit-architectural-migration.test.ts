import { describe, expect, it } from 'vitest';
import { migrationRows, modelDigest, requiredMapChecks } from './audit-architectural-migration.mjs';

const inventory = { museum: 'ready' };
const model = { slug: 'museum', sourceDigest: 'pinned-hash', floors: [1], places: [1,2], stopBindings: [], verticalLinks: [] };

describe('architectural map release gate', () => {
  it('does not equate a generated model or an old ready flag with release readiness', () => {
    expect(migrationRows(inventory, [], {})[0]).toMatchObject({ status: 'not-rebuilt', releaseReady: false });
    expect(migrationRows(inventory, [model], {})[0]).toMatchObject({ status: 'draft', releaseReady: false });
  });
  it('requires every acceptance check and the current source hash', () => {
    const review = { state: 'verified', sourceDigest: 'pinned-hash', modelDigest: modelDigest(model), checks: Object.fromEntries(requiredMapChecks.map((key: string) => [key,true])) };
    expect(migrationRows(inventory, [model], { museum: review })[0].releaseReady).toBe(true);
    review.checks.offline = false;
    expect(migrationRows(inventory, [model], { museum: review })[0].releaseReady).toBe(false);
    review.checks.offline = true;
    review.sourceDigest = 'stale-hash';
    expect(migrationRows(inventory, [model], { museum: review })[0].releaseReady).toBe(false);
  });
  it('invalidates acceptance when geometry changes even if the original PDF is unchanged', () => {
    const review = { state: 'verified', sourceDigest: model.sourceDigest, modelDigest: modelDigest(model), checks: Object.fromEntries(requiredMapChecks.map((key: string) => [key,true])) };
    const edited = { ...model, floors: [2] };
    expect(migrationRows(inventory, [edited], { museum: review })[0].releaseReady).toBe(false);
    review.modelDigest = modelDigest(edited);
    expect(migrationRows(inventory, [edited], { museum: review })[0].releaseReady).toBe(true);
  });
  it('requires a documented evidence limitation, not a blanket unavailable label', () => {
    expect(migrationRows(inventory, [], { museum: { state: 'evidence-limited' } })[0].releaseReady).toBe(false);
    expect(migrationRows(inventory, [], { museum: { state: 'evidence-limited', reason: 'Only exterior elevations were published; no indoor floor geometry was provided.', inspectedSources: ['local/source-review.json'] } })[0].releaseReady).toBe(true);
  });
});
