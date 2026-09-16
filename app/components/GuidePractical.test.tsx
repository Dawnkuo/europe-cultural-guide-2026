import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { GuidePractical } from './GuidePractical';

describe('guide preparation', () => {
  it('links supported attractions to the matching offline-compatible photo filter', () => {
    const supported = guideCatalog.find(guide => guide.slug === 'milan-duomo')!;
    const { rerender } = render(<GuidePractical guide={supported} />);
    expect(screen.getByRole('link', { name: '拍摄机位与实拍参考' })).toHaveAttribute('href', '/photo-spots/#guide=milan-duomo');
    rerender(<GuidePractical guide={guideCatalog.find(guide => guide.slug === 'uffizi')!} />);
    expect(screen.getByRole('link', { name: '拍摄机位与实拍参考' })).toHaveAttribute('href', '/photo-spots/#guide=uffizi');
  });
  const guide = guideCatalog.find((guide) => guide.slug === 'uffizi')!;
  const values = new Map<string, string>();
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
  beforeEach(() => {
    values.clear();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });
  afterEach(() => {
    cleanup();
    if (original) Object.defineProperty(window, 'localStorage', original);
  });
  it('preserves every note and visit with a link to the exact itinerary item', () => {
    render(<GuidePractical guide={guide} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(
      guide.practical.length,
    );
    for (const note of guide.practical)
      expect(screen.getByRole('checkbox', { name: note })).toBeInTheDocument();
    for (const visit of guide.scheduledVisits)
      expect(
        screen
          .getAllByRole('link')
          .some((link) =>
            link
              .getAttribute('href')
              ?.endsWith(`/itinerary/#${visit.date}-${visit.itemId}`),
          ),
      ).toBe(true);
  });
  it('retains per-guide progress, drops changed notes and can clear marks without hiding copy', async () => {
    const user = userEvent.setup();
    values.set(
      `guide-preparation:${guide.slug}`,
      JSON.stringify([guide.practical[0], 'outdated note', 3]),
    );
    render(<GuidePractical guide={guide} />);
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
    expect(
      screen.getByText(`已读 1 / ${guide.practical.length}`),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole('checkbox')[1]);
    expect(JSON.parse(values.get(`guide-preparation:${guide.slug}`)!)).toEqual(
      guide.practical.slice(0, 2),
    );
    await user.click(screen.getByRole('button', { name: '清除已读标记' }));
    expect(values.get(`guide-preparation:${guide.slug}`)).toBe('[]');
    expect(screen.getAllByRole('checkbox')).toHaveLength(
      guide.practical.length,
    );
  });
  it('remains usable if browser storage is disabled', async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: vi.fn(() => {
        throw new Error('Denied');
      }),
    });
    render(<GuidePractical guide={guide} />);
    await user.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('无法保存');
  });
});
