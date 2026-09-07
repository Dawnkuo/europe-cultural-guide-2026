import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { HighlightBrowser } from './HighlightBrowser';

const guide = guideCatalog.find((g) => g.slug === 'uffizi')!;
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  HTMLElement.prototype.scrollIntoView = () => {};
});

describe('collection browsing', () => {
  it('keeps the dialog title reference stable across server and client root prefixes', () => {
    for (const identifierPrefix of ['server-', 'client-']) {
      const dom = new DOMParser().parseFromString(renderToString(
        <HighlightBrowser slug={guide.slug} items={guide.highlights} />,
        { identifierPrefix },
      ), 'text/html');
      expect(dom.querySelector('dialog')?.getAttribute('aria-labelledby')).toBe('uffizi-work-detail-title');
    }
  });
  it('shows every work in order without pagination or a load-more step', () => {
    render(<HighlightBrowser slug={guide.slug} items={guide.highlights} />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      guide.highlights.map((item) => item.title),
    );
    expect(screen.getByRole('status')).toHaveTextContent('21 / 21');
    expect(screen.queryByRole('navigation', { name: '藏品分页' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /上一页|下一页|加载更多/ })).not.toBeInTheDocument();
  });

  it('searches the whole collection, filters categories and restores all results', async () => {
    const user = userEvent.setup();
    render(<HighlightBrowser slug={guide.slug} items={guide.highlights} />);
    const search = screen.getByRole('searchbox');
    await user.type(search, '朱迪斯');
    expect(
      screen.getByRole('heading', { name: '《朱迪斯斩杀荷罗孚尼》' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 / 21');
    await user.clear(search);
    await user.selectOptions(screen.getByRole('combobox'), '巴洛克绘画');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
    await user.type(search, 'no-matching-object');
    expect(screen.getByText('没有匹配的作品或空间。')).toBeInTheDocument();
    await user.clear(search);
    await user.selectOptions(screen.getByRole('combobox'), '全部');
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(guide.highlights.length);
  });

  it('opens the correct full entry, restores focus on close and supports a deep link', async () => {
    const user = userEvent.setup();
    render(<HighlightBrowser slug={guide.slug} items={guide.highlights} />);
    const button = screen.getByRole('button', { name: /诸圣教堂圣母/ });
    await user.click(button);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('《诸圣教堂圣母》');
    expect(
      within(dialog).getByRole('heading', { name: '《诸圣教堂圣母》' }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: '为何重要' }),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('#work-uffizi-ognissanti');
    await user.click(
      within(dialog).getByRole('button', { name: '关闭作品详情' }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
    window.history.replaceState(null, '', '#work-uffizi-long-neck');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', {
        name: '《长颈圣母》',
      }),
    ).toBeInTheDocument();
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { bubbles: true }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render a broken image for explicitly unillustrated entries', async () => {
    const user = userEvent.setup();
    const pitti = guideCatalog.find((g) => g.slug === 'pitti')!;
    render(<HighlightBrowser slug={pitti.slug} items={pitti.highlights} />);
    await user.type(screen.getByRole('searchbox'), '沉睡');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /沉睡的丘比特/ }));
    expect(
      within(screen.getByRole('dialog')).getByText(
        /暂缺符合清晰度要求的已核验配图/,
      ),
    ).toBeInTheDocument();
  });
});
