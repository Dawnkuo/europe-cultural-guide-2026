import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const basePath = '/europe-cultural-guide-2026';
const types = {
  '.html': 'text/html; charset=utf-8', '.rsc': 'text/x-component',
  '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary', '.wasm': 'application/wasm',
};

export async function startLocalPreview({ root, port = 55911 }) {
  root = resolve(root);
  const manifest = JSON.parse(await readFile(resolve(root, 'guide-precache.json'), 'utf8'));
  const server = createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (pathname === '/__local-preview.json') {
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ application: 'europe-guide-local-preview', revision: manifest.revision }));
        return;
      }
      if (pathname === '/' || pathname === basePath) {
        response.writeHead(302, { Location: `${basePath}/${url.search}` }).end();
        return;
      }
      if (!pathname.startsWith(`${basePath}/`)) {
        response.writeHead(404).end('Not found');
        return;
      }
      let file = resolve(root, `.${pathname.slice(basePath.length)}`);
      if (file !== root && !file.startsWith(`${root}${sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      if ((await stat(file)).isDirectory()) {
        if (!pathname.endsWith('/')) {
          response.writeHead(302, { Location: `${url.pathname}/${url.search}` }).end();
          return;
        }
        file = resolve(file, 'index.html');
      }
      const info = await stat(file);
      if (!info.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      if (request.method === 'HEAD') response.end();
      else createReadStream(file).on('error', () => response.destroy()).pipe(response);
    } catch {
      // A missing lazy module must not return the HTML application shell.
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((done, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => { server.off('error', reject); done(); });
  });
  return {
    url: `http://127.0.0.1:${server.address().port}${basePath}/`,
    revision: manifest.revision,
    close: () => new Promise((done, reject) => {
      server.closeAllConnections();
      server.close(error => error ? reject(error) : done());
    }),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), 'site');
  const firstPort = Number(process.env.GUIDE_PORT ?? 55911);
  if (!Number.isInteger(firstPort) || firstPort < 1024 || firstPort > 65515) throw new Error('Invalid GUIDE_PORT');
  let preview;
  for (let port = firstPort; port < firstPort + 20; port++) {
    try { preview = await startLocalPreview({ root, port }); break; }
    catch (error) { if (error.code !== 'EADDRINUSE') throw error; }
  }
  if (!preview) throw new Error('No free preview port. Close an earlier preview and retry.');
  console.log(`\nLocal Europe guide: ${preview.url}\nVersion: ${preview.revision}\nPress Ctrl+C to stop.\n`);
  if (process.argv.includes('--open') && process.platform === 'darwin') {
    spawn('/usr/bin/open', [preview.url], { stdio: 'ignore' }).on('error', error => console.error(error.message));
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await preview.close(); process.exit(0); });
}
