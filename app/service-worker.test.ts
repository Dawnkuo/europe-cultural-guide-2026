import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

describe('service worker', () => {
  it('precaches every city map for offline itinerary use', () => {
    const source = readFileSync('public/sw.js', 'utf8');

    expect(source).toContain('europe-cultural-guide-v7');
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
