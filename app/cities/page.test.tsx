import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CitiesPage from './page';
import { cityProfiles } from '../data/cities';
import { guideForTripItem } from '../data/guides';
import { tripDays } from '../data/trip';

afterEach(() => vi.unstubAllEnvs());

describe('CitiesPage scheduled destinations', () => {
  it.each(['', '/europe-cultural-guide-2026'])('links every scheduled item with base path %s', (basePath) => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', basePath);
    render(<CitiesPage />);

    for (const profile of cityProfiles) {
      const names = profile.name === '罗马与梵蒂冈' ? ['罗马', '梵蒂冈'] : [profile.name];
      const items = tripDays.flatMap((day) => day.items
        .filter((item) => names.includes(item.city) && item.routePoint !== false)
        .map((item) => ({ item, date: day.date })));
      const chapter = document.getElementById(profile.name)!;
      const links = within(chapter.querySelector('.city-chapter__stops') as HTMLElement).getAllByRole('link');
      expect(links).toHaveLength(items.length);

      items.forEach(({ item, date }, index) => {
        const guide = guideForTripItem(item);
        const path = guide ? `/guides/${guide.slug}/` : `/itinerary/#${date}-${item.id}`;
        expect(links[index]).toHaveAccessibleName(item.title);
        expect(links[index]).toHaveAttribute('href', `${basePath}${path}`);
        expect(links[index]).toHaveAttribute('title', guide ? '查看景点导览' : '查看对应行程');
      });
    }
  });

  it('keeps alternatives out of scheduled links and no longer truncates large cities to eight items', () => {
    render(<CitiesPage />);
    const milan = document.getElementById('米兰')!.querySelector('.city-chapter__stops') as HTMLElement;
    expect(within(milan).queryByRole('link', { name: /Starbucks/ })).not.toBeInTheDocument();
    expect(within(milan).getByRole('link', { name: '斯卡拉歌剧院博物馆' })).toHaveAttribute('href', '/guides/la-scala/');
    expect(within(milan).getAllByRole('link').length).toBeGreaterThan(8);
  });
});
