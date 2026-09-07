import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorPage from '../error';
import NotFound from '../not-found';

describe('themed fallback pages', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps not-found recovery inside the deployed guide', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    render(<NotFound />);
    expect(screen.getByRole('main')).toHaveClass('page-fallback');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '没有找到这个页面',
    );
    expect(screen.getByRole('link', { name: '返回景点导览' })).toHaveAttribute(
      'href',
      '/europe-cultural-guide-2026/guides/',
    );
  });

  it('retries loading without exposing an exception or booking data', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('private diagnostic')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(reset).toHaveBeenCalledOnce();
    expect(screen.queryByText('private diagnostic')).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass('page-fallback');
  });
});
