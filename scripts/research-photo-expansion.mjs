import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import sharp from 'sharp';

const queryFile = process.argv[2]?.endsWith('.json')
  ? process.argv[2]
  : 'sources/photography/expansion-queries.json';
const queries = JSON.parse(await readFile(queryFile, 'utf8'));
const root = 'work/photo-expansion';
await mkdir(`${root}/candidates`, { recursive: true });
async function fetchBytes(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, {
      signal: AbortSignal.timeout(45000),
      headers: {
        'User-Agent':
          'EuropeCulturalGuide/1.0 (https://github.com/Dawnkuo/europe-cultural-guide-2026)',
      },
    });
    if (r.status === 429 || r.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 3000));
      continue;
    }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    let b = Buffer.from(await r.arrayBuffer());
    if (b[0] === 31 && b[1] === 139) b = gunzipSync(b);
    return b;
  }
  throw new Error(`Unavailable: ${url}`);
}
for (const [id, query] of Object.entries(queries)) {
  if (
    process.argv[2] &&
    !process.argv[2].endsWith('.json') &&
    !id.includes(process.argv[2])
  )
    continue;
  try {
    let data;
    try {
      data = JSON.parse(
        await readFile(`${root}/candidates/${id}.json`, 'utf8'),
      );
    } catch {
      const p = new URLSearchParams({
        action: 'query',
        format: 'json',
        prop: 'imageinfo',
        iiprop: 'url|size|extmetadata',
        iiurlwidth: '1280',
      });
      if (query.startsWith('FILE:')) p.set('titles', `File:${query.slice(5)}`);
      else {
        p.set('generator', 'search');
        p.set('gsrsearch', query);
        p.set('gsrnamespace', '6');
        p.set('gsrlimit', '3');
      }
      data = JSON.parse(
        (
          await fetchBytes(`https://commons.wikimedia.org/w/api.php?${p}`)
        ).toString(),
      );
      data.researchQuery = query;
      await writeFile(
        `${root}/candidates/${id}.json`,
        JSON.stringify(data, null, 2),
      );
    }
    const pages = Object.values(data.query?.pages ?? {}).sort(
      (a, b) => a.index - b.index,
    );
    if (data.researchQuery && data.researchQuery !== query)
      throw new Error(
        'Query changed; use a new candidate ID and review again.',
      );
    if (
      query.startsWith('FILE:') &&
      !pages.some((page) => page.title === `File:${query.slice(5)}`)
    )
      throw new Error(
        'Cached candidate does not match requested file; use a new candidate ID.',
      );
    for (const [i, page] of pages.entries()) {
      const info = page.imageinfo?.[0];
      if (!info || !/\.(jpe?g|png|webp)$/i.test(page.title)) continue;
      const path = `${root}/candidates/${id}-${i}.jpg`;
      try {
        await readFile(path);
      } catch {
        await sharp(await fetchBytes(info.thumburl ?? info.url))
          .rotate()
          .resize({ width: 1280, height: 1280, fit: 'inside' })
          .jpeg({ quality: 85 })
          .toFile(path);
      }
    }
    console.log(id, pages.map((p, i) => `${i}:${p.title}`).join(' | '));
  } catch (e) {
    console.log('FAILED', id, e.message);
  }
}
