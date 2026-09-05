import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('paginates all works without permanently truncating to the first page', async () => {
    const user = userEvent.setup();
    render(<HighlightBrowser slug={guide.slug} items={guide.highlights} />);
    const titles = new Set<string>();
    for (let page = 0; page < 3; page++) {
      screen
        .getAllByRole('heading', { level: 3 })
        .forEach((h) => titles.add(h.textContent!));
      if (page < 2)
        await user.click(screen.getByRole('button', { name: '下一页藏品' }));
    }
    expect(titles.size).toBe(21);
    expect(screen.getByRole('button', { name: '下一页藏品' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '上一页藏品' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('searches later pages, filters categories and handles empty results', async () => {
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
  });

  it('opens the correct full entry, restores focus on close and supports a deep link beyond page one', async () => {
    const user = userEvent.setup();
    render(<HighlightBrowser slug={guide.slug} items={guide.highlights} />);
    const button = screen.getByRole('button', { name: /诸圣教堂圣母/ });
    await user.click(button);
    const dialog = screen.getByRole('dialog');
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
