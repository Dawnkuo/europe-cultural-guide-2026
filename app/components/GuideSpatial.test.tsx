import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideSpatial } from './GuideSpatial';

afterEach(() => vi.unstubAllGlobals());

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

  it('defaults documented interiors to a stacked floor plan with an SVG fallback', async () => {
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    const { container } = render(<GuideSpatial guide={guide} />);

    expect(
      screen.getByRole('status', { name: '室内地图加载状态' }),
    ).toHaveTextContent('正在加载室内平面');
    expect(
      screen.getByRole('heading', { name: '分层室内导览地图' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: '内部', selected: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: '外观', selected: false }),
    ).toBeInTheDocument();
    expect(
      await screen.findByLabelText('乌菲兹美术馆分层室内平面图'),
    ).toBeInTheDocument();
    expect(container.querySelector('canvas')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getAllByText('二层：A区与三面长廊').length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText(/来源|版权|official/i)).not.toBeInTheDocument();
  });

  it('supports keyboard route navigation and announces the active room', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    render(<GuideSpatial guide={guide} />);

    const stops = await screen.findAllByRole('button', { name: /聚焦/ });
    stops[0].focus();
    await user.keyboard('{ArrowDown}');

    expect(stops[1]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('status', { name: '当前路线' })).toHaveTextContent(
      `二层：A区与三面长廊，${guide.spatial.stops[1]}`,
    );
    expect(
      document.querySelectorAll('.guide-floorplan__route[data-state="active"]'),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll(
        '.guide-floorplan__route[data-state="complete"]',
      ),
    ).toHaveLength(0);
    expect(
      document.querySelectorAll('.guide-floorplan__space-label'),
    ).toHaveLength(1);
    expect(
      document.querySelector('.guide-floorplan__space-label'),
    ).toHaveTextContent(guide.spatial.stops[1]);
  });

  it('preserves documented courtyards and voids in the shared SVG fallback', async () => {
    const guide = guideCatalog.find((item) => item.slug === 'vatican-museums')!;
    render(<GuideSpatial guide={guide} />);

    const svg = await screen.findByLabelText('梵蒂冈博物馆分层室内平面图');
    const floorPaths = [...svg.querySelectorAll('.guide-floorplan__floor')];

    expect(
      floorPaths.some(
        (path) => (path.getAttribute('d')?.match(/M /g)?.length ?? 0) > 1,
      ),
    ).toBe(true);
    expect(
      floorPaths.every((path) => path.getAttribute('fill-rule') === 'evenodd'),
    ).toBe(true);
  });

  it('renders plans with repeated route spaces without duplicate React keys', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const guide = guideCatalog.find((item) => item.slug === 'vatican-museums')!;

    render(<GuideSpatial guide={guide} />);
    await screen.findByLabelText('梵蒂冈博物馆分层室内平面图');

    expect(
      errorSpy.mock.calls.filter((call) =>
        call.some(
          (value) => typeof value === 'string' && value.includes('same key'),
        ),
      ),
    ).toEqual([]);
    errorSpy.mockRestore();
  });

  it('keeps every projected floor polygon inside the SVG fallback view box', async () => {
    const guide = guideCatalog.find((item) => item.slug === 'pantheon')!;
    render(<GuideSpatial guide={guide} />);

    const svg = await screen.findByLabelText('万神殿分层室内平面图');
    const [viewX, viewY, viewWidth, viewHeight] = svg
      .getAttribute('viewBox')!
      .split(' ')
      .map(Number);
    const projectedPoints = [...svg.querySelectorAll('polygon')].flatMap(
      (polygon) =>
        polygon
          .getAttribute('points')!
          .split(' ')
          .map((point) => point.split(',').map(Number)),
    );

    for (const [x, y] of projectedPoints) {
      expect(x).toBeGreaterThanOrEqual(viewX);
      expect(x).toBeLessThanOrEqual(viewX + viewWidth);
      expect(y).toBeGreaterThanOrEqual(viewY);
      expect(y).toBeLessThanOrEqual(viewY + viewHeight);
    }
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
    const guide = guideCatalog.find((item) => item.slug === 'casa-batllo')!;
    render(<GuideSpatial guide={guide} />);

    await user.click(await screen.findByRole('tab', { name: '外观' }));

    expect(
      screen.getByRole('region', { name: /巴特罗之家.*三维空间示意/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: '内部', selected: false }),
    ).toBeInTheDocument();
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
