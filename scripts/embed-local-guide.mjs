import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

export async function embedLocalGuide({ source, guideOutput, slugs }) {
  await mkdir(guideOutput, { recursive: true });

  for (const slug of slugs) {
    const destination = join(guideOutput, slug);
    await rm(destination, { recursive: true, force: true });
    await cp(source, destination, { recursive: true });
  }
}
