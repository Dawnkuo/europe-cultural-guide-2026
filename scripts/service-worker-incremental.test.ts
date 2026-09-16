import { describe, expect, it, vi } from 'vitest';
import { workerHarness } from '../test/worker-harness';

const oldName = 'europe-cultural-guide-v9-' + '1'.repeat(20);
const nextName = 'europe-cultural-guide-v9-' + '2'.repeat(20);
const comparePaths = (a: string, b: string) => a.localeCompare(b);
async function setup() {
  const harness = workerHarness(8);
  const previous = harness.start(oldName);
  await previous.event('install');
  harness.setRevision('2'.repeat(20));
  harness.network.mockClear();
  const next = harness.start(nextName);
  return { harness, previous, next };
}
const marker = async (worker: ReturnType<ReturnType<typeof workerHarness>['start']>, base: string) =>
  await worker.stored.get(base + '/offline-ready')!.clone().json() as { total: number; reused: number; downloaded: number };

describe('cross-release offline updates', () => {
  it('downloads only changed/new resources, excludes removed files, and switches only after completion', async () => {
    const { harness, previous, next } = await setup();
    harness.bodies.set(harness.base + '/', 'new home');
    harness.assets.push('/images/new.jpg');
    harness.assets.splice(harness.assets.indexOf('/images/7.jpg'), 1);
    await next.event('install');
    expect(harness.network.mock.calls.map(([url]) => url).sort(comparePaths)).toEqual([
      harness.base + '/', harness.base + '/guide-precache.json', harness.base + '/images/new.jpg',
    ].sort(comparePaths));
    expect(await next.stored.get(harness.base + '/')!.clone().text()).toBe('new home');
    expect(next.stored.has(harness.base + '/images/7.jpg')).toBe(false);
    expect(harness.stores.has(oldName)).toBe(true);
    expect(await previous.stored.get(harness.base + '/')!.clone().text()).toBe('asset');
    const ready = await marker(next, harness.base);
    expect(ready.downloaded).toBe(2);
    expect(ready.reused).toBe(ready.total - 2);
    expect(next.self.skipWaiting).toHaveBeenCalledOnce();
    await next.event('activate');
    expect(harness.stores.has(oldName)).toBe(false);
  });

  it('reuses bytes from legacy caches without integrity metadata only after hashing the body', async () => {
    const { harness, previous, next } = await setup();
    const manifestUrl = harness.base + '/guide-precache.json';
    const manifest = await previous.stored.get(manifestUrl)!.clone().json() as Record<string, unknown>;
    delete manifest.integrity;
    previous.stored.set(manifestUrl, Response.json(manifest));
    for (const [url, response] of previous.stored) {
      if (response.headers.has('X-Offline-Sha256')) previous.stored.set(url, new Response(await response.clone().text()));
    }
    previous.stored.set(harness.base + '/images/0.jpg', new Response('corrupted'));
    await next.event('install');
    expect(harness.network.mock.calls.map(([url]) => url)).toEqual([
      manifestUrl, harness.base + '/images/0.jpg',
    ]);
    expect((await marker(next, harness.base)).downloaded).toBe(1);
  });

  it('does not trust stale checksum headers, missing files, partial responses or query variants', async () => {
    const { harness, previous, next } = await setup();
    const url = harness.base + '/images/0.jpg';
    const headers = previous.stored.get(url)!.headers;
    previous.stored.set(url, new Response('corrupt body', { headers }));
    previous.stored.delete(harness.base + '/images/1.jpg');
    previous.stored.set(harness.base + '/images/1.jpg?q=other', new Response('asset', { headers }));
    previous.stored.set(harness.base + '/images/2.jpg', new Response('asset', { status: 206, headers }));
    await next.event('install');
    expect(harness.network.mock.calls.map(([path]) => path).sort(comparePaths)).toEqual([
      harness.base + '/guide-precache.json', url, harness.base + '/images/1.jpg', harness.base + '/images/2.jpg',
    ].sort(comparePaths));
    expect((await marker(next, harness.base)).downloaded).toBe(3);
  });

  it('retains reused files and counters after interruption and restarts only missing downloads', async () => {
    const { harness, next } = await setup();
    harness.assets.push('/images/new.jpg');
    const broken = harness.base + '/images/new.jpg';
    harness.failed.add(broken);
    await expect(next.event('install')).rejects.toThrow('Asset fetch failed');
    expect(next.stored.has(harness.base + '/offline-ready')).toBe(false);
    expect(next.self.skipWaiting).not.toHaveBeenCalled();
    expect(harness.stores.has(oldName)).toBe(true);
    const fresh = harness.start(nextName);
    const reply = vi.fn();
    await fresh.event('message', { data: { type: 'OFFLINE_STATUS' }, source: { postMessage: reply } });
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({ ready: false, phase: 'failed', reused: expect.any(Number), downloaded: 0 }));
    expect(reply.mock.calls[0][0].reused).toBe(reply.mock.calls[0][0].total - 1);
    harness.network.mockClear();
    harness.failed.clear();
    await fresh.event('install');
    expect(harness.network.mock.calls.map(([url]) => url)).toEqual([broken]);
    const ready = await marker(fresh, harness.base);
    expect(ready.reused).toBe(ready.total - 1);
    expect(ready.downloaded).toBe(1);
  });

  it('keeps the old package after a copy quota failure and can retry without fetching unchanged files', async () => {
    const { harness, next } = await setup();
    harness.quota.add(harness.base + '/');
    await expect(next.event('install')).rejects.toThrow('Quota exceeded');
    expect(harness.stores.has(oldName)).toBe(true);
    expect(next.self.skipWaiting).not.toHaveBeenCalled();
    harness.quota.clear();
    harness.network.mockClear();
    await next.event('install');
    expect(harness.network).not.toHaveBeenCalled();
    const ready = await marker(next, harness.base);
    expect(ready.reused).toBe(ready.total);
    expect(ready.downloaded).toBe(0);
  });

  it.each(['foreign-scope', 'mismatched-revision', 'invalid-manifest', 'unrelated-cache'])(
    'ignores %s cache sources', async variant => {
      const { harness, previous, next } = await setup();
      const manifestUrl = harness.base + '/guide-precache.json';
      const manifest = previous.stored.get(manifestUrl)!;
      if (variant === 'foreign-scope') {
        previous.stored.delete(manifestUrl);
        previous.stored.set('/other-guide/guide-precache.json', manifest);
      } else if (variant === 'mismatched-revision') {
        previous.stored.set(manifestUrl, Response.json({ ...await manifest.clone().json() as Record<string, unknown>, revision: '3'.repeat(20) }));
      } else if (variant === 'invalid-manifest') previous.stored.set(manifestUrl, new Response('not JSON'));
      else {
        harness.stores.delete(oldName);
        harness.stores.set('another-app-v1', previous.stored);
      }
      await next.event('install');
      const ready = await marker(next, harness.base);
      expect(ready.reused).toBe(0);
      expect(ready.downloaded).toBe(ready.total);
      expect(harness.network).toHaveBeenCalledTimes(ready.total + 1);
    },
  );
});
