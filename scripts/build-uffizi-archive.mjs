import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const media = JSON.parse(await readFile('sources/collections/galleries/uffizi-additions.json', 'utf8'));
const archive = {};
const evidence = [];
for (const file of (await readdir('work/experience/uffizi-sources')).filter(file => file.endsWith('.json')).sort()) {
  const record = JSON.parse(await readFile(`work/experience/uffizi-sources/${file}`, 'utf8'));
  if (!record.id.startsWith('uffizi-') || !record.catalogId || !record.source.startsWith('https://www.uffizi.it/')) throw new Error(`Unidentified source: ${file}`);
  const photo = media.find(photo => photo.workId === record.id && photo.id.endsWith('-1'));
  archive[record.id] = {
    originalTitle: record.title.trim(), creator: record.creator.trim(), period: record.date.trim(),
    location: record.location.trim() || '素描版画部 · 展室及当期展出待确认',
    material: record.material.trim(), dimensions: record.dimensions.trim(),
    ...(record.inventory ? { inventoryNumber: record.inventory.trim() } : {}),
    sourceIds: [record.source], ...(photo ? { image: photo.path } : {}),
  };
  evidence.push({ id: record.id, catalogId: record.catalogId, source: record.source, retrievedAt: record.retrievedAt, sourceSha256: record.sourceSha256, recordSha256: createHash('sha256').update(JSON.stringify(record)).digest('hex'), rawDate: record.date, rawLocation: record.location, inventory: record.inventory });
}
await writeFile('app/data/guides/uffizi-archive.generated.json', `${JSON.stringify(archive, null, 2)}\n`);
await writeFile('sources/collections/uffizi-catalog-review.json', `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`${evidence.length} identified records; authored interpretation is not generated`);
