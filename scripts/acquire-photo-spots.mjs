import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

const selections = {
  'paris-facade': 'Notre Dame west facade 2025-09-02 - 01.jpg',
  'paris-seine': 'NotreDame ViewFromSeine.jpg',
  'milan-duomo': 'Milan Duomo with tourists in Piazza.jpg',
  'milan-galleria': 'Galleria Vittorio Emanuele II, Milan, interior.jpg',
  'venice-accademia':
    'Canal Grande Chiesa della Salute e Dogana dal ponte dell Accademia.jpg',
  'venice-rialto':
    'Venezia Ponte Rialto Blick auf die Riva del Vin bei Nacht.jpg',
  'florence-panorama':
    'Florence panorama as seen from The Piazza Michelangelo.jpg',
  'florence-bridge': 'Ponte Vecchio 001.jpg',
  'pisa-west':
    'Pisa Cathedral and Pisa Tower, Campo dei Miracoli (Field of Miracles), Pisa, Italy.jpg',
  'pisa-east': 'Pisa Leaning Tower and Cathedral 01.jpg',
  'rome-colosseum': 'Colosseum - Rome.jpg',
  'rome-vatican': 'Saint Peter Basilica Rome.jpg',
  'barcelona-sagrada':
    'Barcelona - Plaça de Gaudí - View SW on La Sagrada Família - Nativity façade I.jpg',
  'barcelona-guell': 'Parc Güell Terrace.jpg',
  'cologne-river':
    'Hohenzollernbrücke - Kölner Dom - MusicalDome bei Nacht-2928.jpg',
  'cologne-triangle': 'Köln Hohenzollernbrücke.jpg',
};
const sourceDirectory = 'sources/photography';
await mkdir(sourceDirectory, { recursive: true });
await mkdir('public/images/photo-spots', { recursive: true });
const plain = (value) => {
  const dom = new JSDOM(value ?? '');
  const text = dom.window.document.body.textContent.trim();
  dom.window.close();
  return text;
};
async function download(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'EuropeCulturalGuide/1.0 (https://github.com/Dawnkuo/europe-cultural-guide-2026)',
    },
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes[0] === 0x1f && bytes[1] === 0x8b ? gunzipSync(bytes) : bytes;
}
const media = JSON.parse(await readFile('app/data/photo-spot-media.generated.json', 'utf8').catch(() => '{}'));
for (const [id, title] of Object.entries(selections)) {
  const sourcePath = `${sourceDirectory}/${id}.json`;
  let source;
  try {
    source = JSON.parse(await readFile(sourcePath, 'utf8'));
  } catch {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      titles: `File:${title}`,
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: '1280',
    });
    const data = JSON.parse(
      (
        await download(`https://commons.wikimedia.org/w/api.php?${params}`)
      ).toString('utf8'),
    );
    const page = Object.values(data.query?.pages ?? {})[0];
    if (!page?.imageinfo?.[0]) throw new Error(`Missing source: ${title}`);
    source = { retrievedAt: new Date().toISOString(), page };
    await writeFile(sourcePath, `${JSON.stringify(source, null, 2)}\n`);
  }
  const info = source.page.imageinfo[0];
  const meta = info.extmetadata;
  const license = plain(meta.LicenseShortName?.value);
  if (!/^(CC BY(?:-SA)? [234]\.0|CC0|Public domain)$/.test(license))
    throw new Error(`Review license: ${id}: ${license}`);
  const src = `/images/photo-spots/${id}.webp`;
  let bytes;
  try {
    bytes = await readFile(`public${src}`);
  } catch {
    const original = await download(info.thumburl ?? info.url);
    bytes = await sharp(original)
      .rotate()
      .resize({
        width: 1440,
        height: 1440,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toBuffer();
    await writeFile(`public${src}`, bytes);
  }
  const dimensions = await sharp(bytes).metadata();
  media[id] = {
    src,
    width: dimensions.width,
    height: dimensions.height,
    author:
      id === 'venice-accademia'
        ? 'Wolfgang Moroder'
        : plain(meta.Attribution?.value || meta.Artist?.value),
    license,
    licenseUrl:
      plain(meta.LicenseUrl?.value) ||
      (license === 'Public domain'
        ? 'https://creativecommons.org/publicdomain/mark/1.0/'
        : 'https://creativecommons.org/publicdomain/zero/1.0/'),
    sourceUrl: info.descriptionurl,
    capturedAt: plain(meta.DateTimeOriginal?.value),
    latitude: meta.GPSLatitude ? Number(meta.GPSLatitude.value) : null,
    longitude: meta.GPSLongitude ? Number(meta.GPSLongitude.value) : null,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
  console.log(
    id,
    JSON.stringify({
      ...media[id],
      description: plain(meta.ImageDescription?.value),
    }),
  );
  await new Promise((resolve) => setTimeout(resolve, 750));
}
await writeFile(
  'app/data/photo-spot-media.generated.json',
  `${JSON.stringify(media, null, 2)}\n`,
);
