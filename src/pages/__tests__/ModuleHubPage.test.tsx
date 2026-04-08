import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADMIN_DASHBOARD_PATH,
  ADVISORY_BOARD_PATH,
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../../constants/routes';
import { ModuleHubPage } from '../ModuleHubPage';

const { useNavigate, useAuth } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

vi.mock('../../auth/auth-context', () => ({
  useAuth,
}));

describe('ModuleHubPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows all modules and routes only the live ones for premium users', () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      profile: {
        accountTier: 'premium',
      },
    });

    render(
      <MemoryRouter>
        <ModuleHubPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'The System' })).toBeInTheDocument();
    expect(screen.getByText('Quantum Planner')).toBeInTheDocument();
    expect(screen.getByText('Advisory Board')).toBeInTheDocument();
    expect(screen.getByText('Golden Compass')).toBeInTheDocument();
    expect(screen.getByText('Bonfire')).toBeInTheDocument();
    expect(screen.getByText('Morning Ship')).toBeInTheDocument();
    expect(screen.getByText('Scorecard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Quantum Planner' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Advisory Board' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Golden Compass' }));

    expect(navigate).toHaveBeenNthCalledWith(1, QUANTUM_PLANNER_PATH);
    expect(navigate).toHaveBeenNthCalledWith(2, ADVISORY_BOARD_PATH);
    expect(navigate).toHaveBeenNthCalledWith(3, GOLDEN_COMPASS_PATH);

    const bonfire = screen.getByRole('button', { name: 'Bonfire coming soon' });
    const morningShip = screen.getByRole('button', { name: 'Morning Ship coming soon' });
    const scorecard = screen.getByRole('button', { name: 'Scorecard coming soon' });

    expect(bonfire).toHaveAttribute('aria-disabled', 'true');
    expect(morningShip).toHaveAttribute('aria-disabled', 'true');
    expect(scorecard).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(bonfire);
    fireEvent.click(morningShip);
    fireEvent.click(scorecard);

    expect(navigate).toHaveBeenCalledTimes(3);
  });

  it('shows locked premium cards to free users and still lets them open Golden Compass', () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      profile: {
        accountTier: 'free',
      },
    });

    render(
      <MemoryRouter>
        <ModuleHubPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Open Golden Compass' })).toBeInTheDocument();

    const planner = screen.getByRole('button', { name: 'Quantum Planner premium only' });
    const advisory = screen.getByRole('button', { name: 'Advisory Board premium only' });

    expect(planner).toHaveAttribute('aria-disabled', 'true');
    expect(advisory).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Golden Compass' }));
    fireEvent.click(planner);
    fireEvent.click(advisory);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);
  });

  it('shows the admin dashboard card only to admins', () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
    useAuth.mockReturnValue({
      profile: {
        accountTier: 'admin',
      },
    });

    render(
      <MemoryRouter>
        <ModuleHubPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Admin Dashboard' }));

    expect(navigate).toHaveBeenCalledWith(ADMIN_DASHBOARD_PATH);
  });
});
