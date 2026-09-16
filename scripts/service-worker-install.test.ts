import { describe, expect, it, vi } from 'vitest';
import { workerHarness } from '../test/worker-harness';

describe('resumable offline package installation', () => {
  it('bounds concurrency and marks readiness only after every verified asset commits', async () => {
    const harness = workerHarness(1000);
    const worker = harness.start();
    await worker.event('install');
    expect(harness.maxInFlight()).toBeLessThanOrEqual(4);
    expect([...worker.stored.keys()].filter(url => /\/images\/\d+\.jpg$/.test(url))).toHaveLength(1000);
    expect(worker.stored.has(harness.base + '/offline-ready')).toBe(true);
    expect(worker.stored.has(harness.base + '/offline-progress')).toBe(false);
    expect(worker.self.skipWaiting).toHaveBeenCalledOnce();
  });

  it('keeps successful peers, restores progress after a worker restart, and requests only missing files', async () => {
    const harness = workerHarness();
    const broken = harness.base + '/';
    harness.failed.add(broken);
    const first = harness.start();
    await expect(first.event('install')).rejects.toThrow('Asset fetch failed');
    const completed = [...first.stored.keys()].filter(url => first.stored.get(url)?.headers.has('X-Offline-Sha256'));
    expect(completed).toHaveLength(3);
    expect(first.stored.has(harness.base + '/offline-ready')).toBe(false);
    expect(first.self.skipWaiting).not.toHaveBeenCalled();
    const fresh = harness.start();
    const reply = vi.fn();
    await fresh.event('message', { data: { type: 'OFFLINE_STATUS' }, source: { postMessage: reply } });
    expect(reply).toHaveBeenCalledWith(expect.objectContaining({ phase: 'failed', completed: 3, ready: false }));
    harness.failed.clear();
    harness.network.mockClear();
    await fresh.event('install');
    const requested = harness.network.mock.calls.map(([url]) => url);
    for (const url of completed) expect(requested).not.toContain(url);
    expect(requested).not.toContain(harness.base + '/guide-precache.json');
    expect(requested).toContain(broken);
    expect(fresh.stored.has(harness.base + '/offline-ready')).toBe(true);
  });

  it('does not trust a different release or a wrong body at the same URL', async () => {
    const harness = workerHarness();
    const wrongRelease = harness.start('europe-cultural-guide-v9-' + '2'.repeat(20));
    await expect(wrongRelease.event('install')).rejects.toThrow('release changed');
    expect([...wrongRelease.stored.values()].some(response => response.headers.has('X-Offline-Sha256'))).toBe(false);
    const worker = harness.start();
    harness.invalid.add(harness.base + '/');
    await expect(worker.event('install')).rejects.toThrow('checksum mismatch');
    expect(worker.stored.has(harness.base + '/')).toBe(false);
    harness.invalid.clear();
    await worker.event('install');
    expect(worker.stored.has(harness.base + '/offline-ready')).toBe(true);
  });

  it('does not restart verified downloads after storage failure and can repair a missing entry', async () => {
    const harness = workerHarness();
    const worker = harness.start();
    harness.quota.add(harness.base + '/');
    await expect(worker.event('install')).rejects.toThrow('Quota exceeded');
    expect(worker.stored.has(harness.base + '/offline-ready')).toBe(false);
    harness.quota.clear();
    await worker.event('install');
    worker.stored.delete(harness.base + '/images/0.jpg');
    harness.network.mockClear();
    await worker.event('message', { data: { type: 'OFFLINE_RETRY' } });
    expect(harness.network.mock.calls.map(([url]) => url)).toEqual([harness.base + '/images/0.jpg']);
  });

  it('coalesces concurrent retries without fetching a resource twice', async () => {
    const harness = workerHarness();
    const worker = harness.start();
    await Promise.all([worker.event('install'), worker.event('message', { data: { type: 'OFFLINE_RETRY' } })]);
    const requested = harness.network.mock.calls.map(([url]) => url);
    expect(new Set(requested).size).toBe(requested.length);
  });

  it('preserves the verified offline snapshot while serving fresh online content', async () => {
    const harness = workerHarness();
    const worker = harness.start();
    await worker.event('install');
    const url = harness.base + '/';
    harness.invalid.add(url);
    const response = await worker.event('fetch', { request: new Request('https://example.com' + url) }) as Response;
    expect(await response.text()).toContain('wrong release');
    expect(await worker.stored.get(url)!.clone().text()).toBe('asset');
  });
});
