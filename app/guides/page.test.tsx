import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import GuidesPage from './page';
import { guideCatalog } from '../data/guides';

describe('GuidesPage', () => {
  it('lists the complete attraction guide catalog', () => {
    render(<GuidesPage />);

    expect(
      screen.getByRole('heading', { name: '景点导览' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /梵蒂冈博物馆/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /米兰大教堂与露台/ }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('.guide-index__row')).toHaveLength(guideCatalog.length);
  });

  it('filters guides by city', async () => {
    const user = userEvent.setup();
    render(<GuidesPage />);

    await user.click(screen.getByRole('button', { name: '罗马' }));
    expect(screen.getByRole('button', { name: '罗马' })).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByRole('link', { name: /万神殿/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /米兰大教堂与露台/ }),
    ).not.toBeInTheDocument();
  });

  it('combines city and type filters and can restore the complete list', async () => {
    const user = userEvent.setup();
    render(<GuidesPage />);
    await user.click(screen.getByRole('button', { name: '巴塞罗那' }));
    await user.click(screen.getByRole('button', { name: '博物馆与收藏' }));
    const expected = guideCatalog.filter((g) => g.city === '巴塞罗那' && g.kind === 'museum');
    expect(document.querySelectorAll('.guide-index__row')).toHaveLength(expected.length);
    for (const guide of expected) expect(document.querySelector(`.guide-index__row[href="/guides/${guide.slug}/"]`)).not.toBeNull();
    for (const button of screen.getAllByRole('button', { name: '全部' })) await user.click(button);
    expect(document.querySelectorAll('.guide-index__row')).toHaveLength(guideCatalog.length);
  });
});
