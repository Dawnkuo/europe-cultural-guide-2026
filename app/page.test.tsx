import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from './page';
import { sitePageLinks } from './lib/site-navigation';

describe('journey overview', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('introduces the real trip and exposes the map', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 1, name: '欧洲纪行 2026' }),
    ).toBeVisible();
    expect(screen.getByText('2026.09.24 — 10.06')).toBeVisible();
    expect(screen.getByLabelText('欧洲旅程总览地图')).toBeVisible();
  });

  it('does not show the removed departure notices or their navigation link', () => {
    const { container } = render(<Home />);

    expect(container.querySelector('#notices')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '提醒' })).not.toBeInTheDocument();
    expect(screen.queryByText(/出发前，先看清楚这些资料|穹顶14:30，圣殿15:30|比萨往返车票|晚到入住|Vikey|开门指引|退房方式/)).not.toBeInTheDocument();
  });

  it('keeps the city sequence strip consistent with numbered return visits on the map', () => {
    const { container } = render(<Home />);
    expect([...container.querySelectorAll('.journey-strip strong')].map((node) => node.textContent))
      .toEqual(['巴黎', '米兰', '威尼斯', '佛罗伦萨', '比萨', '佛罗伦萨', '罗马', '巴塞罗那', '科隆', '巴黎']);
    expect([...container.querySelectorAll('.journey-strip span')].map((node) => node.textContent))
      .toEqual(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  });

  it('exposes every shared page destination from the home header', () => {
    render(<Home />);
    const header = within(
      screen.getByRole('navigation', { name: '主导航' }).closest('header')!,
    );
    for (const link of sitePageLinks) {
      expect(header.getByRole('link', { name: link.label })).toHaveAttribute(
        'href',
        link.href,
      );
    }
    expect(
      within(screen.getByRole('navigation', { name: '主导航' })).getByRole(
        'link',
        { name: '景点导览' },
      ),
    ).toBeVisible();
  });

  it('prefixes internal links and public images for GitHub Pages', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<Home />);

    expect(screen.getByRole('link', { name: '逐日行程' })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/itinerary/',
    );
    expect(screen.getByRole('link', { name: '景点导览' })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/guides/',
    );
    expect(
      screen.getByRole('img', { name: '从圣彼得广场望向圣彼得大教堂' }),
    ).toHaveAttribute(
      'src',
      '/europe-cultural-guide-2026/images/st-peters-hero.jpg',
    );
  });
});
