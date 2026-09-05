import { configure, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideSpatial } from './GuideSpatial';

beforeEach(() => {
  configure({ asyncUtilTimeout: 3000 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: vi.fn() });
});
afterEach(() => {
  configure({ asyncUtilTimeout: 1000 });
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
});

vi.mock('./ArchitecturalScene', () => ({ default: ({ onFailure }: { onFailure: () => void }) =>
  <button type="button" onClick={onFailure}>模拟 WebGL 不可用</button>,
}));

describe('GuideSpatial', () => {
  it('renders a real 3D canvas with accessible attraction-specific controls', async () => {
    const guide = guideCatalog.find((item) => item.slug === 'trevi')!;
    render(<GuideSpatial guide={guide} />);

    expect(
      await screen.findByRole('region', { name: '特雷维喷泉三维空间示意' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '3D 导览地图' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('特雷维喷泉三维空间画布')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '重置三维视角' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '暂停自动旋转' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /聚焦/ })).toHaveLength(
      guide.spatial.stops.length,
    );
    expect(screen.getByText('起点')).toBeInTheDocument();
    expect(screen.getByText('终点')).toBeInTheDocument();
  });

  it('loads the reviewed source plan and preserves every printed Uffizi label in 2D', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    const { container } = render(<GuideSpatial guide={guide} />);
    expect(screen.getByRole('heading', { name: '室内导览地图' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    expect(container.querySelectorAll('[data-room-id]')).toHaveLength(52);
    expect(container.querySelectorAll('[data-room-id^="L1-D22-"]')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: '二层 · A' }));
    expect(container.querySelectorAll('[data-room-id]')).toHaveLength(42);
    expect(screen.queryByText(/来源|版权|official/i)).not.toBeInTheDocument();
  });

  it('focuses a verified stop and preserves its selection across 2D/3D and exterior switching', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    render(<GuideSpatial guide={guide} />);

    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: guide.spatial.stops[1] }));
    expect(screen.getByRole('button', { name: 'A9 A9' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '3D' }));
    await user.click(screen.getByRole('button', { name: '2D 俯视' }));
    expect(screen.getByRole('button', { name: 'A9 A9' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '外观' }));
    await user.click(screen.getByRole('button', { name: '内部' }));
    expect(screen.getByRole('button', { name: 'A9 A9' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelectorAll('.guide-floorplan__route')).toHaveLength(0);
  });

  it('keeps the complete interactive plan when WebGL is unavailable', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'uffizi')!} />);
    await user.click(await screen.findByRole('button', { name: '模拟 WebGL 不可用' }));
    expect(screen.getByRole('button', { name: '3D' })).toBeDisabled();
    expect(document.querySelectorAll('[data-room-id]')).toHaveLength(52);
  });

  it('preserves source holes without duplicate feature keys', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'borghese')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    const paths = [...document.querySelectorAll('svg [data-feature-id] path')];
    expect(paths.length).toBeGreaterThan(50);
    expect(paths.some((path) => (path.getAttribute('d')?.match(/M/g)?.length ?? 0) > 1)).toBe(true);
    expect(paths.every((path) => path.getAttribute('fill-rule') === 'evenodd')).toBe(true);

    expect(
      errorSpy.mock.calls.filter((call) =>
        call.some(
          (value) => typeof value === 'string' && value.includes('same key'),
        ),
      ),
    ).toEqual([]);
    errorSpy.mockRestore();
  });

  it.each(['pantheon', 'vatican-museums', 'casa-batllo'])('does not restore rejected generic interiors for %s', async (slug) => {
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === slug)!} />);
    expect(screen.getByRole('status')).toHaveTextContent('室内地图待重建');
    expect(screen.queryByRole('button', { name: '内部' })).not.toBeInTheDocument();
    expect(document.querySelector('.guide-floorplan')).not.toBeInTheDocument();
  });

  it('follows verified stairs to their actual target floor in both directions', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'uffizi')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '兰齐楼梯 → 二层 · A' }));
    expect(screen.getByRole('button', { name: '二层 · A' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '兰齐楼梯 → 一层 · B / C / D / E' }));
    expect(screen.getByRole('button', { name: '一层 · B / C / D / E' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables automatic exterior rotation when reduced motion is requested', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }),
    );
    const guide = guideCatalog.find((item) => item.slug === 'trevi')!;

    render(<GuideSpatial guide={guide} />);

    expect(
      await screen.findByRole('button', { name: '继续自动旋转' }),
    ).toBeInTheDocument();
  });

  it('keeps the exterior model as a separate selectable view', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    render(<GuideSpatial guide={guide} />);

    await user.click(await screen.findByRole('button', { name: '外观' }));

    expect(
      await screen.findByRole('region', { name: /乌菲兹.*三维空间示意/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '内部' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps source-limited interiors on the exterior model with an explicit status', async () => {
    const guide = guideCatalog.find((item) => item.slug === 'fenice')!;

    render(<GuideSpatial guide={guide} />);

    expect(screen.getByRole('status')).toHaveTextContent('内部平面资料待补');
    expect(screen.queryByRole('tab', { name: '内部' })).not.toBeInTheDocument();
    expect(
      await screen.findByRole('region', { name: /凤凰歌剧院.*三维空间示意/ }),
    ).toBeInTheDocument();
  });
});
