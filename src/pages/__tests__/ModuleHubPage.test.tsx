import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADVISORY_BOARD_PATH,
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../../constants/routes';
import { ModuleHubPage } from '../ModuleHubPage';

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

describe('ModuleHubPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows all modules and routes only the live ones', () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

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
});
