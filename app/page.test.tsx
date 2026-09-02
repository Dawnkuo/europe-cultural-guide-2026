import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Home from './page';

describe('journey overview', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('introduces the real trip and exposes the map', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 1, name: '欧洲纪行 2026' }),
    ).toBeVisible();
    expect(screen.getByText('2026.09.24 — 10.06')).toBeVisible();
    expect(screen.getByRole('img', { name: '欧洲旅程总览地图' })).toBeVisible();
  });

  it('shows the known critical notices', () => {
    render(<Home />);

    expect(screen.getByText(/圣殿14:30/)).toBeVisible();
    expect(screen.getByText(/比萨往返车票/)).toBeVisible();
    expect(screen.getByText(/晚到入住/)).toBeVisible();
  });

  it('prefixes internal links and public images for GitHub Pages', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<Home />);

    expect(screen.getByRole('link', { name: '逐日行程' })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/itinerary/',
    );
    expect(
      screen.getByRole('img', { name: '从圣彼得广场望向圣彼得大教堂' }),
    ).toHaveAttribute(
      'src',
      '/europe-cultural-guide-2026/images/st-peters-hero.jpg',
    );
  });
});
