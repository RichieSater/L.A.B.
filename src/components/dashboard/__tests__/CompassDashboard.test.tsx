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
  },
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
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

describe('CompassDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(vi.fn());
    apiClient.listCompassSessions.mockResolvedValue([]);
    apiClient.createCompassSession.mockResolvedValue(
      createCompassTestSession({ id: 'compass-created-from-dashboard' }),
    );
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

    fireEvent.click(screen.getByRole('button', { name: /Golden Compass In Progress/i }));
    expect(navigate).toHaveBeenCalledWith(getGoldenCompassSessionPath('compass-in-progress'));
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
