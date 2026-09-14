import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { OnsiteGuide } from './OnsiteGuide';

const dialogMethods = ['showModal', 'close'] as const;
const originalDialogMethods = dialogMethods.map((name) => Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, name));
const originalScrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo');

describe('OnsiteGuide', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) { this.setAttribute('open', ''); },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); },
    });
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

  afterEach(() => {
    if (originalScrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', originalScrollTo);
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
    dialogMethods.forEach((name, index) => {
      const descriptor = originalDialogMethods[index];
      if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, name);
    });
  });

  it('opens, advances and stores onsite progress locally', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog[0];
    render(
      <nav aria-label="本章目录">
        <OnsiteGuide guide={guide} />
      </nav>,
    );

    await user.click(screen.getByRole('button', { name: '开始现场导览' }));
    expect(
      screen.getByRole('dialog', { name: `${guide.title}现场导览` }),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog').parentElement).toBe(document.body);
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

  it('restores saved progress on opening without clobbering it at mount', async () => {
    const user = userEvent.setup();
    const guide = guideCatalog[0];
    values.set(`guide-progress:${guide.slug}`, '1');
    render(<OnsiteGuide guide={guide} />);
    expect(values.get(`guide-progress:${guide.slug}`)).toBe('1');
    await user.click(screen.getByRole('button', { name: '开始现场导览' }));
    expect(screen.getByText(`2 / ${guide.sequence.length}`)).toBeInTheDocument();
  });

  it('continues when storage methods throw instead of crashing the chapter', async () => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: {
      getItem() { throw new Error('denied'); },
      setItem() { throw new Error('quota'); },
    } });
    const user = userEvent.setup();
    const guide = guideCatalog[0];
    render(<OnsiteGuide guide={guide} />);
    await user.click(screen.getByRole('button', { name: '开始现场导览' }));
    await user.click(screen.getByRole('button', { name: '下一站' }));
    expect(screen.getByText(`2 / ${guide.sequence.length}`)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('浏览器未能保存进度');
  });

  it('never assigns a collection item to a route stop just by array position', async () => {
    const user = userEvent.setup();
    const original = guideCatalog.find((g) => g.slug === 'uffizi')!;
    const guide = {
      ...original,
      sequence: [
        { title: '入口', body: '入口说明' },
        {
          title: '明确绑定的作品',
          body: '有确切作品对应的停点',
          highlightIds: ['uffizi-medusa'],
        },
      ],
    };
    render(<OnsiteGuide guide={guide} />);
    await user.click(screen.getByRole('button', { name: '开始现场导览' }));
    expect(screen.queryByText('此处重点')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一站' }));
    expect(screen.getByText('《美杜莎》')).toBeInTheDocument();
    expect(screen.queryByText('《春》')).not.toBeInTheDocument();
  });
});
