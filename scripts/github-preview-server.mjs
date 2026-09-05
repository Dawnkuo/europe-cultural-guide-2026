import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const types = { '.html': 'text/html', '.rsc': 'text/x-component', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2' };

export async function githubPreview(output = 'dist/client', basePath = '/europe-cultural-guide-2026') {
  const root = resolve(output);
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(`${basePath}/`)) { response.writeHead(404).end(); return; }
      let file = resolve(root, `.${pathname.slice(basePath.length)}`);
      if (file !== root && !file.startsWith(`${root}${sep}`)) { response.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      await stat(file);
      response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
      createReadStream(file).pipe(response);
    } catch {
      // Missing modules must remain errors, never the HTML application shell.
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return {
    url: `http://127.0.0.1:${server.address().port}${basePath}`,
    close: () => new Promise((done, reject) => server.close((error) => error ? reject(error) : done())),
  };
}
