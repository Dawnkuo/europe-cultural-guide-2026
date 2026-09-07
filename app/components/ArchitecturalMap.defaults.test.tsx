import { cleanup, configure, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideSpatial } from './GuideSpatial';
import { hasArchitecturalPlan, loadArchitecturalPlan } from '../lib/architectural-plan-loader';
import { resolveArchitecturalEntry } from '../lib/architectural-entry';

const guides = guideCatalog.filter((guide) => hasArchitecturalPlan(guide.slug));
beforeAll(async () => {
  // Transform large JSON fixtures outside the interaction timeout.
  await import('./ArchitecturalMap');
  for (const guide of guides) await loadArchitecturalPlan(guide.slug);
}, 60000);
beforeEach(() => {
  configure({ asyncUtilTimeout: 5000 });
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
vi.mock('./ArchitecturalScene', () => ({ default: ({ floorId }: { floorId: string }) =>
  <div data-testid="webgl-scene" data-floor-id={floorId} />,
}));

describe('indoor map defaults', () => {
  it.each(guides.map((guide) => guide.slug))('%s starts in 2D on its reviewed entrance/reference floor', async (slug) => {
    const guide = guides.find((item) => item.slug === slug)!;
    const plan = await loadArchitecturalPlan(slug);
    const entry = resolveArchitecturalEntry(plan);
    const { container } = render(<GuideSpatial guide={guide} />);
    expect(await screen.findByRole('button', { name: '2D 俯视' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '3D' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByTestId('webgl-scene')).not.toBeInTheDocument();
    const buttons = [...container.querySelectorAll('.architectural-map__floors button')];
    expect(buttons.map((button) => button.textContent)).toEqual([...plan.floors].sort((a, b) => b.order - a.order).map((floor) => floor.label));
    expect(buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expect(screen.getByRole('button', { name: entry.floor.label })).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('.architectural-map__viewport svg')).toHaveAttribute('aria-label', `${entry.floor.label}俯视图`);
    expect(container.querySelector('.architectural-map')).toHaveAttribute('data-entry-status', entry.status);
    if (entry.notice) expect(container.querySelector('[data-entry-notice]')).toHaveTextContent(entry.notice);
    else expect(container.querySelector('[data-entry-notice]')).not.toBeInTheDocument();
  });

  it.each(['milan-duomo', 'cologne-cathedral', 'casa-batllo', 'uffizi', 'sagrada-familia', 'doges-palace', 'vatican-museums'])('%s preserves manual selection but resets on a fresh visit', async (slug) => {
    const user = userEvent.setup();
    const guide = guides.find((item) => item.slug === slug)!;
    const plan = await loadArchitecturalPlan(slug);
    const entry = resolveArchitecturalEntry(plan);
    const other = plan.floors.find((floor) => floor.id !== entry.floor.id)!;
    const { unmount } = render(<GuideSpatial guide={guide} />);
    await user.click(await screen.findByRole('button', { name: other.label }));
    await user.click(screen.getByRole('button', { name: '3D' }));
    expect(await screen.findByTestId('webgl-scene')).toHaveAttribute('data-floor-id', other.id);
    await user.click(screen.getByRole('button', { name: '2D 俯视' }));
    await user.click(screen.getByRole('button', { name: '重置地图视角' }));
    expect(screen.getByRole('button', { name: other.label })).toHaveAttribute('aria-pressed', 'true');
    unmount();
    render(<GuideSpatial guide={guide} />);
    expect(await screen.findByRole('button', { name: '2D 俯视' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: entry.floor.label })).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses the next venue entrance when navigating between guides', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<GuideSpatial guide={guides.find((guide) => guide.slug === 'casa-batllo')!} />);
    await user.click(await screen.findByRole('button', { name: '屋顶 · 龙脊与天窗' }));
    await user.click(screen.getByRole('button', { name: '3D' }));
    rerender(<GuideSpatial guide={guides.find((guide) => guide.slug === 'doges-palace')!} />);
    expect(await screen.findByRole('button', { name: '底层 · 庭院与建筑博物馆' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '2D 俯视' })).toHaveAttribute('aria-pressed', 'true');
  });
});
