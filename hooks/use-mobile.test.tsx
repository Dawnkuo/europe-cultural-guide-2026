import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

describe('useIsMobile', () => {
  let matches = false;
  const listeners = new Set<() => void>();
  const addEventListener = vi.fn((_event: string, listener: () => void) =>
    listeners.add(listener),
  );
  const removeEventListener = vi.fn((_event: string, listener: () => void) =>
    listeners.delete(listener),
  );

  beforeEach(() => {
    matches = false;
    listeners.clear();
    vi.clearAllMocks();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return matches;
        },
        addEventListener,
        removeEventListener,
      })),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('reads the initial media-query result without an initialization effect', () => {
    matches = true;
    const { result } = renderHook(useIsMobile);
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('updates on both sides of the breakpoint and removes its listener', () => {
    const { result, unmount } = renderHook(useIsMobile);
    expect(result.current).toBe(false);
    act(() => {
      matches = true;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(true);
    act(() => {
      matches = false;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe(false);
    unmount();
    expect(listeners.size).toBe(0);
    expect(removeEventListener).toHaveBeenCalledWith(
      'change',
      addEventListener.mock.calls[0][1],
    );
  });

  it('has a deterministic server snapshot without accessing matchMedia', () => {
    function MobileState() {
      return <span>{String(useIsMobile())}</span>;
    }
    matches = true;
    expect(renderToString(<MobileState />)).toBe('<span>false</span>');
    expect(window.matchMedia).not.toHaveBeenCalled();
  });
});
