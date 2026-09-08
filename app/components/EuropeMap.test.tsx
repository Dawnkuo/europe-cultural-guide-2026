import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EuropeMap } from './EuropeMap';
import { journeyCityOrder } from '../lib/journey-route';

describe('EuropeMap', () => {
  it('renders the local map and all itinerary cities', () => {
    render(<EuropeMap selectedCity="罗马" onSelectCity={() => {}} />);

    expect(screen.getByLabelText('欧洲旅程总览地图')).toBeVisible();
    expect(screen.getAllByRole('button', { name: /查看.*行程/ })).toHaveLength(
      8,
    );
  });

  it('reports city selection', () => {
    const onSelectCity = vi.fn();
    render(<EuropeMap selectedCity="罗马" onSelectCity={onSelectCity} />);

    fireEvent.click(screen.getByRole('button', { name: '查看巴塞罗那行程' }));
    expect(onSelectCity).toHaveBeenCalledWith('巴塞罗那');
  });

  it('numbers return visits without losing cities or either direction of the Pisa trip', () => {
    const { container } = render(<EuropeMap selectedCity="罗马" onSelectCity={() => {}} />);
    expect(screen.getByRole('button', { name: '查看巴黎行程' })).toHaveAttribute('data-journey-steps', '01,10');
    expect(screen.getByRole('button', { name: '查看佛罗伦萨行程' })).toHaveAttribute('data-journey-steps', '04,06');
    expect([...container.querySelectorAll('.europe-map__steps b')].map((node) => node.textContent).sort())
      .toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
    const legs = [...container.querySelectorAll('[data-route-leg]')];
    expect(legs.map((leg) => [leg.getAttribute('data-route-from'), leg.getAttribute('data-route-to')]))
      .toEqual(journeyCityOrder.slice(1).map((to, index) => [journeyCityOrder[index], to]));
    expect(legs.every((leg) => leg.querySelector('[marker-end]'))).toBe(true);
    expect(legs[3].querySelector('path')!.getAttribute('d')).not.toEqual(legs[4].querySelector('path')!.getAttribute('d'));
    expect(container.querySelectorAll('[data-city-leader]')).toHaveLength(8);
  });
});
