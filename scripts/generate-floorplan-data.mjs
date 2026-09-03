import { mkdtemp, readdir, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '..');
const outputDirectory = join(root, 'app/data/floorplans');
const tempDirectory = await mkdtemp(join(tmpdir(), 'europe-floorplans-'));
const bundledModule = join(tempDirectory, 'guide-floorplans.mjs');

try {
  await build({
    bundle: true,
    entryPoints: [join(root, 'app/lib/guide-floorplans.ts')],
    format: 'esm',
    logLevel: 'silent',
    outfile: bundledModule,
    platform: 'node',
  });

  const { guideFloorPlanInventory, guideFloorPlans } = await import(
    pathToFileURL(bundledModule).href
  );

  for (const file of await readdir(outputDirectory)) {
    if (file.endsWith('.json')) await unlink(join(outputDirectory, file));
  }

  for (const [slug, floorPlan] of Object.entries(guideFloorPlans)) {
    await writeFile(
      join(outputDirectory, `${slug}.json`),
      `${JSON.stringify(floorPlan, null, 2)}\n`,
    );
  }

  const availability = Object.fromEntries(
    Object.entries(guideFloorPlanInventory).map(([slug, entry]) => [
      slug,
      entry.status,
    ]),
  );
  await writeFile(
    join(root, 'app/data/floorplan-availability.json'),
    `${JSON.stringify(availability, null, 2)}\n`,
  );
} finally {
  await rm(tempDirectory, { force: true, recursive: true });
}
