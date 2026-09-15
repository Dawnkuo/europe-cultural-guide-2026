import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { vaticanCampusRegions } from '../data/vatican-campus';
import { loadArchitecturalPlan } from '../lib/architectural-plan-loader';
import { VaticanCampusMap } from './VaticanCampusMap';
import { GuideExperience } from './GuideExperience';
import { GuideSpatial } from './GuideSpatial';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLElement.prototype.scrollBy = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('Vatican campus orientation', () => {
  it('binds every indoor action to an existing reviewed place without adding routes', async () => {
    const plan = await loadArchitecturalPlan('vatican-museums');
    expect(new Set(vaticanCampusRegions.map(r => r.id)).size).toBe(14);
    for (const region of vaticanCampusRegions) {
      expect(region.at[0]).toBeGreaterThan(385);
      expect(region.at[0]).toBeLessThan(1815);
      expect(region.at[1]).toBeGreaterThan(1270);
      expect(region.at[1]).toBeLessThan(2510);
      for (const id of region.places) expect(plan.places.some(p => p.id === id)).toBe(true);
      expect(region).not.toHaveProperty('route');
    }
  });
  it.each([
    ['vatican-museums', 'entrance'], ['st-peters-basilica', 'basilica'], ['st-peters-square', 'square'],
  ])('opens %s at its appropriate area', (slug, id) => {
    render(<VaticanCampusMap guide={guideCatalog.find(g => g.slug === slug)!} />);
    expect(document.querySelector('[data-campus-region]')).toHaveAttribute('data-campus-region', id);
    expect(within(screen.getByLabelText('馆区列表')).getAllByRole('button')).toHaveLength(14);
    expect(screen.getByLabelText('馆区缩放比例')).toHaveTextContent('100%');
  });
  it('selects every region and retains its description, with no unlocated room actions', async () => {
    const user = userEvent.setup();
    const onLocate = vi.fn();
    const plan = await loadArchitecturalPlan('vatican-museums');
    render(<VaticanCampusMap guide={guideCatalog.find(g => g.slug === 'vatican-museums')!} plan={plan} onLocate={onLocate} />);
    for (const region of vaticanCampusRegions) {
      await user.click(within(screen.getByLabelText('馆区列表')).getByRole('button', { name: region.name }));
      expect(document.querySelector('[data-campus-region]')).toHaveAttribute('data-campus-region', region.id);
      expect(screen.getByText(region.description)).toBeVisible();
      const detail = document.querySelector('.vatican-campus__detail') as HTMLElement;
      expect(within(detail).queryAllByRole('button')).toHaveLength(region.places.length);
      for (const placeId of region.places) {
        const place = plan.places.find(p => p.id === placeId)!;
        await user.click(within(detail).getByRole('button', { name: place.name }));
        expect(onLocate).toHaveBeenLastCalledWith(placeId);
      }
    }
  });
  it('keeps the region list useful after an asset error and offers a real retry', async () => {
    const user = userEvent.setup();
    render(<VaticanCampusMap guide={guideCatalog.find(g => g.slug === 'vatican-museums')!} />);
    const image = screen.getByAltText('梵蒂冈博物馆、教宗宫、圣彼得大教堂与广场的建筑关系');
    fireEvent.error(image);
    expect(screen.getByRole('alert')).toHaveTextContent('区域列表仍可使用');
    await user.click(screen.getByRole('button', { name: '松果庭院' }));
    expect(screen.getByRole('heading', { name: '松果庭院' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: '重新加载地图' }));
    const retried = screen.getByAltText(image.getAttribute('alt')!);
    expect(retried).not.toBe(image);
    fireEvent.load(retried);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.querySelector('[data-campus-region]')).toHaveAttribute('data-campus-region', 'pigna');
  });
  it('returns to the correct interior floor instead of losing the chosen gallery', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog.find(g => g.slug === 'vatican-museums')!;
    render(<GuideExperience guide={guide}><GuideSpatial guide={guide} /></GuideExperience>);
    // This integration test loads and validates the real, large floor-plan chunk.
    expect(await screen.findByRole('button', { name: '2D 俯视' }, { timeout: 10000 })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: '馆区总览' }));
    await user.click(await screen.findByRole('button', { name: '西侧长廊' }, { timeout: 10000 }));
    await user.click(screen.getByRole('button', { name: '地图廊' }));
    expect(screen.getByRole('button', { name: '内部' })).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '二层' })).toHaveAttribute('aria-pressed', 'true');
      expect(document.querySelector('[data-place-id="second-8-1"] button')).toHaveAttribute('aria-pressed', 'true');
    });
  }, 15000);
});
