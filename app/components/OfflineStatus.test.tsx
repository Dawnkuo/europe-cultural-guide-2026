import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineStatus } from './OfflineStatus';
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');

describe('OfflineStatus', () => {
  let workers: EventTarget & { register: ReturnType<typeof vi.fn>; ready: Promise<unknown> };
  beforeEach(() => {
    const registration = Object.assign(new EventTarget(), { active: { postMessage: vi.fn() }, update: vi.fn().mockResolvedValue(undefined) });
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
    if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', originalShowModal);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  });

  it('does not claim offline readiness before the worker confirms its complete cache', () => {
    let online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    render(<OfflineStatus />);
    expect(screen.queryByRole('button', { name: '离线导览：已缓存' })).not.toBeInTheDocument();
    online = false;
    void act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByRole('button', { name: '离线导览：离线缓存未确认' })).toBeInTheDocument();
    void act(() => workers.dispatchEvent(new MessageEvent('message', { data: { type: 'OFFLINE_STATUS', ready: true } })));
    expect(screen.getByRole('button', { name: '离线导览：离线可读' })).toBeInTheDocument();
  });

  it('registers the service worker inside the GitHub Pages base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<OfflineStatus />);
    await waitFor(() => expect(workers.register).toHaveBeenCalledWith('/europe-cultural-guide-2026/sw.js'));
  });

  it('reports a failed installation rather than a cached badge', async () => {
    workers.register.mockRejectedValue(new Error('Quota exceeded'));
    render(<OfflineStatus />);
    expect(await screen.findByRole('button', { name: '离线导览：离线缓存未完成' })).toBeInTheDocument();
  });

  it('does not install production caches in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<OfflineStatus />);
    expect(screen.getByRole('button', { name: '离线导览：本地预览' })).toBeInTheDocument();
    expect(workers.register).not.toHaveBeenCalled();
  });

  it('exposes progress and retries through the active worker without claiming readiness', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
    render(<OfflineStatus />);
    await waitFor(() => expect(workers.register).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /离线导览：/ }));
    const dialog = screen.getByRole('dialog', { name: '离线导览' });
    await act(() => workers.dispatchEvent(new MessageEvent('message', { data: { type: 'OFFLINE_PROGRESS', phase: 'downloading', completed: 16, total: 120, reused: 12, downloaded: 4, version: 'test-version' } })));
    expect(within(dialog).getByRole('progressbar')).toHaveAttribute('value', '16');
    expect(within(dialog).getByText('16 / 120 项资源')).toBeInTheDocument();
    expect(within(dialog).getByText('已复用 12 项 · 已下载 4 项')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '正在下载' })).toBeDisabled();
    await act(() => workers.dispatchEvent(new MessageEvent('message', { data: { type: 'OFFLINE_PROGRESS', phase: 'failed', completed: 16, total: 120 } })));
    fireEvent.click(within(dialog).getByRole('button', { name: '继续下载' }));
    const registration = await workers.ready as { active: { postMessage: ReturnType<typeof vi.fn> } };
    await waitFor(() => expect(registration.active.postMessage).toHaveBeenCalledWith({ type: 'OFFLINE_RETRY' }));
    expect(screen.queryByRole('button', { name: '离线导览：已缓存' })).not.toBeInTheDocument();
  });

  it('automatically resumes an incomplete download when connectivity returns', async () => {
    let online = false;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    render(<OfflineStatus />);
    await waitFor(() => expect(workers.register).toHaveBeenCalledTimes(1));
    await act(() => workers.dispatchEvent(new MessageEvent('message', { data: { type: 'OFFLINE_STATUS', phase: 'failed', completed: 37, total: 100, ready: false } })));
    online = true;
    await act(() => window.dispatchEvent(new Event('online')));
    await waitFor(() => expect(workers.register).toHaveBeenCalledTimes(2));
    const registration = await workers.ready as { active: { postMessage: ReturnType<typeof vi.fn> }; update: ReturnType<typeof vi.fn> };
    await waitFor(() => expect(registration.active.postMessage).toHaveBeenCalledWith({ type: 'OFFLINE_RETRY' }));
    expect(registration.update).toHaveBeenCalledOnce();
  });

  it('does not send a retry to an obsolete worker when updating fails', async () => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); } });
    const registration = await workers.ready as { active: { postMessage: ReturnType<typeof vi.fn> }; update: ReturnType<typeof vi.fn> };
    registration.update.mockRejectedValue(new Error('Network unavailable'));
    render(<OfflineStatus />);
    await waitFor(() => expect(workers.register).toHaveBeenCalled());
    await act(() => workers.dispatchEvent(new MessageEvent('message', { data: { type: 'OFFLINE_PROGRESS', phase: 'failed', completed: 37, total: 100 } })));
    fireEvent.click(screen.getByRole('button', { name: /离线导览：/ }));
    fireEvent.click(screen.getByRole('button', { name: '继续下载' }));
    await waitFor(() => expect(registration.update).toHaveBeenCalledOnce());
    expect(registration.active.postMessage).not.toHaveBeenCalledWith({ type: 'OFFLINE_RETRY' });
  });
});
