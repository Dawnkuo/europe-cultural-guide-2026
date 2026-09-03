import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineStatus } from './OfflineStatus';

describe('OfflineStatus', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('announces when the guide is offline', () => {
    let online = true;
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online);
    render(<OfflineStatus />);

    online = false;
    void act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByText('离线可读')).toBeInTheDocument();
  });

  it('registers the service worker inside the GitHub Pages base path', async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_PATH', '/europe-cultural-guide-2026');
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    render(<OfflineStatus />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        '/europe-cultural-guide-2026/sw.js',
      );
    });
  });
});
