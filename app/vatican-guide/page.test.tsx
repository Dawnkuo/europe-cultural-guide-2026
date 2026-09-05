import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import VaticanGuidePage from './page';

describe('VaticanGuidePage', () => {
  it('keeps the legacy URL on the native chapter without a fabricated interior', async () => {
    render(await VaticanGuidePage());

    expect(
      screen.getByRole('heading', { name: '梵蒂冈博物馆' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/室内地图待重建/),
    ).toBeInTheDocument();
    expect(screen.queryByTitle(/完整离线导览/)).not.toBeInTheDocument();
  });
});
