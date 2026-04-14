import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GOLDEN_COMPASS_PATH } from '../../constants/routes';
import { ApiClientError } from '../../lib/api';
import { createCompassTestSession } from '../../testing/compass-test-data';
import { CompassSessionViewPage } from '../CompassSessionViewPage';

const { apiClient } = vi.hoisted(() => ({
  apiClient: {
    getCompassSession: vi.fn(),
  },
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api')>('../../lib/api');
  return {
    ...actual,
    apiClient,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

function renderViewPage(entry = '/golden-compass/compass-test-session/view') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/golden-compass/:sessionId/view" element={<CompassSessionViewPage />} />
        <Route path={GOLDEN_COMPASS_PATH} element={<div>compass library</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CompassSessionViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(vi.fn());
    vi.spyOn(window, 'print').mockImplementation(() => undefined);
  });

  it('loads the requested Compass session into the formatted preview', async () => {
    apiClient.getCompassSession.mockResolvedValue(
      createCompassTestSession({ id: 'compass-1', status: 'completed' }),
    );

    renderViewPage();

    expect(await screen.findByText('Golden Compass View')).toBeInTheDocument();
    expect(screen.getByText('Golden Compass 2026')).toBeInTheDocument();
    expect(apiClient.getCompassSession).toHaveBeenCalledWith('compass-test-session');
  });

  it('redirects back to the Compass library when the session is missing', async () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
    apiClient.getCompassSession.mockRejectedValue(
      new ApiClientError({
        error: 'Compass session not found.',
        status: 404,
      }),
    );

    renderViewPage();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH, { replace: true });
    });
  });

  it('prints the formatted document from the download button', async () => {
    apiClient.getCompassSession.mockResolvedValue(
      createCompassTestSession({ id: 'compass-print', status: 'completed' }),
    );

    renderViewPage('/golden-compass/compass-print/view');

    fireEvent.click(await screen.findByRole('button', { name: 'Download PDF' }));
    expect(window.print).toHaveBeenCalledTimes(1);
  });
});
