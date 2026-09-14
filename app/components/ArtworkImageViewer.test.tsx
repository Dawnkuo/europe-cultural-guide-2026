import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HighlightBrowser } from './HighlightBrowser';

vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TransformComponent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

const work = {
  id: 'test-painting',
  title: '作品一',
  summary: '作品内容',
  lookFor: '观察衣褶',
  image: '/images/full.jpg',
  gallery: [
    { src: '/images/full.jpg', alt: '完整作品', caption: '全图' },
    { src: '/images/detail.jpg', alt: '衣褶局部' },
  ],
};

describe('artwork image dialog lifecycle', () => {
  it('keeps the selected image and returns focus without closing its work or changing the hash', async () => {
    const user = userEvent.setup();
    render(<HighlightBrowser slug="test" items={[work]} />);
    await user.click(screen.getByRole('button', { name: /作品一/ }));
    const detail = screen.getByRole('dialog', { name: '作品一' });
    const expand = within(detail).getByRole('button', {
      name: '放大查看：完整作品',
    });
    await user.click(expand);
    const viewer = screen.getByRole('dialog', { name: '作品一 · 图片查看' });
    await within(viewer).findByRole('button', { name: '放大图片' });
    expect(
      within(viewer).getByRole('button', { name: '上一张图片' }),
    ).toBeDisabled();
    await user.click(
      within(viewer).getByRole('button', { name: '下一张图片' }),
    );
    expect(
      within(viewer).getByRole('img', { name: '衣褶局部' }),
    ).toHaveAttribute('src', '/images/detail.jpg');
    expect(
      within(viewer).getByRole('button', { name: '下一张图片' }),
    ).toBeDisabled();
    expect(window.location.hash).toBe('#work-test-painting');
    fireEvent(viewer, new Event('cancel', { cancelable: true, bubbles: true }));
    expect(
      screen.queryByRole('dialog', { name: '作品一 · 图片查看' }),
    ).not.toBeInTheDocument();
    expect(detail).toBeVisible();
    expect(expand).toHaveFocus();
    expect(
      within(detail).getByRole('button', { name: '查看图片 2：衣褶局部' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('dismisses image viewing when navigation leaves its work and resets for another work', async () => {
    const user = userEvent.setup();
    render(
      <HighlightBrowser
        slug="test"
        items={[work, { ...work, id: 'second', title: '作品二' }]}
      />,
    );
    await user.click(screen.getByRole('button', { name: /作品一/ }));
    await user.click(
      screen.getByRole('button', { name: '放大查看：完整作品' }),
    );
    await screen.findByRole('application', { name: '作品大图' });
    window.history.replaceState(null, '', '#work-second');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(
      screen.queryByRole('dialog', { name: /图片查看/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: '作品二' })).toBeVisible();
    window.history.replaceState(null, '', '#work-test-painting');
    fireEvent(window, new HashChangeEvent('hashchange'));
    expect(screen.queryByRole('dialog', { name: /图片查看/ })).not.toBeInTheDocument();
    window.history.replaceState(null, '', '#work-second');
    fireEvent(window, new HashChangeEvent('hashchange'));
    await user.click(
      screen.getByRole('button', { name: '放大查看：完整作品' }),
    );
    expect(
      screen.getByRole('dialog', { name: '作品二 · 图片查看' }),
    ).toBeVisible();
  });

  it('allows retry of a failed image without abandoning the work', async () => {
    const user = userEvent.setup();
    render(<HighlightBrowser slug="test" items={[work]} />);
    await user.click(screen.getByRole('button', { name: /作品一/ }));
    await user.click(
      screen.getByRole('button', { name: '放大查看：完整作品' }),
    );
    await screen.findByRole('application', { name: '作品大图' });
    const viewer = screen.getByRole('dialog', { name: /图片查看/ });
    fireEvent.error(within(viewer).getByRole('img'));
    expect(
      within(viewer).getByRole('button', { name: '放大图片' }),
    ).toBeDisabled();
    await user.click(within(viewer).getByRole('button', { name: '重新加载' }));
    expect(
      within(viewer).queryByText('图片未能加载。'),
    ).not.toBeInTheDocument();
    expect(within(viewer).getByRole('img')).toHaveAttribute(
      'src',
      '/images/full.jpg',
    );
  });
});
