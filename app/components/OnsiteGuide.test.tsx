import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { OnsiteGuide } from './OnsiteGuide';

describe('OnsiteGuide', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it('opens, advances and stores onsite progress locally', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog[0];
    render(<OnsiteGuide guide={guide} />);

    await user.click(screen.getByRole('button', { name: '开始现场导览' }));
    expect(
      screen.getByRole('dialog', { name: `${guide.title}现场导览` }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`1 / ${guide.sequence.length}`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一站' }));
    expect(
      screen.getByText(`2 / ${guide.sequence.length}`),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(`guide-progress:${guide.slug}`)).toBe(
      '1',
    );
  });

  it('returns to the complete chapter without losing the page', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog[0];
    render(<OnsiteGuide guide={guide} />);

    await user.click(screen.getByRole('button', { name: '开始现场导览' }));
    await user.click(screen.getByRole('button', { name: '返回完整章节' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '开始现场导览' }),
    ).toBeInTheDocument();
  });
});
