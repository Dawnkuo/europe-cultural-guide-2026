import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
const inventory = JSON.parse(
  await readFile('sources/media/baseline-inventory.json', 'utf8'),
);
const records = JSON.parse(
  await readFile('sources/media/local-replacements.json', 'utf8'),
);
const files = [
  'app/data/guide-media.generated.ts',
  'app/data/guides/rome-vatican.ts',
];
const substitutions = [];
await mkdir('public/images/reviewed', { recursive: true });
for (const record of records) {
  const old = inventory.find((i) => i.id === record.oldId);
  const source = inventory.find((i) => i.id === record.newId);
  const filename = `${path.basename(old.path, path.extname(old.path))}-${source.sha256.slice(0, 10)}${path.extname(source.path)}`;
  const local = `/images/reviewed/${filename}`;
  await copyFile(`public${source.path}`, `public${local}`);
  substitutions.push({
    ...record,
    oldPath: old.path,
    path: local,
    sourcePath: source.path,
    sha256: source.sha256,
    width: source.width,
    height: source.height,
  });
}
const byPath = new Map(
  substitutions.map((record) => [record.oldPath, record.path]),
);
// One pass prevents a source/destination swap from replacing a path twice.
for (const file of files) {
  const original = await readFile(file, 'utf8');
  const changed = original.replace(
    /\/(?:images|vatican-guide)\/[^'"\s]+/g,
    (value) => byPath.get(value) ?? value,
  );
  if (changed !== original) await writeFile(file, changed);
}
await writeFile(
  'sources/media/local-replacements-applied.json',
  JSON.stringify(substitutions, null, 2) + '\n',
);
console.log(`Applied ${substitutions.length} reviewed local replacements.`);
