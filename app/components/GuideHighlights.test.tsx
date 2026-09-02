import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideHighlights } from './GuideHighlights';

describe('GuideHighlights', () => {
  it('shows real local images without copyright or source links', () => {
    const guide = guideCatalog.find(
      (item) => item.slug === 'picasso-barcelona',
    )!;

    render(<GuideHighlights guide={guide} />);

    expect(screen.getByAltText(/初领圣体/)).toHaveAttribute(
      'src',
      expect.stringContaining('/images/guides/picasso-barcelona-01.jpg'),
    );
    expect(screen.getByAltText(/科学与慈善/)).toHaveAttribute(
      'src',
      expect.stringContaining('/images/guides/picasso-barcelona-02.jpg'),
    );
    expect(screen.getByAltText(/宫娥/)).toHaveAttribute(
      'src',
      expect.stringContaining('/images/guides/picasso-barcelona-03.jpg'),
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByText(/Wikimedia Commons/)).not.toBeInTheDocument();
  });

  it('uses the named Museum Ludwig works instead of gallery substitutes', () => {
    const guide = guideCatalog.find((item) => item.slug === 'museum-ludwig')!;

    render(<GuideHighlights guide={guide} />);

    expect(screen.getByAltText(/M-Maybe/)).toHaveAttribute(
      'src',
      expect.stringContaining('/images/guides/museum-ludwig-01.jpg'),
    );
    expect(screen.getByAltText(/双手交叠的丑角/)).toHaveAttribute(
      'src',
      expect.stringContaining('/images/guides/museum-ludwig-02.jpg'),
    );
  });
});
