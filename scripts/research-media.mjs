// Candidates stay outside public until their subject and framing are inspected.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const queries = JSON.parse(
  await readFile(process.argv[4] || 'sources/media/queries.json', 'utf8'),
);
const out = path.join(root, 'work/media-review/candidates');
await mkdir(out, { recursive: true });
const start = Number(process.argv[2] || 0);
const end = Number(process.argv[3] || Object.keys(queries).length);
for (const [key, search] of Object.entries(queries).slice(start, end)) {
  const recordPath = path.join(out, `${key}.json`);
  try {
    const prior = JSON.parse(await readFile(recordPath, 'utf8'));
    if (prior.search === search) continue;
  } catch {
    /* New search. */
  }
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: search + ' filetype:bitmap',
    gsrnamespace: '6',
    gsrlimit: '4',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '960',
    format: 'json',
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
      { signal: AbortSignal.timeout(30000) },
    );
    if (response.status === 429) {
      console.error('Rate limit reached; stopping. Retry this range later.');
      break;
    }
    if (!response.ok) throw new Error(`Search HTTP ${response.status}`);
    const result = await response.json();
    const pages = Object.values(result.query?.pages ?? {}).sort(
      (a, b) => a.index - b.index,
    );
    const candidates = [];
    for (const [index, page] of pages.entries()) {
      const info = page.imageinfo[0];
      const local = `${key}-${index + 1}.jpg`;
      const imageResponse = await fetch(info.thumburl || info.url, {
        signal: AbortSignal.timeout(25000),
      });
      if (!imageResponse.ok) continue;
      await writeFile(
        path.join(out, local),
        Buffer.from(await imageResponse.arrayBuffer()),
      );
      candidates.push({ title: page.title, local, ...info });
    }
    await writeFile(
      recordPath,
      JSON.stringify({ key, search, candidates }, null, 2) + '\n',
    );
    console.log(
      key,
      candidates.map((c) => c.title),
    );
  } catch (error) {
    console.error(key, error.message);
  }
}
