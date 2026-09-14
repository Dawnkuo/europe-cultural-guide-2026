import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';

const coverage = JSON.parse(await readFile('sources/collections/reference-coverage.json', 'utf8'));
const reference = JSON.parse(await readFile('work/experience/reference/works.json', 'utf8'));
const ids = coverage.subjects.map(subject => subject.referenceId);
assert.equal(new Set(ids).size, ids.length, 'Duplicate reference correspondence');
assert.deepEqual(ids.toSorted(), reference.map(work => work.id).toSorted(), 'Unreviewed reference subjects');

const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-reference-coverage', server: { middlewareMode: true } });
try {
  const { guideCatalog } = await vite.ssrLoadModule('/app/data/guides.ts');
  const { guideInterpretations } = await vite.ssrLoadModule('/app/data/guide-interpretation.ts');
  const { guideWorkLocations } = await vite.ssrLoadModule('/app/data/guide-experience.ts');
  const works = new Map(guideCatalog.flatMap(guide => guide.highlights.map(work => [work.id, { work, slug: guide.slug }])));
  const rows = coverage.subjects.map(subject => {
    const referenceWork = reference.find(work => work.id === subject.referenceId);
    const target = subject.workId ? works.get(subject.workId) : null;
    const targetIds = [subject.workId, ...(subject.additionalWorkIds ?? [])].filter(Boolean);
    assert.equal(new Set(targetIds).size, targetIds.length, `Repeated subject target ${subject.referenceId}`);
    for (const id of targetIds) assert.ok(works.has(id), `Missing catalog work ${id}`);
    if (subject.workId) assert.ok(target, `Missing catalog work ${subject.workId}`);
    else assert.ok(subject.gap, `Missing explanation for ${subject.referenceId}`);
    return {
      ...subject,
      referenceTitle: referenceWork.name,
      slug: target?.slug ?? null,
      title: target?.work.title ?? null,
      status: !target ? 'missing' : subject.gap ? 'partial-subject' : 'subject-present',
      enriched: targetIds.length > 0 && targetIds.every(id => Boolean(guideInterpretations[id])),
      mapped: targetIds.length > 0 && targetIds.every(id => Boolean(guideWorkLocations[works.get(id).slug]?.[id])),
      galleryPhotos: targetIds.reduce((sum, id) => sum + (works.get(id).work.gallery?.length ?? 0), 0),
    };
  });
  const report = {
    reference: coverage.reference, revision: coverage.revision,
    summary: {
      total: rows.length,
      present: rows.filter(row => row.status === 'subject-present').length,
      partial: rows.filter(row => row.status === 'partial-subject').length,
      missing: rows.filter(row => row.status === 'missing').length,
      enriched: rows.filter(row => row.enriched).length,
    },
    note: 'Subject presence does not establish complete interpretation, media, map coverage or equivalent quality.',
    rows,
  };
  await writeFile('work/experience/reference/coverage.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report.summary));
} finally { await vite.close(); }
