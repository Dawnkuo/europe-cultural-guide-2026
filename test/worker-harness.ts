import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { vi } from 'vitest';

const base = '/europe-cultural-guide-2026';
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
type Detail = Record<string, unknown>;

export function workerHarness(assetCount = 20) {
  const stores = new Map<string, Map<string, Response>>();
  const failed = new Set<string>();
  const invalid = new Set<string>();
  const quota = new Set<string>();
  const assets = Array.from({ length: assetCount }, (_, i) => `/images/${i}.jpg`);
  const routes = ['/guides/uffizi/'];
  let core: string[] = [];
  let revision = '1'.repeat(20);
  let inFlight = 0;
  let maxInFlight = 0;
  const key = (url: string | Request) => {
    const value = new URL(typeof url === 'string' ? url : url.url, `https://example.com${base}/`);
    return value.pathname + value.search;
  };
  const cache = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const stored = stores.get(name)!;
    return {
      put: async (url: string, response: Response) => {
        if (quota.has(key(url))) throw new Error('Quota exceeded');
        // Consume the complete body before committing, just like Cache.put().
        stored.set(key(url), new Response(await response.arrayBuffer(), { status: response.status, headers: response.headers }));
      },
      match: async (url: string) => stored.get(key(url))?.clone(),
      delete: async (url: string) => stored.delete(key(url)),
      keys: async () => [...stored.keys()].map(url => new Request(`https://example.com${url}`)),
    };
  };
  const network = vi.fn(async (url: string) => {
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await Promise.resolve();
    inFlight -= 1;
    if (failed.has(key(url)) || failed.has('*')) throw new Error('Asset fetch failed');
    if (key(url).endsWith('/guide-precache.json')) return Response.json({
      version: 2, revision, routes, assets,
      integrity: Object.fromEntries([...core.map(path => path.slice(base.length)), ...routes, ...assets].map(path => [path, sha('asset')])),
    });
    return new Response(invalid.has(key(url)) ? 'wrong release or HTML error' : 'asset');
  });
  const caches = {
    open: vi.fn(async (name: string) => cache(name)),
    keys: vi.fn(async () => [...stores.keys()]),
    delete: vi.fn(async (name: string) => stores.delete(name)),
  };
  function start(name = 'europe-cultural-guide-v9') {
    const handlers = new Map<string, (event: Detail) => void>();
    const postMessage = vi.fn();
    const self = {
      registration: { scope: `https://example.com${base}/` },
      location: { origin: 'https://example.com' },
      addEventListener: (type: string, handler: (event: Detail) => void) => handlers.set(type, handler),
      skipWaiting: vi.fn(),
      clients: { matchAll: vi.fn(async () => [{ postMessage }]), claim: vi.fn() },
    };
    const source = readFileSync('public/sw.js', 'utf8').replace("const CACHE = 'europe-cultural-guide-v9';", `const CACHE = '${name}';`);
    core = runInNewContext(`${source}\nCORE`, { self, caches, fetch: network, crypto: webcrypto, Response, Request, Headers, URL, Uint8Array });
    async function event(type: string, detail: Detail = {}) {
      let task: Promise<unknown> | undefined;
      handlers.get(type)!({ ...detail, waitUntil: (promise: Promise<unknown>) => { task = promise; }, respondWith: (promise: Promise<unknown>) => { task = promise; } });
      return await task;
    }
    return { event, postMessage, self, stored: stores.get(name) ?? (cache(name), stores.get(name)!), cache: cache(name) };
  }
  return { start, stores, caches, network, failed, invalid, quota, assets, base, setRevision: (value: string) => { revision = value; }, maxInFlight: () => maxInFlight };
}
