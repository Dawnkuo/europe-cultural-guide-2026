import { Suspense } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guideCatalog } from '../data/guides';
import { guideExteriorTrials } from '../data/guide-exterior-trials';
import { GuideExterior } from './GuideExterior';

vi.mock('./GuideExteriorScene', () => ({ GuideExteriorScene: ({ guide }: { guide: { slug: string } }) => <div data-testid="local-exterior">{guide.slug}</div> }));
vi.mock('./ReferenceExterior', () => ({ ReferenceExterior: ({ model, usage }: { model: { id: string }; usage: string }) => <div data-testid="remote-exterior" data-usage={usage}>{model.id}</div> }));
const original = { ...guideExteriorTrials };
const trials = guideExteriorTrials as Record<string, string>;
afterEach(() => {
  cleanup();
  for (const key of Object.keys(trials)) delete trials[key];
  Object.assign(trials, original);
});
function show(slug: string) {
  return render(<Suspense fallback="Loading"><GuideExterior guide={guideCatalog.find(guide => guide.slug === slug)!} /></Suspense>);
}

describe('reversible Florence exterior replacement', () => {
  it('keeps the OSM-capable renderer instead of silently replacing it with an online viewer', async () => {
    expect(guideExteriorTrials).toEqual({});
    show('florence-duomo');
    expect(await screen.findByTestId('local-exterior')).toHaveTextContent('florence-duomo');
    expect(screen.queryByTestId('remote-exterior')).not.toBeInTheDocument();
  });
  it('can render an explicitly configured isolated trial', async () => {
    trials['florence-duomo'] = 'florence-duomo';
    show('florence-duomo');
    expect(await screen.findByTestId('remote-exterior')).toHaveTextContent('florence-duomo');
    expect(screen.getByTestId('remote-exterior')).toHaveAttribute('data-usage', 'guide');
    expect(screen.queryByTestId('local-exterior')).not.toBeInTheDocument();
  });
  it.each(['milan-duomo', 'sagrada-familia', 'st-mark-basilica', 'pantheon'])('keeps %s on its original renderer', async slug => {
    show(slug);
    expect(await screen.findByTestId('local-exterior')).toHaveTextContent(slug);
    expect(screen.queryByTestId('remote-exterior')).not.toBeInTheDocument();
  });
  it('rolls back by removing the one configuration entry', async () => {
    trials['florence-duomo'] = 'florence-duomo';
    delete trials['florence-duomo'];
    show('florence-duomo');
    expect(await screen.findByTestId('local-exterior')).toHaveTextContent('florence-duomo');
    expect(screen.queryByTestId('remote-exterior')).not.toBeInTheDocument();
  });
  it('rejects a mismatched model instead of showing another building', async () => {
    trials['florence-duomo'] = 'pantheon';
    show('florence-duomo');
    expect(await screen.findByTestId('local-exterior')).toHaveTextContent('florence-duomo');
  });
});
