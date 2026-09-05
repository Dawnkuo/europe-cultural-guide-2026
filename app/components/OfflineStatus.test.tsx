import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineStatus } from './OfflineStatus';

describe('OfflineStatus', () => {
  let workers: EventTarget & { register: ReturnType<typeof vi.fn>; ready: Promise<unknown> };
  beforeEach(() => {
    const registration = Object.assign(new EventTarget(), { active: { postMessage: vi.fn() } });
    workers = Object.assign(new EventTarget(), {
      register: vi.fn().mockResolvedValue(registration),
      ready: Promise.resolve(registration),
    });
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: workers });
  });
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('does not claim offline readiness before the worker confirms its complete cache', () => {
    let online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    render(<OfflineStatus />);
    expect(screen.queryByText('已缓存')).not.toBeInTheDocument();
    online = false;
    void act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByText('离线缓存未确认')).toBeInTheDocument();
    void act(() => workers.dispatchEvent(new MessageEvent('message', { data: { type: 'OFFLINE_STATUS', ready: true } })));
    expect(screen.getByText('离线可读')).toBeInTheDocument();
  });

  it('registers the service worker inside the GitHub Pages base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<OfflineStatus />);
    await waitFor(() => expect(workers.register).toHaveBeenCalledWith('/europe-cultural-guide-2026/sw.js'));
  });

  it('reports a failed installation rather than a cached badge', async () => {
    workers.register.mockRejectedValue(new Error('Quota exceeded'));
    render(<OfflineStatus />);
    expect(await screen.findByText('离线缓存未完成')).toBeInTheDocument();
  });

  it('does not install production caches in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<OfflineStatus />);
    expect(screen.getByText('本地预览')).toBeInTheDocument();
    expect(workers.register).not.toHaveBeenCalled();
  });
});
