import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteNav } from './SiteNav';

describe('SiteNav', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps the same five links and order when the current page changes', () => {
    const { rerender } = render(<SiteNav />);
    const expected = [
      ['逐日行程', '/itinerary/'],
      ['城市文化', '/cities/'],
      ['景点导览', '/guides/'],
      ['凭证状态', '/bookings/'],
      ['机位', '/photo-spots/'],
    ];
    for (const active of [undefined, 'itinerary', 'cities', 'guides', 'bookings', 'photo-spots'] as const) {
      rerender(<SiteNav active={active} />);
      const links = within(screen.getByRole('navigation', { name: '主导航' })).getAllByRole('link');
      expect(links.map(link => [link.textContent, link.getAttribute('href')])).toEqual(expected);
      expect(links.filter(link => link.getAttribute('aria-current') === 'page').map(link => link.getAttribute('href')))
        .toEqual(active ? [`/${active}/`] : []);
      expect(screen.getByRole('link', { name: /欧洲纪行 2026/ })).toHaveAttribute('href', '/');
    }
  });

  it('keeps every internal destination under the configured base path', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<SiteNav active="cities" />);

    expect(screen.getByRole('link', { name: /欧洲纪行 2026/ })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/',
    );
    expect(screen.getByRole('link', { name: '城市文化' })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/cities/',
    );
    expect(screen.getByRole('link', { name: '景点导览' })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/guides/',
    );
  });
});
