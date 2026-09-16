import { writeFile, stat } from 'node:fs/promises';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-photo-audit',
  server: { middlewareMode: true },
});
try {
  const {
    photoSpots: spots,
    photoSpotMedia: media,
    photoCities,
  } = await server.ssrLoadModule('/app/data/photo-spots.ts');
  const { guideCatalog } = await server.ssrLoadModule('/app/data/guides.ts');
  const { photoCoverageNotes } = await server.ssrLoadModule(
    '/app/data/photo-coverage.ts',
  );
  const kind = (spot) =>
    spot.kind ??
    (spot.id === 'milan-galleria'
      ? 'indoor'
      : spot.id === 'cologne-triangle'
        ? 'terrace'
        : 'outdoor');
  const counts = (list) =>
    Object.fromEntries(
      ['indoor', 'outdoor', 'terrace'].map((type) => [
        type,
        list.filter((spot) => kind(spot) === type).length,
      ]),
    );
  let bytes = 0;
  for (const photo of Object.values(media))
    bytes += (await stat(`public${photo.src}`)).size;
  const report = {
    checkedAt: '2026-09-16',
    spots: spots.length,
    ...counts(spots),
    mediaBytes: bytes,
    cities: photoCities.map((city) => ({
      city,
      total: spots.filter((spot) => spot.city === city).length,
      ...counts(spots.filter((spot) => spot.city === city)),
    })),
    guides: guideCatalog.map((guide) => {
      const list = spots.filter((spot) => spot.guideSlugs.includes(guide.slug));
      return {
        slug: guide.slug,
        title: guide.title,
        city: guide.city,
        ids: list.map((spot) => spot.id),
        ...counts(list),
        note: photoCoverageNotes[guide.slug] ?? null,
      };
    }),
    indoorPolicyUnverified: spots
      .filter(
        (spot) =>
          kind(spot) === 'indoor' &&
          !spot.policyKey &&
          spot.id !== 'milan-galleria',
      )
      .map((spot) => spot.id),
  };
  if (report.guides.some((guide) => !guide.ids.length))
    throw new Error('Guide without a photographic reference');
  await writeFile(
    'sources/photography/coverage-review.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    JSON.stringify(
      {
        ...report,
        guides: report.guides.length,
        indoorPolicyUnverified: report.indoorPolicyUnverified.length,
      },
      null,
      2,
    ),
  );
} finally {
  await server.close();
}
