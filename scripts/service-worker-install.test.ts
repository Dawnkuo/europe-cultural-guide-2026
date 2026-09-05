import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

async function install(failAt?: number) {
  const batches: string[][] = [], writes: string[] = [];
  const handlers = new Map<string, (event: { waitUntil: (promise: Promise<void>) => void }) => void>();
  let result: Promise<void> | undefined;
  const cache = {
    addAll: async (urls: string[]) => {
      batches.push(urls);
      if (batches.length === failAt) throw new Error('Simulated resource download failure');
    },
    put: async (url: string) => { writes.push(url); },
  };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    URL, Response,
    self: {
      registration: { scope: 'https://example.test/europe-cultural-guide-2026/' },
      addEventListener: (type: string, handler: typeof handlers extends Map<string, infer V> ? V : never) => handlers.set(type, handler),
      skipWaiting: vi.fn(),
    },
    caches: { open: async () => cache },
    fetch: async () => new Response(JSON.stringify({ version: 2, routes: ['/guides/uffizi/'], assets: Array.from({ length: 1000 }, (_, i) => `/images/${i}.jpg`) })),
  });
  handlers.get('install')!({ waitUntil: (promise) => { result = promise; } });
  let failure: unknown;
  try { await result; } catch (error) { failure = error; }
  return { batches, writes, failure };
}

describe('offline package installation', () => {
  it('bounds each cache batch and marks readiness only after every asset succeeds', async () => {
    const { batches, writes, failure } = await install();
    expect(failure).toBeUndefined();
    expect(batches.length).toBeGreaterThan(60);
    expect(batches.every((batch) => batch.length <= 16)).toBe(true);
    expect(batches.flat().filter((url) => /\/images\/\d+\.jpg$/.test(url))).toHaveLength(1000);
    expect(new Set(batches.flat()).size).toBe(batches.flat().length);
    expect(writes.at(-1)).toBe('/europe-cultural-guide-2026/offline-ready');
  });

  it('does not declare a partially cached package ready', async () => {
    const { batches, writes, failure } = await install(3);
    expect(failure).toBeInstanceOf(Error);
    expect(batches).toHaveLength(3);
    expect(writes).not.toContain('/europe-cultural-guide-2026/offline-ready');
  });
});
