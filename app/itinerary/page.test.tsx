import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ItineraryPage from './page';

describe('ItineraryPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              map: {
                bounds: [0, 0, 1, 1],
                layers: {
                  water: [],
                  rail: [],
                  majorRoad: [],
                  road: [],
                  pedestrian: [],
                },
              },
            }),
          ),
      ),
    );
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/itinerary');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders every travel day in source order', () => {
    render(<ItineraryPage />);

    const dayHeadings = screen.getAllByRole('heading', { level: 2 });
    expect(dayHeadings[0]).toHaveTextContent('9月24日');
    expect(dayHeadings.at(-1)).toHaveTextContent('10月6日');
    expect(screen.getByText('穹顶14:30；圣殿15:30')).toBeInTheDocument();
  });

  it('allows manual city filtering after following a city-specific link', async () => {
    window.history.replaceState({}, '', '/itinerary?city=巴塞罗那');
    const user = userEvent.setup();
    render(<ItineraryPage />);
    expect(screen.getByRole('button', { name: '巴塞罗那' })).toHaveAttribute(
      'data-active',
      'true',
    );
    expect(
      screen.queryByRole('heading', { name: '9月24日' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '全部' }));
    expect(
      screen.getByRole('heading', { name: '9月24日' }),
    ).toBeInTheDocument();
  });

  it('falls back to the full itinerary for an unknown city', () => {
    window.history.replaceState({}, '', '/itinerary?city=unknown');
    render(<ItineraryPage />);
    expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute(
      'data-active',
      'true',
    );
    expect(
      screen.getByRole('heading', { name: '9月24日' }),
    ).toBeInTheDocument();
  });

  it('keeps alternatives separate without marking restored days as missing', () => {
    render(<ItineraryPage />);

    expect(screen.getAllByText('当日备选').length).toBeGreaterThan(0);
    expect(screen.queryByText('详细安排待补')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Gaffel am Dom（科隆传统啤酒馆）' }),
    ).toBeInTheDocument();
  });

  it('links cultural stops to their canonical guide chapter', () => {
    render(<ItineraryPage />);

    expect(
      screen.getByRole('link', { name: '米兰大教堂与露台' }),
    ).toHaveAttribute('href', '/guides/milan-duomo/');
    expect(screen.getAllByRole('link', { name: '老桥夜景' })).toHaveLength(2);
    expect(
      screen.getAllByRole('link', { name: '老桥夜景' })[0],
    ).toHaveAttribute('href', '/guides/ponte-vecchio/');
  });

  it('links every mapped day stop back to its timeline entry', () => {
    render(<ItineraryPage />);

    expect(screen.getAllByText('当日城市地图')).toHaveLength(12);
    expect(
      screen.getByRole('link', { name: '跳到行程：万神殿' }),
    ).toHaveAttribute('href', '#2026-09-30-pantheon');
    expect(screen.getAllByText('罗马与梵蒂冈')).toHaveLength(2);
  });

  it('hydrates city-filtered links without a server/client mismatch', async () => {
    const browserWindow = globalThis.window;
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: undefined,
    });
    const serverHtml = renderToString(<ItineraryPage />);
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: browserWindow,
    });
    window.history.replaceState({}, '', '/itinerary?city=巴塞罗那');

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const root = hydrateRoot(container, <ItineraryPage />);
    await waitFor(() =>
      expect(
        container.querySelector('button[data-active="true"]'),
      ).toHaveTextContent('巴塞罗那'),
    );

    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(
      /hydration|hydrated/i,
    );

    await act(async () => root.unmount());
    container.remove();
  });
});
