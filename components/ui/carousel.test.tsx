import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel';

const embla = vi.hoisted(() => {
  const state = { previous: false, next: true };
  const listeners = new Map<string, Set<() => void>>();
  return {
    state,
    listeners,
    ref: vi.fn(),
    canScrollPrev: () => state.previous,
    canScrollNext: () => state.next,
    scrollPrev: vi.fn(),
    scrollNext: vi.fn(),
    on: vi.fn((event: string, listener: () => void) => {
      const subscribers = listeners.get(event) ?? new Set();
      subscribers.add(listener);
      listeners.set(event, subscribers);
    }),
    off: vi.fn((event: string, listener: () => void) =>
      listeners.get(event)?.delete(listener),
    ),
  };
});

vi.mock('embla-carousel-react', () => ({ default: () => [embla.ref, embla] }));

function Example({
  orientation = 'horizontal',
}: {
  orientation?: 'horizontal' | 'vertical';
}) {
  return (
    <Carousel aria-label="Highlights" orientation={orientation}>
      <CarouselContent>
        <CarouselItem>First slide</CarouselItem>
        <CarouselItem>
          <input aria-label="Slide notes" />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

describe('Carousel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    embla.state.previous = false;
    embla.state.next = true;
    embla.listeners.clear();
  });

  it('exposes a named region and native slide list', () => {
    render(<Example />);
    const region = screen.getByRole('region', { name: 'Highlights' });
    expect(region.tagName).toBe('SECTION');
    expect(within(region).getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Previous slide' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeEnabled();
  });

  it('refreshes boundary buttons for select and reInit events', () => {
    render(<Example />);
    act(() => {
      embla.state.previous = true;
      embla.state.next = false;
      embla.listeners.get('select')?.forEach((listener) => listener());
    });
    expect(
      screen.getByRole('button', { name: 'Previous slide' }),
    ).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();
    act(() => {
      embla.state.next = true;
      embla.listeners.get('reInit')?.forEach((listener) => listener());
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(embla.scrollNext).toHaveBeenCalledOnce();
  });

  it('unsubscribes from both events on unmount', () => {
    const { unmount } = render(<Example />);
    expect(embla.listeners.get('select')?.size).toBe(1);
    expect(embla.listeners.get('reInit')?.size).toBe(1);
    unmount();
    expect(embla.listeners.get('select')?.size).toBe(0);
    expect(embla.listeners.get('reInit')?.size).toBe(0);
  });

  it.each([
    ['horizontal', 'ArrowLeft', 'ArrowRight'],
    ['vertical', 'ArrowUp', 'ArrowDown'],
  ] as const)(
    'supports %s keyboard navigation without stealing input keys',
    (orientation, previous, next) => {
      render(<Example orientation={orientation} />);
      const region = screen.getByRole('region', { name: 'Highlights' });
      fireEvent.keyDown(region, { key: previous });
      fireEvent.keyDown(region, { key: next });
      expect(embla.scrollPrev).toHaveBeenCalledOnce();
      expect(embla.scrollNext).toHaveBeenCalledOnce();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: next });
      expect(embla.scrollNext).toHaveBeenCalledOnce();
    },
  );
});
