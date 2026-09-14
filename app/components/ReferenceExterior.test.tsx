import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exteriorReferences } from '../data/exterior-references';
import { loadSketchfabViewer, type SketchfabApi, type SketchfabConstructor } from '../lib/sketchfab-viewer';
import { ExteriorModelPreview } from './ExteriorModelPreview';
import { ReferenceExterior } from './ReferenceExterior';

vi.mock('../lib/sketchfab-viewer', () => ({ loadSketchfabViewer: vi.fn() }));
const events = new Map<string, () => void>();
const camera = { position: [2, 3, 4], target: [0, 0, 0] };
const api = {
  start: vi.fn(), stop: vi.fn(),
  addEventListener: (event, callback) => { events.set(event, callback); },
  getCameraLookAt: callback => callback(null, camera),
  setCameraLookAt: vi.fn(),
} satisfies SketchfabApi;
const init = vi.fn((_id: string, options: { success(api: SketchfabApi): void }) => options.success(api));
class Viewer { init = init; }

beforeEach(() => {
  vi.clearAllMocks(); events.clear();
  window.history.replaceState(null, '', '/models/');
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  vi.mocked(loadSketchfabViewer).mockResolvedValue(Viewer as SketchfabConstructor);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('isolated online model trial', () => {
  it('uses the preserved model offline and resumes the remote viewer when online', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { container } = render(<ReferenceExterior model={exteriorReferences[3]} usage="guide" fallback={<div>Original exterior</div>} />);
    expect(screen.getByText('Original exterior')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
    expect(loadSketchfabViewer).not.toHaveBeenCalled();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    fireEvent(window, new Event('online'));
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    expect(screen.queryByText('Original exterior')).not.toBeInTheDocument();
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
  });

  it('falls back on a failed online load and supports retry without a model switcher', async () => {
    vi.mocked(loadSketchfabViewer).mockRejectedValueOnce(new Error('Blocked'));
    const { container } = render(<ReferenceExterior model={exteriorReferences[3]} usage="guide" fallback={<div>Original exterior</div>} />);
    expect(await screen.findByText('Original exterior')).toBeInTheDocument();
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '重试在线模型' }));
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    act(() => events.get('viewerready')?.());
    expect(screen.queryByText('Original exterior')).not.toBeInTheDocument();
    expect(screen.queryByText('原有本地模型未替换。')).not.toBeInTheDocument();
  });

  it('stops a stalled online viewer before mounting the guide fallback', async () => {
    vi.useFakeTimers();
    const { container } = render(<ReferenceExterior model={exteriorReferences[3]} usage="guide" fallback={<div>Original exterior</div>} />);
    await act(async () => { await Promise.resolve(); });
    const staleReady = events.get('viewerready');
    act(() => { vi.advanceTimersByTime(60000); });
    expect(api.stop).toHaveBeenCalledOnce();
    expect(container.querySelector('iframe')).toBeNull();
    act(() => staleReady?.());
    expect(screen.getByText('Original exterior')).toBeInTheDocument();
  });

  it('waits for viewerready, resets the recorded camera and stops on removal', async () => {
    const { unmount } = render(<ReferenceExterior model={exteriorReferences[0]} />);
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    expect(screen.getByText('正在加载在线模型')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '重置模型视角' })).not.toBeInTheDocument();
    act(() => events.get('viewerready')?.());
    fireEvent.click(screen.getByRole('button', { name: '重置模型视角' }));
    expect(api.setCameraLookAt).toHaveBeenCalledWith(camera.position, camera.target, 0);
    expect(screen.getByTitle('巴黎圣母院 · Sketchfab 3D')).toHaveAttribute('data-camera', JSON.stringify(camera));
    unmount(); expect(api.stop).toHaveBeenCalledOnce();
  });

  it('allows retry after SDK failure', async () => {
    vi.mocked(loadSketchfabViewer).mockRejectedValueOnce(new Error('Network'));
    render(<ReferenceExterior model={exteriorReferences[1]} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('在线模型暂时无法加载');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    act(() => events.get('viewerready')?.());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('removes the remote iframe while offline and reconnects without claiming a cache', async () => {
    const { container } = render(<ReferenceExterior model={exteriorReferences[1]} />);
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    fireEvent(window, new Event('offline'));
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByText('当前离线，在线模型不可用。')).toBeInTheDocument();
    expect(api.stop).toHaveBeenCalledOnce();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    fireEvent(window, new Event('online'));
    await waitFor(() => expect(api.start).toHaveBeenCalledTimes(2));
  });

  it('times out a stalled viewer and ignores late callbacks after removal', async () => {
    vi.useFakeTimers();
    const { unmount } = render(<ReferenceExterior model={exteriorReferences[0]} />);
    await act(async () => { await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    unmount();
    act(() => events.get('viewerready')?.());
    expect(api.stop).toHaveBeenCalledOnce();
  });

  it('offers eight candidates, keeps one viewer and keeps Louvre out of the itinerary', async () => {
    const { container } = render(<ExteriorModelPreview />);
    const select = screen.getByRole('combobox', { name: '景点' });
    expect(select).toBeEnabled();
    expect(screen.getAllByRole('option')).toHaveLength(8);
    await waitFor(() => expect(init).toHaveBeenCalled());
    fireEvent.change(select, { target: { value: '0' } });
    expect(window.location.hash).toBe('#notre-dame');
    await waitFor(() => expect(init).toHaveBeenLastCalledWith(exteriorReferences[0].modelId, expect.anything()));
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    fireEvent.change(select, { target: { value: '6' } });
    expect(screen.queryByRole('link', { name: '景点导览' })).not.toBeInTheDocument();
    expect(screen.getByText('苏利馆钟楼局部 · 非整个卢浮宫')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /本地模型/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Open Heritage 3D' })).toBeInTheDocument();
  });
});
