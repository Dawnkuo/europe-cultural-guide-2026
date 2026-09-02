import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import GuidesPage from './page';

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
  });

  it('filters guides by city', async () => {
    const user = userEvent.setup();
    render(<GuidesPage />);

    await user.click(screen.getByRole('button', { name: '罗马' }));

    expect(screen.getByRole('link', { name: /万神殿/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /米兰大教堂与露台/ }),
    ).not.toBeInTheDocument();
  });
});
