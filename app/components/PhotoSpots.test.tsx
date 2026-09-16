import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { tripDays } from '../data/trip';
import { buildPhotoSchedule, sortPhotoSpots } from '../lib/photo-schedule';
import { photoSpots } from '../data/photo-spots';
import { PhotoSpots, readPhotoFilters, photoKind } from './PhotoSpots';

const schedule = buildPhotoSchedule(photoSpots, guideCatalog, tripDays);
const guides = guideCatalog.map(({ slug, title, city }) => ({
  slug,
  title,
  city: ['罗马', '梵蒂冈'].includes(city) ? '罗马与梵蒂冈' : city,
}));
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllEnvs();
});

describe('photo spot directory', () => {
  it('renders itinerary dates in chronological order and keeps that order under filters', async () => {
    const user = userEvent.setup();
    render(<PhotoSpots guides={guides} schedule={schedule} />);
    const ids = () =>
      screen
        .getAllByRole('article')
        .map((card) => card.getAttribute('data-spot'));
    expect(ids()).toEqual(
      sortPhotoSpots(photoSpots, schedule).map((spot) => spot.id),
    );
    const scala = within(
      screen.getByRole('article', { name: '斯卡拉 · 侧包厢看红金观众厅' }),
    );
    expect(
      within(scala.getByLabelText('关联行程')).getByText('9月26日'),
    ).toBeInTheDocument();
    const bridge = within(
      screen.getByRole('article', { name: '圣三一桥 · 老桥与倒影' }),
    );
    expect(
      within(bridge.getByLabelText('关联行程')).getByText('9月27日'),
    ).toBeInTheDocument();
    expect(
      within(bridge.getByLabelText('关联行程')).getByText('9月28日'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^室外/ }));
    const expected = sortPhotoSpots(photoSpots, schedule).filter(
      (spot) => photoKind(spot) === 'outdoor',
    );
    expect(ids()).toEqual(expected.map((spot) => spot.id));
    await user.selectOptions(screen.getByLabelText('城市'), '佛罗伦萨');
    expect(ids()).toEqual(
      expected
        .filter((spot) => spot.city === '佛罗伦萨')
        .map((spot) => spot.id),
    );
  });
  it('keeps native filters disabled until their event handlers are ready', () => {
    const html = document.createElement('div');
    html.innerHTML = renderToString(
      <PhotoSpots guides={guides} schedule={schedule} />,
    );
    expect(html.querySelector('.photo-filters')).toHaveAttribute('disabled');
    expect(html.querySelector('.photo-spot__expand')).toHaveAttribute(
      'disabled',
    );
    render(<PhotoSpots guides={guides} schedule={schedule} />);
    expect(screen.getByLabelText('城市')).not.toBeDisabled();
  });
  it('shows every real photo and valid local guide link, with source and license', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<PhotoSpots guides={guides} schedule={schedule} />);
    expect(screen.getAllByRole('article')).toHaveLength(photoSpots.length);
    for (const spot of photoSpots) {
      const card = within(screen.getByRole('article', { name: spot.title }));
      expect(
        card.getByRole('img', { name: spot.alt }).getAttribute('src'),
      ).toMatch(/^\/europe-cultural-guide-2026\/images\/photo-spots\//);
      for (const slug of spot.guideSlugs)
        expect(
          card.getByRole('link', {
            name: guides.find((guide) => guide.slug === slug)!.title,
          }),
        ).toHaveAttribute(
          'href',
          `/europe-cultural-guide-2026/guides/${slug}/`,
        );
      expect(card.getByText('照片来源与许可')).toBeInTheDocument();
    }
  });
  it('filters cities, attractions, text and clears without changing the document URL', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/photo-spots/');
    render(<PhotoSpots guides={guides} schedule={schedule} />);
    await user.selectOptions(screen.getByLabelText('城市'), '科隆');
    expect(screen.getAllByRole('article')).toHaveLength(
      photoSpots.filter((spot) => spot.city === '科隆').length,
    );
    await user.selectOptions(screen.getByLabelText('景点'), 'koln-triangle');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(window.location.pathname).toBe('/photo-spots/');
    expect(window.location.search).toBe('');
    expect(window.location.hash).toContain('guide=koln-triangle');
    await user.type(screen.getByLabelText('搜索'), '不存在');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(
      screen.getByRole('heading', { name: '没有匹配的机位' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '清除筛选' }));
    expect(screen.getAllByRole('article')).toHaveLength(photoSpots.length);
    expect(window.location.hash).toBe('');
  });
  it('restores guide deep links and history changes, with an honest missing-evidence state', () => {
    window.history.replaceState(
      null,
      '',
      '/photo-spots/#guide=st-peters-basilica',
    );
    render(<PhotoSpots guides={guides} schedule={schedule} />);
    expect(screen.getByLabelText('城市')).toHaveValue('罗马与梵蒂冈');
    expect(screen.getAllByRole('article')).toHaveLength(
      photoSpots.filter((spot) =>
        spot.guideSlugs.includes('st-peters-basilica'),
      ).length,
    );
    act(() => {
      window.history.replaceState(null, '', '/photo-spots/#guide=uffizi');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByLabelText('城市')).toHaveValue('佛罗伦萨');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(readPhotoFilters('#city=invalid&guide=invalid', guides)).toEqual({
      city: '',
      guide: '',
      search: '',
      kind: '',
    });
  });
  it('restores indoor filters, explains rules and distinguishes a filtered empty result from missing data', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/photo-spots/#kind=indoor');
    render(<PhotoSpots guides={guides} schedule={schedule} />);
    expect(screen.getAllByRole('article')).toHaveLength(
      photoSpots.filter((spot) => photoKind(spot) === 'indoor').length,
    );
    expect(screen.getByRole('radio', { name: /^室内/ })).toBeChecked();
    await user.selectOptions(screen.getByLabelText('城市'), '罗马与梵蒂冈');
    await user.selectOptions(screen.getByLabelText('景点'), 'vatican-museums');
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getAllByText(/西斯廷礼拜堂禁止拍照/)).toHaveLength(3);
    await user.click(screen.getByRole('radio', { name: /^屋顶与观景台/ }));
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(
      screen.getByRole('heading', { name: '没有匹配的机位' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '清除筛选' }));
    expect(screen.getAllByRole('article')).toHaveLength(photoSpots.length);
    expect(window.location.hash).toBe('');
  });
});
