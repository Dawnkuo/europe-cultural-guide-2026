import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { workerHarness } from '../test/worker-harness';

function installHarness(failAssets = false) {
  const harness = workerHarness();
  harness.assets.push('/_next/static/chunks/uffizi.js');
  if (failAssets) harness.failed.add('/europe-cultural-guide-2026/');
  const worker = harness.start();
  return { ...worker, caches: harness.caches, network: harness.network, recover: () => harness.failed.clear() };
}

describe('service worker', () => {
  it('serves precached static route payloads offline without mixing in application query parameters', async () => {
    const handlers = new Map<string, (event: unknown) => void>();
    const cache = {
      match: vi.fn(async (key: unknown) =>
        key ===
        'https://example.com/europe-cultural-guide-2026/guides/uffizi.rsc'
          ? new Response('route payload')
          : undefined,
      ),
    };
    const self = {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      location: { origin: 'https://example.com' },
      registration: {
        scope: 'https://example.com/europe-cultural-guide-2026/',
      },
    };
    runInNewContext(readFileSync('public/sw.js', 'utf8'), {
      Promise,
      Set,
      Response,
      Request,
      Headers,
      URL,
      self,
      caches: { open: vi.fn(async () => cache) },
      fetch: vi.fn(async () => {
        throw new Error('offline');
      }),
    });
    async function request(query: string) {
      let response: Promise<Response> | undefined;
      handlers.get('fetch')!({
        request: new Request(
          `https://example.com/europe-cultural-guide-2026/guides/uffizi.rsc${query}`,
        ),
        respondWith: (value: Promise<Response>) => {
          response = value;
        },
      });
      return response!;
    }
    const payload = await request('?_rsc=route-hash');
    expect(await payload.text()).toBe('route payload');
    expect(payload.headers.get('content-type')).toBe('text/x-component');
    expect(await (await request('?_rsc=route-hash&v=release')).text()).toBe(
      'route payload',
    );
    expect((await request('?_rsc=route-hash&collection=other')).type).toBe(
      'error',
    );
  });
  it('serves release bookmarks and slash variants offline without mixing application queries or scopes', async () => {
    const handlers = new Map<string, (event: unknown) => void>();
    const cache = {
      match: vi.fn(async (key: unknown) =>
        key === 'https://example.com/europe-cultural-guide-2026/guides/uffizi/'
          ? new Response('Uffizi page')
          : undefined,
      ),
    };
    runInNewContext(readFileSync('public/sw.js', 'utf8'), {
      Promise,
      Set,
      Response,
      Request,
      Headers,
      URL,
      self: {
        location: { origin: 'https://example.com' },
        registration: {
          scope: 'https://example.com/europe-cultural-guide-2026/',
        },
        addEventListener: (name: string, handler: (event: unknown) => void) =>
          handlers.set(name, handler),
      },
      caches: { open: async () => cache },
      fetch: async () => {
        throw new Error('Offline');
      },
    });
    async function navigate(path: string) {
      let result: Promise<Response> | undefined;
      handlers.get('fetch')!({
        request: {
          method: 'GET',
          mode: 'navigate',
          url: `https://example.com${path}`,
        },
        respondWith: (promise: Promise<Response>) => {
          result = promise;
        },
      });
      return result!;
    }
    for (const suffix of [
      '?v=release',
      '/?v=release',
      '/index.html?v=release',
    ]) {
      expect(
        await (
          await navigate(`/europe-cultural-guide-2026/guides/uffizi${suffix}`)
        ).text(),
      ).toBe('Uffizi page');
    }
    expect(
      (
        await navigate(
          '/europe-cultural-guide-2026/guides/uffizi/?collection=other',
        )
      ).type,
    ).toBe('error');
    expect((await navigate('/other-guide/guides/uffizi/?v=release')).type).toBe(
      'error',
    );
  });
  it('marks ready only after complete guide and lazy asset caching, scoped once', async () => {
    const harness = installHarness();
    await harness.event('install');
    expect(harness.stored.has('/europe-cultural-guide-2026/_next/static/chunks/uffizi.js')).toBe(true);
    expect(harness.stored.has('/europe-cultural-guide-2026/guides/uffizi/')).toBe(true);
    expect(
      harness.stored.has('/europe-cultural-guide-2026/offline-ready'),
    ).toBe(true);
    const reply = vi.fn();
    await harness.event('message', {
      data: { type: 'OFFLINE_STATUS' },
      source: { postMessage: reply },
    });
    expect(reply).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OFFLINE_STATUS',
        ready: true,
        version: 'europe-cultural-guide-v9',
        phase: 'ready',
        total: expect.any(Number),
      }),
    );
    const updates = harness.postMessage.mock.calls.map(([message]) => message);
    expect(updates[0]).toMatchObject({
      type: 'OFFLINE_PROGRESS',
      phase: 'downloading',
      completed: 0,
    });
    expect(updates.at(-1)).toMatchObject({
      phase: 'ready',
      completed: updates[0].total,
    });
    expect(harness.self.skipWaiting).toHaveBeenCalledOnce();
  });

  it('does not silently activate a core-only cache when map assets fail', async () => {
    const harness = installHarness(true);
    await expect(harness.event('install')).rejects.toThrow(
      'Asset fetch failed',
    );
    expect(
      harness.stored.has('/europe-cultural-guide-2026/offline-ready'),
    ).toBe(false);
    expect(harness.stored.has('/europe-cultural-guide-2026/itinerary/')).toBe(true);
    expect(harness.self.skipWaiting).not.toHaveBeenCalled();
    expect(harness.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ phase: 'failed' }),
    );
  });

  it('can retry an incomplete cache and reports complete only after the retry succeeds', async () => {
    const harness = installHarness(true);
    await harness.event('message', { data: { type: 'OFFLINE_RETRY' } });
    expect(
      harness.stored.has('/europe-cultural-guide-2026/offline-ready'),
    ).toBe(false);
    harness.recover();
    await harness.event('message', { data: { type: 'OFFLINE_RETRY' } });
    expect(
      harness.stored.has('/europe-cultural-guide-2026/offline-ready'),
    ).toBe(true);
    expect(harness.postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({ phase: 'ready' }),
    );
  });

  it("removes only this guide's obsolete caches", async () => {
    const harness = installHarness();
    await harness.caches.open('vatican-offline-v1');
    await harness.caches.open('europe-cultural-guide-v8');
    await harness.event('activate');
    expect(harness.caches.delete).toHaveBeenCalledExactlyOnceWith(
      'europe-cultural-guide-v8',
    );
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
    const cache = { match: vi.fn(), put: vi.fn() };
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
