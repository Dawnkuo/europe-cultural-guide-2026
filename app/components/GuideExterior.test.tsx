import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuideExterior } from './GuideExterior';

vi.mock('./GuideExteriorScene', () => ({ GuideExteriorScene: ({ guide }: { guide: { slug: string } }) => <div data-testid="local-exterior">{guide.slug}</div> }));
afterEach(cleanup);

describe('production exterior renderer', () => {
  it.each(guideCatalog)('keeps $slug on its local, OSM-capable renderer', guide => {
    const { container } = render(<GuideExterior guide={guide} />);
    expect(screen.getByTestId('local-exterior')).toHaveTextContent(guide.slug);
    expect(container.querySelector('iframe')).toBeNull();
  });
});
