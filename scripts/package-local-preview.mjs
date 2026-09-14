import { cp, chmod, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(project, 'dist/client');
const manifest = JSON.parse(await readFile(join(source, 'guide-precache.json'), 'utf8'));
const date = new Date().toISOString().slice(0, 10);
const name = `europe-guide-local-${date}-${manifest.revision.slice(0, 8)}`;
const output = join(project, 'outputs/local-preview');
const destination = join(output, name);
await mkdir(output, { recursive: true });
await mkdir(destination);
await cp(source, join(destination, 'site'), { recursive: true, errorOnExist: true, force: false, filter: path => !path.endsWith('/.DS_Store') });
for (const file of ['serve.mjs', 'Start.command', 'README.md']) await cp(join(project, 'scripts/local-preview', file), join(destination, file));
await chmod(join(destination, 'Start.command'), 0o755);
for (const path of [...manifest.routes, ...manifest.assets]) {
  const target = join(destination, 'site', path);
  const info = await stat(target);
  if (info.isDirectory()) await stat(join(target, 'index.html'));
}
await writeFile(join(destination, 'release.json'), JSON.stringify({
  name, revision: manifest.revision, createdAt: new Date().toISOString(),
  assets: manifest.assets.length, manifestRoutes: manifest.routes.length,
  localOnly: true, status: 'preview-incomplete',
}, null, 2));

const files = [];
async function inventory(folder) {
  for (const entry of (await readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) await inventory(path);
    else {
      if (!entry.isFile()) throw new Error(`Non-file in preview: ${path}`);
      const hash = createHash('sha256');
      for await (const chunk of createReadStream(path)) hash.update(chunk);
      files.push({ path: path.slice(destination.length + 1), bytes: (await stat(path)).size, sha256: hash.digest('hex') });
    }
  }
}
await inventory(destination);
await writeFile(join(destination, 'files.sha256.json'), JSON.stringify(files, null, 2));
const archive = `${destination}.zip`;
execFileSync('/usr/bin/zip', ['-qr', archive, name], { cwd: output, stdio: 'inherit' });
const hash = createHash('sha256');
for await (const chunk of createReadStream(archive)) hash.update(chunk);
await writeFile(`${archive}.sha256`, `${hash.digest('hex')}  ${name}.zip\n`);
console.log(JSON.stringify({ directory: destination, archive, bytes: (await stat(archive)).size, files: files.length, revision: manifest.revision }, null, 2));
