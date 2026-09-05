// Only explicit, visually inspected selections may enter the offline asset set.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const selected = JSON.parse(
  await readFile('sources/media/selections.json', 'utf8'),
);
const official = JSON.parse(
  await readFile('sources/media/official-selections.json', 'utf8'),
);
const output = [];
await mkdir('public/images/reviewed', { recursive: true });
for (const [key, number] of Object.entries(selected)) {
  const search = JSON.parse(
    await readFile(`work/media-review/candidates/${key}.json`, 'utf8'),
  );
  const item = search.candidates.find(
    (c) => c.local === `${key}-${number}.jpg`,
  );
  if (!item) throw new Error(`Missing reviewed selection: ${key}-${number}`);
  output.push({
    key,
    file: `work/media-review/candidates/${item.local}`,
    url: item.thumburl || item.url,
    page: item.descriptionurl,
    description: item.extmetadata?.ImageDescription?.value,
    artist: item.extmetadata?.Artist?.value,
    license: item.extmetadata?.LicenseShortName?.value,
  });
}
output.push(...official);
let data = await readFile('app/data/guide-media.generated.ts', 'utf8');
let vatican = await readFile('app/data/guides/rome-vatican.ts', 'utf8');
const vaticanNames = {
  'vatican-chair': '87b056610ddec2ee19',
  'vatican-lantern': '2dc38eee47aef515d3',
  'vatican-necropolis': 'a11b9555b83ba6826b',
};
for (const item of output) {
  const bytes = await readFile(item.file);
  item.sha256 = createHash('sha256').update(bytes).digest('hex');
  const extension =
    bytes.toString('ascii', 0, 4) === 'RIFF'
      ? 'webp'
      : bytes[0] === 0x89
        ? 'png'
        : 'jpg';
  item.path = `/images/reviewed/${item.key}-${item.sha256.slice(0, 10)}.${extension}`;
  await copyFile(item.file, `public${item.path}`);
  const pattern = new RegExp(
    `/images/(?:guides/${item.key}|reviewed/${item.key}-[a-f0-9]+)\\.(?:jpg|png|webp)`,
    'g',
  );
  data = data.replace(pattern, item.path);
  if (vaticanNames[item.key]) {
    const pattern = new RegExp(
      `/vatican-guide/assets/images/${vaticanNames[item.key]}\\.webp|/images/reviewed/${item.key}-[a-f0-9]+\\.(?:jpg|png|webp)`,
      'g',
    );
    vatican = vatican.replace(pattern, item.path);
  }
}
await writeFile('app/data/guide-media.generated.ts', data);
await writeFile('app/data/guides/rome-vatican.ts', vatican);
await writeFile(
  'sources/media/replacements-applied.json',
  JSON.stringify(output, null, 2) + '\n',
);
console.log(`Installed ${output.length} reviewed images.`);
