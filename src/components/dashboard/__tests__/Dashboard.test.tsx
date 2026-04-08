import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUANTUM_PLANNER_PATH } from '../../../constants/routes';
import { createDefaultAppState } from '../../../state/init';
import { Dashboard } from '../Dashboard';

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const { useAppState } = vi.hoisted(() => ({
  useAppState: vi.fn(),
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../../auth/auth-context', () => ({
  useAuth,
}));

vi.mock('../../../state/app-context', () => ({
  useAppState,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

vi.mock('../DailyLogButton', () => ({
  DailyLogButton: () => <div>daily log button</div>,
}));

vi.mock('../StrategicPlannerPanel', () => ({
  StrategicPlannerPanel: () => <div>strategic planner panel</div>,
}));

vi.mock('../TaskDashboard', () => ({
  TaskDashboard: () => <div>task dashboard</div>,
}));

vi.mock('../AdvisorAttentionPanel', () => ({
  AdvisorAttentionPanel: ({
    onOpenTasks,
  }: {
    onOpenTasks: (request?: { advisorId?: string; taskListPreset?: string }) => void;
  }) => (
    <button onClick={() => onOpenTasks({ advisorId: 'prioritization', taskListPreset: 'needs_triage' })}>
      Open planner handoff
    </button>
  ),
}));

vi.mock('../AdvisorCardGrid', () => ({
  AdvisorCardGrid: () => <div>advisor card grid</div>,
}));

vi.mock('../CompassDashboard', () => ({
  CompassDashboard: () => <div>compass dashboard</div>,
}));

vi.mock('../CalendarView', () => ({
  CalendarView: () => <div>calendar view</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(vi.fn());
    useAppState.mockReturnValue({
      state: createDefaultAppState(),
      dispatch: vi.fn(),
    });
    useAuth.mockReturnValue({
      profile: {
        schedulingEnabled: false,
        accountTier: 'premium',
      },
    });
  });

  it('keeps calendar local inside the focused quantum planner surface', () => {
    render(
      <MemoryRouter>
        <Dashboard forcedInitialTab="week" availableTabs={['week', 'calendar']} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Week' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Advisors' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compass' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Calendar' }));

    expect(screen.getByText('calendar view')).toBeInTheDocument();
    expect(screen.getByText('daily log button')).toBeInTheDocument();
  });

  it('routes advisory-board planner handoffs into quantum planner when week is not local', () => {
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    render(
      <MemoryRouter>
        <Dashboard forcedInitialTab="advisors" availableTabs={['advisors']} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Week' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open planner handoff' }));

    expect(navigate).toHaveBeenCalledWith(QUANTUM_PLANNER_PATH, {
      state: {
        dashboard: {
          tab: 'week',
          taskList: {
            advisorId: 'prioritization',
            taskListPreset: 'needs_triage',
          },
        },
      },
    });
  });
});
