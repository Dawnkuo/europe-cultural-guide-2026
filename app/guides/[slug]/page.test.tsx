import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { guideBySlug } from '../../data/guides';
import GuidePage, { generateStaticParams } from './page';

describe('GuidePage', () => {
  it('generates one static route per canonical guide', () => {
    expect(generateStaticParams()).toContainEqual({
      slug: 'st-peters-basilica',
    });
    expect(generateStaticParams()).toContainEqual({
      slug: 'cologne-cathedral',
    });
  });

  it('renders one complete chapter for a standard attraction', async () => {
    render(
      await GuidePage({
        params: Promise.resolve({ slug: 'cologne-cathedral' }),
      }),
    );

    expect(within(screen.getByRole('navigation', { name: '本章目录' })).getByRole('button', { name: '开始现场导览' })).toBeInTheDocument();

    expect(
      screen.getByRole('heading', { name: '科隆大教堂' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '室内导览地图' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '不可错过' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '现场顺序' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '实用攻略' }),
    ).toBeInTheDocument();
  });

  it('does not wrap the imported Vatican material in an iframe or external-style link', async () => {
    render(
      await GuidePage({
        params: Promise.resolve({ slug: 'vatican-museums' }),
      }),
    );

    expect(
      screen.getByRole('heading', { name: '梵蒂冈博物馆' }),
    ).toBeInTheDocument();
    expect(screen.queryByTitle(/完整离线导览/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: '打开完整离线导览' }),
    ).not.toBeInTheDocument();
  });

  it.each([
    'cologne-cathedral',
    'uffizi',
    'casa-batllo',
    'vatican-museums',
    'st-peters-basilica',
    'grand-canal',
    'la-scala',
  ])('renders the authored %s overview instead of the shared slogan', async (slug) => {
    const guide = guideBySlug(slug)!;
    render(await GuidePage({ params: Promise.resolve({ slug }) }));
    const overview = screen.getByRole('region', { name: guide.overviewTitle });
    expect(within(overview).getByRole('heading', { level: 2 })).toHaveTextContent(
      guide.overviewTitle,
    );
    expect(within(overview).getByText(guide.overview)).toBeInTheDocument();
    for (const fact of guide.orientation) {
      expect(within(overview).getByText(fact.body)).toBeInTheDocument();
    }
    expect(screen.queryByText('先建立判断框架')).not.toBeInTheDocument();
    expect(screen.queryByText(/Before entering/i)).not.toBeInTheDocument();
  });
});
