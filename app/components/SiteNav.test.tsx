import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteNav } from './SiteNav';

describe('SiteNav', () => {
  afterEach(() => vi.unstubAllEnvs());

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
  });
});
