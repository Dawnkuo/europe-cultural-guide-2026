import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

function installHarness(failAssets = false) {
  const handlers = new Map<string, (event: unknown) => void>();
  const stored = new Map<string, Response>();
  const cache = {
    addAll: vi.fn(async () => { if (failAssets) throw new Error('Asset fetch failed'); }),
    put: vi.fn(async (key: string, response: Response) => { stored.set(key, response); }),
    match: vi.fn(async (key: string) => stored.get(key)),
  };
  const caches = { open: vi.fn(async () => cache), keys: vi.fn(async () => ['vatican-offline-v1', 'europe-cultural-guide-v8', 'europe-cultural-guide-v9']), delete: vi.fn(async () => true) };
  const self = { addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name,handler), skipWaiting: vi.fn(), clients: { claim: vi.fn() }, registration: { scope: 'https://example.com/europe-cultural-guide-2026/' } };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { Promise, Set, Response, URL, caches, self, fetch: vi.fn(async () => Response.json({ version:2, routes:['/guides/uffizi/'], assets:['/_next/static/chunks/uffizi.js'] })) });
  async function event(name: string, detail = {}) {
    let task: Promise<unknown> | undefined;
    handlers.get(name)!({ ...detail, waitUntil: (promise: Promise<unknown>) => { task = promise; } });
    await task;
  }
  return { event, cache, caches, stored };
}

describe('service worker', () => {
  it('serves precached static route payloads offline without mixing in application query parameters', async () => {
    const handlers = new Map<string, (event: unknown) => void>();
    const cache = { match: vi.fn(async (key: unknown) => key === 'https://example.com/europe-cultural-guide-2026/guides/uffizi.rsc' ? new Response('route payload') : undefined) };
    const self = {
      addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name,handler),
      location: { origin:'https://example.com' }, registration:{scope:'https://example.com/europe-cultural-guide-2026/'},
    };
    runInNewContext(readFileSync('public/sw.js','utf8'), { Promise, Set, Response, Request, Headers, URL, self,
      caches:{open:vi.fn(async()=>cache)}, fetch:vi.fn(async()=>{throw new Error('offline');}) });
    async function request(query: string) {
      let response: Promise<Response> | undefined;
      handlers.get('fetch')!({request:new Request(`https://example.com/europe-cultural-guide-2026/guides/uffizi.rsc${query}`),respondWith:(value:Promise<Response>)=>{response=value;}});
      return response!;
    }
    const payload = await request('?_rsc=route-hash');
    expect(await payload.text()).toBe('route payload');
    expect(payload.headers.get('content-type')).toBe('text/x-component');
    expect((await request('?_rsc=route-hash&collection=other')).type).toBe('error');
  });
  it('marks ready only after complete guide and lazy asset caching, scoped once', async () => {
    const harness = installHarness();
    await harness.event('install');
    expect(harness.cache.addAll).toHaveBeenCalledWith(expect.arrayContaining(['/europe-cultural-guide-2026/_next/static/chunks/uffizi.js', '/europe-cultural-guide-2026/guides/uffizi/']));
    expect(harness.stored.has('/europe-cultural-guide-2026/offline-ready')).toBe(true);
    const reply = vi.fn();
    await harness.event('message', { data: { type:'OFFLINE_STATUS' }, source: { postMessage: reply } });
    expect(reply).toHaveBeenCalledWith({ type:'OFFLINE_STATUS', ready:true, version:'europe-cultural-guide-v9' });
  });

  it('does not silently activate a core-only cache when map assets fail', async () => {
    const harness = installHarness(true);
    await expect(harness.event('install')).rejects.toThrow('Asset fetch failed');
    expect(harness.stored.has('/europe-cultural-guide-2026/offline-ready')).toBe(false);
    expect(harness.cache.addAll).toHaveBeenCalledOnce();
  });

  it('removes only this guide\'s obsolete caches', async () => {
    const harness = installHarness();
    await harness.event('activate');
    expect(harness.caches.delete).toHaveBeenCalledExactlyOnceWith('europe-cultural-guide-v8');
  });
  it('precaches every city map for offline itinerary use', () => {
    const source = readFileSync('public/sw.js', 'utf8');

    expect(source).toContain('europe-cultural-guide-v9');
    for (const city of [
      'milan',
      'venice',
      'florence',
      'pisa',
      'rome-vatican',
      'barcelona',
      'cologne',
      'paris',
    ]) {
      expect(source).toContain(`/map-data/${city}.json`);
    }
  });

  it('prefers a fresh network response and keeps cache as the offline fallback', async () => {
    const handlers = new Map<string, (event: unknown) => void>();
    const cache = { addAll: vi.fn(), put: vi.fn() };
    const caches = {
      delete: vi.fn(),
      keys: vi.fn(async () => []),
      match: vi.fn(async () => new Response('stale')),
      open: vi.fn(async () => cache),
    };
    const networkFetch = vi.fn(
      async () => new Response('fresh', { status: 200 }),
    );
    const self = {
      addEventListener: (type: string, handler: (event: unknown) => void) =>
        handlers.set(type, handler),
      clients: { claim: vi.fn() },
      location: { origin: 'https://example.com' },
      registration: {
        scope: 'https://example.com/europe-cultural-guide-2026/',
      },
      skipWaiting: vi.fn(),
    };

    runInNewContext(readFileSync('public/sw.js', 'utf8'), {
      Promise,
      Set,
      Request,
      Response,
      URL,
      caches,
      fetch: networkFetch,
      self,
    });

    let responsePromise: Promise<Response> | undefined;
    handlers.get('fetch')?.({
      request: new Request('https://example.com/europe-cultural-guide-2026/'),
      respondWith: (promise: Promise<Response>) => {
        responsePromise = promise;
      },
    });

    expect(responsePromise).toBeDefined();
    expect(await (await responsePromise!).text()).toBe('fresh');
    expect(networkFetch).toHaveBeenCalledOnce();
  });
});
