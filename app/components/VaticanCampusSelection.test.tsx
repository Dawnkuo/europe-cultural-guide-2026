import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { VaticanCampusMap } from './VaticanCampusMap';

vi.mock('./VaticanCampusScene', () => ({ default: ({ selectedId, onFallback }: { selectedId: string; onFallback: () => void }) => <div data-testid="scene-selection">{selectedId}<button type="button" onClick={onFallback}>返回二维馆区</button></div> }));
beforeEach(() => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('opens in 2D and shares area selection across 3D, 2D and failure recovery', async () => {
  const user = userEvent.setup();
  render(<VaticanCampusMap guide={guideCatalog.find(guide => guide.slug === 'vatican-museums')!} />);
  expect(screen.getByRole('button', { name: '2D 馆区' })).toHaveAttribute('aria-pressed', 'true');
  await user.click(within(screen.getByLabelText('馆区列表')).getByRole('button', { name: '西侧长廊' }));
  await user.click(screen.getByRole('button', { name: '3D 馆区' }));
  expect(await screen.findByTestId('scene-selection')).toHaveTextContent('west-galleries');
  await user.click(within(screen.getByLabelText('馆区列表')).getByRole('button', { name: '松果庭院' }));
  expect(screen.getByTestId('scene-selection')).toHaveTextContent('pigna');
  await user.click(screen.getByRole('button', { name: '返回二维馆区' }));
  expect(screen.getByRole('button', { name: '2D 馆区' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(screen.getByLabelText('馆区列表')).getByRole('button', { name: '松果庭院' })).toHaveAttribute('aria-pressed', 'true');
  expect(document.querySelector('[data-campus-region]')).toHaveAttribute('data-campus-region', 'pigna');
});
