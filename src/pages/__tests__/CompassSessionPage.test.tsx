import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GOLDEN_COMPASS_PATH } from '../../constants/routes';
import { ApiClientError } from '../../lib/api';
import { createCompassTestSession } from '../../testing/compass-test-data';
import { CompassSessionPage } from '../CompassSessionPage';

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

vi.mock('../../components/compass/CompassSessionRunner', () => ({
  CompassSessionRunner: ({ initialSession }: { initialSession: { id: string } }) => (
    <div>runner:{initialSession.id}</div>
  ),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

function renderSessionPage(entry = '/golden-compass/compass-test-session') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/golden-compass/:sessionId" element={<CompassSessionPage />} />
        <Route path={GOLDEN_COMPASS_PATH} element={<div>compass library</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CompassSessionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(vi.fn());
  });

  it('loads the requested Compass session into the runner', async () => {
    apiClient.getCompassSession.mockResolvedValue(createCompassTestSession({ id: 'compass-1' }));

    renderSessionPage();

    expect(await screen.findByText('runner:compass-1')).toBeInTheDocument();
    expect(apiClient.getCompassSession).toHaveBeenCalledWith('compass-test-session');
  });

  it('redirects back to the Compass library when the route has no session id', async () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    render(
      <MemoryRouter>
        <CompassSessionPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH, { replace: true });
    });
    expect(apiClient.getCompassSession).not.toHaveBeenCalled();
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

    renderSessionPage();

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH, { replace: true });
    });
  });

  it('shows a recoverable error state for non-404 failures', async () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
    apiClient.getCompassSession.mockRejectedValue(new Error('Failed to load this Compass session.'));

    renderSessionPage();

    expect(await screen.findByText('Compass unavailable')).toBeInTheDocument();
    expect(screen.getByText('Failed to load this Compass session.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to Compass' }));
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);
  });
});
