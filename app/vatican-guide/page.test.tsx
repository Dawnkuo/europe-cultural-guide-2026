import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import VaticanGuidePage from './page';
import plan from '../data/architectural-plans/vatican-museums.json';

vi.mock('../components/ArchitecturalScene', () => ({ default: () => null }));
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => vi.unstubAllGlobals());

describe('VaticanGuidePage', () => {
  it('keeps the legacy URL on the native chapter with the rebuilt source plan', async () => {
    const user = userEvent.setup();
    render(await VaticanGuidePage());

    expect(
      screen.getByRole('heading', { name: '梵蒂冈博物馆' }),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: '2D 俯视' }, { timeout: 5000 }));
    const floor = plan.floors.find((item) => item.id === 'first')!;
    expect(screen.getByRole('button', { name: floor.label })).toHaveAttribute('aria-pressed', 'true');
    const renderedIds = (attribute: string) => [...document.querySelectorAll(`.architectural-map [${attribute}]`)]
      .map((node) => node.getAttribute(attribute)!).sort((a, b) => a.localeCompare(b));
    expect(renderedIds('data-feature-id')).toEqual(floor.features.map((feature) => feature.id).sort((a, b) => a.localeCompare(b)));
    expect(renderedIds('data-place-id')).toEqual(plan.places
      .filter((place) => place.floorId === floor.id).map((place) => place.id).sort((a, b) => a.localeCompare(b)));
    expect(screen.queryByText(/室内地图待重建/)).not.toBeInTheDocument();
    expect(document.querySelector('.guide-floorplan')).not.toBeInTheDocument();
    expect(screen.queryByTitle(/完整离线导览/)).not.toBeInTheDocument();
  });
});
