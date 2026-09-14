// @vitest-environment node
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { startLocalPreview } from './serve.mjs';

let root: string;
let preview: { url: string; revision: string; close: () => Promise<void> };
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'guide-preview-test-'));
  await mkdir(join(root, 'guides/example'), { recursive: true });
  for (const [file, content] of Object.entries({
    'guide-precache.json': '{"revision":"test-build"}',
    'index.html': '<h1>Guide</h1>', 'guides/example/index.html': '<h1>Example</h1>',
    'guides/example.rsc': 'component', 'sw.js': 'self.addEventListener("fetch",()=>{});',
  })) await writeFile(join(root, file), content);
  preview = await startLocalPreview({ root, port: 0 });
});
afterAll(async () => { await preview?.close(); await rm(root, { recursive: true, force: true }); });

test('serves a loopback-only build with a revision probe and root redirect', async () => {
  const url = new URL(preview.url);
  expect(url.hostname).toBe('127.0.0.1');
  const probe = await fetch(`${url.origin}/__local-preview.json`);
  expect(await probe.json()).toMatchObject({ revision: 'test-build' });
  const response = await fetch(url.origin, { redirect: 'manual' });
  expect(response.status).toBe(302);
  expect(response.headers.get('location')).toBe('/europe-cultural-guide-2026/');
});
test('supports direct routes and preserves query strings through slash redirects', async () => {
  const response = await fetch(`${preview.url}guides/example?q=1`, { redirect: 'manual' });
  expect(response.headers.get('location')).toBe('/europe-cultural-guide-2026/guides/example/?q=1');
  expect(await (await fetch(`${preview.url}guides/example/`)).text()).toContain('Example');
});
test('uses JavaScript and RSC MIME types, and responds to HEAD without a body', async () => {
  const sw = await fetch(`${preview.url}sw.js`);
  expect(sw.headers.get('content-type')).toBe('text/javascript');
  expect((await fetch(`${preview.url}guides/example.rsc`)).headers.get('content-type')).toBe('text/x-component');
  const head = await fetch(preview.url, { method: 'HEAD' });
  expect(Number(head.headers.get('content-length'))).toBeGreaterThan(0);
  expect(await head.text()).toBe('');
});
test('does not turn missing assets into HTML or expose files outside the site', async () => {
  expect((await fetch(`${preview.url}missing.js`)).status).toBe(404);
  expect((await fetch(`${preview.url}%2e%2e%2fREADME.md`)).status).toBe(403);
  expect((await fetch(`${new URL(preview.url).origin}/README.md`)).status).toBe(404);
});
test('rejects mutations', async () => {
  const response = await fetch(preview.url, { method: 'POST', body: 'data' });
  expect(response.status).toBe(405);
  expect(response.headers.get('allow')).toBe('GET, HEAD');
});
