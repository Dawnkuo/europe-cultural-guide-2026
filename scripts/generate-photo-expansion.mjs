import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const selections = JSON.parse(
  await readFile('sources/photography/expansion-selections.json', 'utf8'),
);
const media = JSON.parse(
  await readFile('app/data/photo-spot-media.generated.json', 'utf8'),
);
const overrides = JSON.parse(
  await readFile('sources/photography/metadata-overrides.json', 'utf8'),
);
const descriptions = [];
const plain = (html) => {
  const dom = new JSDOM(html ?? '');
  const value = dom.window.document.body.textContent.trim();
  dom.window.close();
  return value;
};
await mkdir('public/images/photo-spots', { recursive: true });
await mkdir('sources/photography/expanded', { recursive: true });
for (const [id, index] of Object.entries(selections)) {
  const data = JSON.parse(
    await readFile(`work/photo-expansion/candidates/${id}.json`, 'utf8'),
  );
  const page = Object.values(data.query?.pages ?? {}).sort(
    (a, b) => a.index - b.index,
  )[index];
  if (!page?.imageinfo?.[0])
    throw new Error(`Missing reviewed candidate ${id}:${index}`);
  const info = page.imageinfo[0],
    meta = info.extmetadata;
  const license = plain(meta.LicenseShortName?.value);
  if (
    !/^(CC BY(?:-SA)? (?:[234]\.0|2\.5)(?: es|de|it)?|CC0|Public domain)$/.test(
      license,
    )
  )
    throw new Error(`Unapproved license ${id}: ${license}`);
  const src = `/images/photo-spots/${id}.webp`;
  const bytes = await sharp(
    `work/photo-expansion/candidates/${id}-${index}.jpg`,
  )
    .webp({ quality: 84 })
    .toBuffer();
  const size = await sharp(bytes).metadata();
  const override = overrides[id];
  if (override && override.sourceUrl !== info.descriptionurl)
    throw new Error(`Stale source override ${id}`);
  media[id] = {
    src,
    width: size.width,
    height: size.height,
    author:
      override?.author ?? plain(meta.Attribution?.value || meta.Artist?.value),
    license,
    licenseUrl:
      plain(meta.LicenseUrl?.value) ||
      (license === 'Public domain'
        ? 'https://creativecommons.org/publicdomain/mark/1.0/'
        : 'https://creativecommons.org/publicdomain/zero/1.0/'),
    sourceUrl: info.descriptionurl,
    capturedAt: override?.capturedAt ?? plain(meta.DateTimeOriginal?.value),
    latitude: meta.GPSLatitude ? Number(meta.GPSLatitude.value) : null,
    longitude: meta.GPSLongitude ? Number(meta.GPSLongitude.value) : null,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
  if (!media[id].author) throw new Error(`Missing photo attribution ${id}`);
  await writeFile(`public${src}`, bytes);
  await writeFile(
    `sources/photography/expanded/${id}.json`,
    JSON.stringify(
      { reviewedAt: '2026-09-16', candidateIndex: index, page },
      null,
      2,
    ) + '\n',
  );
  descriptions.push({
    id,
    ...media[id],
    description: plain(meta.ImageDescription?.value),
  });
}
await writeFile(
  'app/data/photo-spot-media.generated.json',
  JSON.stringify(media, null, 2) + '\n',
);
await writeFile(
  'work/photo-expansion/selected-metadata.json',
  JSON.stringify(descriptions, null, 2) + '\n',
);
console.log(
  `Selected ${descriptions.length} new photos; ${Object.keys(media).length} total.`,
);
