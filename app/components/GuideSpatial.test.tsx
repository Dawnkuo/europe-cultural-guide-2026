import { cleanup, configure, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideSpatial } from './GuideSpatial';
import * as architecturalLoader from '../lib/architectural-plan-loader';
import pantheonPlan from '../data/architectural-plans/pantheon.json';
import { resolveArchitecturalEntry } from '../lib/architectural-entry';

beforeEach(() => {
  configure({ asyncUtilTimeout: 3000 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
  Object.defineProperty(HTMLElement.prototype, 'scrollBy', { configurable: true, value: vi.fn() });
});
afterEach(() => {
  cleanup();
  configure({ asyncUtilTimeout: 1000 });
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollBy');
});

vi.mock('./ArchitecturalScene', () => ({ default: ({ onFailure }: { onFailure: () => void }) =>
  <button type="button" onClick={onFailure}>模拟 WebGL 不可用</button>,
}));

describe('GuideSpatial', () => {
  it.each(guideCatalog.filter((guide) => architecturalLoader.hasArchitecturalPlan(guide.slug)).map((guide) => guide.slug))('keeps %s on its reviewed entrance floor in 2D', async (slug) => {
    const guide = guideCatalog.find((item) => item.slug === slug)!;
    const plan = await architecturalLoader.loadArchitecturalPlan(slug);
    const entry = resolveArchitecturalEntry(plan);
    const { container } = render(<GuideSpatial guide={guide} />);
    expect(await screen.findByRole('button', { name: '2D 俯视' })).toHaveAttribute('aria-pressed', 'true');
    const buttons = [...container.querySelectorAll('.architectural-map__floors button')];
    expect(buttons.find((button) => button.textContent === entry.floor.label)).toHaveAttribute('aria-pressed', 'true');
    expect(buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expect(container.querySelector('.architectural-map__viewport svg')).toHaveAttribute('aria-label', `${entry.floor.label}俯视图`);
    expect(screen.queryByRole('button', { name: '模拟 WebGL 不可用' })).not.toBeInTheDocument();
  }, 15000);
  it('shows Uffizi guide step 2 separately from the source room A9 and focuses the same room', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    render(<GuideSpatial guide={guide} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: guide.spatial.stops[1] }));
    const room = screen.getByRole('button', { name: 'A9 A9' });
    expect(room.querySelector('[data-place-label]')).toHaveTextContent(/^A9$/);
    expect(room.querySelector('[data-guide-numbers]')).toHaveTextContent(/^2$/);
    expect(room).toHaveAccessibleDescription('导览步骤 2');
    expect(screen.getByRole('button', { name: guide.spatial.stops[1] })).toHaveAttribute('aria-current', 'step');
    await user.click(screen.getByRole('button', { name: '3D' }));
    await user.click(screen.getByRole('button', { name: '2D 俯视' }));
    expect(screen.getByRole('button', { name: 'A9 A9' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('makes all five unlocated Florence dome steps explicit without inventing ground-floor pins', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'florence-duomo')!;
    render(<GuideSpatial guide={guide} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    expect(screen.getByText('已定位 0/5 个步骤')).toBeInTheDocument();
    const stops = [...document.querySelectorAll('.architectural-map__stops li')];
    expect(stops).toHaveLength(5);
    for (const [index, stop] of stops.entries()) {
      expect(stop).toHaveAttribute('data-location-state', 'unlocated');
      expect(stop.querySelector('.architectural-map__stop-number')).toHaveTextContent(String(index + 1));
      expect(stop).toHaveTextContent('未定位');
      expect(stop.querySelector('button')).toBeNull();
    }
    expect(stops[3]).toHaveTextContent('穹顶内缘步道，位于上层');
    expect(stops[4]).toHaveTextContent('顶部露台，位于上层');
    expect(document.querySelectorAll('.architectural-map__2d-labels [data-guide-numbers]')).toHaveLength(0);
  });
  it('keeps technical extraction records out of visitor notes without hiding missing areas', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'vatican-museums')!} />);
    await screen.findByRole('button', { name: '2D 俯视' });
    const notes = document.querySelector('.architectural-map__notes')!;
    expect(notes).not.toHaveAttribute('open');
    await user.click(screen.getByText('平面范围与说明'));
    expect(notes).toHaveAttribute('open');
    expect(notes).toHaveTextContent('地图不代表实时门禁、开放情况或无障碍路线');
    expect(notes).not.toHaveTextContent(/像素|掩膜|膨胀|几何提取/);
  });

  it('renders service icons with complete names and keeps gallery numbers as visible text', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'vatican-museums')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '入口区与一层' }));
    const plan = (await import('../data/architectural-plans/vatican-museums.json')).default;
    for (const place of plan.places.filter((p) => p.floorId === 'first')) {
      const button = document.querySelector(`[data-place-id="${place.id}"] button`)!;
      expect(button).toHaveAccessibleName(`${place.label} ${place.name}`);
      expect(button).toHaveAttribute('title', place.name);
      if (place.kind === 'room') {
        expect(button.querySelector('[data-place-label]')).not.toHaveClass('sr-only');
        expect(button).toHaveTextContent(place.label);
      }
    }
    expect(document.querySelectorAll('button[data-place-kind="service"] svg').length).toBeGreaterThan(30);
  });

  it('loads the Medici crypt including the source stair details', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'medici-chapels')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '地下层 · 梅第奇墓穴' }));
    expect(document.querySelectorAll('svg [data-feature-id]').length).toBeGreaterThan(100);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

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
    expect(screen.queryAllByRole('button', { name: /聚焦/ })).toHaveLength(0);
    expect(document.querySelectorAll('.guide-spatial-3d__unlocated-stop')).toHaveLength(guide.spatial.stops.length);
    expect(screen.queryByText('起点')).not.toBeInTheDocument();
    expect(screen.queryByText('终点')).not.toBeInTheDocument();
  });

  it('loads the reviewed source plan and preserves every printed Uffizi label in 2D', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'uffizi')!;
    const { container } = render(<GuideSpatial guide={guide} />);
    expect(screen.getByRole('heading', { name: '室内导览地图' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '一层 · B / C / D / E' }));
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
    await user.click(await screen.findByRole('button', { name: '一层 · B / C / D / E' }));
    await user.click(screen.getByRole('button', { name: '3D' }));
    await user.click(await screen.findByRole('button', { name: '模拟 WebGL 不可用' }));
    expect(screen.getByRole('button', { name: '3D' })).toBeDisabled();
    expect(document.querySelectorAll('[data-room-id]')).toHaveLength(52);
  });

  it('makes every St Peter bound stop focusable without source-workflow labels', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find((item) => item.slug === 'st-peters-basilica')!;
    render(<GuideSpatial guide={guide} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    const plan = (await import('../data/architectural-plans/st-peters-basilica.json')).default;
    for (const binding of plan.stopBindings) {
      const place = plan.places.find((item) => item.id === binding.placeId)!;
      const count = plan.stopBindings.filter((item) => item.stopIndex === binding.stopIndex).length;
      await user.click(screen.getByRole('button', { name: count === 1 ? guide.spatial.stops[binding.stopIndex] : `定位：${place.name}` }));
      expect(screen.getByRole('combobox', { name: '定位地点' })).toHaveValue(place.id);
    }
    expect(document.querySelector('.architectural-map')).not.toHaveTextContent('来源平面编号');
  });

  it('preserves source holes without duplicate feature keys', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'borghese')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '访客服务层' }));
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
    const unavailable = vi.spyOn(architecturalLoader, 'hasArchitecturalPlan').mockReturnValue(false);
    try {
      render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === slug)!} />);
      expect(screen.getAllByRole('status').some(element => element.textContent?.includes('室内地图待重建'))).toBe(true);
      expect(screen.queryByRole('button', { name: '内部' })).not.toBeInTheDocument();
      expect(document.querySelector('.guide-floorplan')).not.toBeInTheDocument();
    } finally {
      unavailable.mockRestore();
    }
  });

  it('loads the rebuilt Pantheon with all eighteen printed identifiers', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'pantheon')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    expect([...document.querySelectorAll('.architectural-map__2d-labels [data-place-id]')].map((node) => node.getAttribute('data-place-id')!).sort((a, b) => a.localeCompare(b)))
      .toEqual(Array.from({ length: 18 }, (_, index) => `L0-${index + 1}-1`).sort((a, b) => a.localeCompare(b)));
    expect(document.querySelector('foreignObject')).toBeNull();
    for (const button of document.querySelectorAll('.architectural-map__2d-labels button')) {
      expect(button.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
      expect(button).toHaveStyle({ fontSize: '13px' });
    }
    const detailIds = new Set(pantheonPlan.floors[0].features.filter((feature) => feature.kind === 'detail').map((feature) => feature.id));
    const fineLines = [...document.querySelectorAll('[data-feature-id] path')]
      .filter((path) => detailIds.has(path.parentElement!.getAttribute('data-feature-id')!));
    expect(fineLines.length).toBeGreaterThan(0);
    expect(fineLines.every((line) => line.getAttribute('stroke-width') === '0.35' && line.getAttribute('vector-effect') === 'non-scaling-stroke')).toBe(true);
    expect(document.querySelector('.guide-floorplan')).not.toBeInTheDocument();
  });

  it('follows verified stairs to their actual target floor in both directions', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'uffizi')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '一层 · B / C / D / E' }));
    await user.click(screen.getByRole('button', { name: '兰齐楼梯 → 二层 · A' }));
    expect(screen.getByRole('button', { name: '二层 · A' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '兰齐楼梯 → 一层 · B / C / D / E' }));
    expect(screen.getByRole('button', { name: '一层 · B / C / D / E' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses actual service names without relabeling them as exhibition rooms', async () => {
    const user = userEvent.setup();
    const { container } = render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'last-supper')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    await user.selectOptions(screen.getByRole('combobox', { name: '定位地点' }), 'L0-卫生间-1');
    expect(container.querySelector('.architectural-map__inspector strong')).toHaveTextContent('卫生间');
    expect(screen.queryByText('卫生间 · 展厅')).not.toBeInTheDocument();
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
    const unavailable = vi.spyOn(architecturalLoader, 'hasArchitecturalPlan').mockReturnValue(false);
    try {
      render(<GuideSpatial guide={guide} />);
      expect(screen.getAllByRole('status').some(element => element.textContent?.includes('内部平面资料待补'))).toBe(true);
      expect(screen.queryByRole('button', { name: '内部' })).not.toBeInTheDocument();
      expect(
        await screen.findByRole('region', { name: /凤凰歌剧院.*三维空间示意/ }),
      ).toBeInTheDocument();
    } finally {
      unavailable.mockRestore();
    }
  });

  it('loads the rebuilt Fenice plan without restoring its former generic interior', async () => {
    const user = userEvent.setup();
    render(<GuideSpatial guide={guideCatalog.find((item) => item.slug === 'fenice')!} />);
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }));
    expect(screen.getByRole('button', { name: '一层 · 阿波罗厅群' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '门厅层' }));
    expect(document.querySelectorAll('svg [data-feature-id]').length).toBeGreaterThan(100);
    expect(document.querySelector('.guide-floorplan')).not.toBeInTheDocument();
  });
});
