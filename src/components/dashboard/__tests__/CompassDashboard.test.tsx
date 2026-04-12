import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGoldenCompassSessionPath } from '../../../constants/routes';
import { createCompassTestSession } from '../../../testing/compass-test-data';
import { CompassDashboard } from '../CompassDashboard';

const { apiClient } = vi.hoisted(() => ({
  apiClient: {
    listCompassSessions: vi.fn(),
    createCompassSession: vi.fn(),
    updateCompassSession: vi.fn(),
    deleteCompassSession: vi.fn(),
  },
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/api')>('../../../lib/api');
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

vi.mock('../../../auth/auth-context', () => ({
  useAuth,
}));

describe('CompassDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(vi.fn());
    useAuth.mockReturnValue({
      refreshBootstrap: vi.fn().mockResolvedValue(undefined),
    });
    apiClient.listCompassSessions.mockResolvedValue([]);
    apiClient.createCompassSession.mockResolvedValue(
      createCompassTestSession({ id: 'compass-created-from-dashboard' }),
    );
    apiClient.updateCompassSession.mockResolvedValue(
      createCompassTestSession({ id: 'compass-updated', status: 'completed', isActive: true }),
    );
    apiClient.deleteCompassSession.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('shows the empty state and routes create actions into a new session', async () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    render(
      <MemoryRouter>
        <CompassDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No Compass sessions yet')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin Golden Compass' }));

    await waitFor(() => {
      expect(apiClient.createCompassSession).toHaveBeenCalledWith({
        planningYear: new Date().getFullYear(),
      });
    });
    expect(navigate).toHaveBeenCalledWith(getGoldenCompassSessionPath('compass-created-from-dashboard'));
  });

  it('renders in-progress and completed sessions and opens the selected session', async () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
    apiClient.listCompassSessions.mockResolvedValue([
      createCompassTestSession({
        id: 'compass-in-progress',
        title: 'Golden Compass In Progress',
      }),
      createCompassTestSession({
        id: 'compass-complete',
        title: 'Golden Compass Complete',
        status: 'completed',
        completedAt: '2026-04-11T12:20:00.000Z',
        isActive: true,
        achievedAt: '2026-04-12T12:20:00.000Z',
      }),
    ]);

    render(
      <MemoryRouter>
        <CompassDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Completed' })).toBeInTheDocument();
    expect(screen.getByText('Golden Compass In Progress')).toBeInTheDocument();
    expect(screen.getByText('Golden Compass Complete')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Achieved')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Open' })[0]!);
    expect(navigate).toHaveBeenCalledWith(getGoldenCompassSessionPath('compass-in-progress'));
  });

  it('runs completed-session lifecycle actions and refreshes bootstrap', async () => {
    const refreshBootstrap = vi.fn().mockResolvedValue(undefined);
    useAuth.mockReturnValue({ refreshBootstrap });
    apiClient.listCompassSessions
      .mockResolvedValueOnce([
        createCompassTestSession({
          id: 'compass-complete',
          title: 'Golden Compass Complete',
          status: 'completed',
          completedAt: '2026-04-11T12:20:00.000Z',
        }),
      ])
      .mockResolvedValue([
        createCompassTestSession({
          id: 'compass-complete',
          title: 'Golden Compass Complete',
          status: 'completed',
          completedAt: '2026-04-11T12:20:00.000Z',
          isActive: true,
          achievedAt: '2026-04-12T12:20:00.000Z',
        }),
      ]);

    render(
      <MemoryRouter>
        <CompassDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Golden Compass Complete')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use in LAB' }));
    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith('compass-complete', { setActive: true });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Unmark achieved' }));
    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith('compass-complete', { achieved: false });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(apiClient.deleteCompassSession).toHaveBeenCalledWith('compass-complete');
    });

    expect(refreshBootstrap).toHaveBeenCalled();
  });

  it('shows load and create errors without breaking the dashboard shell', async () => {
    apiClient.listCompassSessions.mockRejectedValue(new Error('Failed to load Compass sessions.'));
    apiClient.createCompassSession.mockRejectedValue(new Error('Failed to create Compass session.'));

    render(
      <MemoryRouter>
        <CompassDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Failed to load Compass sessions.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Compass' }));

    expect(await screen.findByText('Failed to create Compass session.')).toBeInTheDocument();
  });
});
