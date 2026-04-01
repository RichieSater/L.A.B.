import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../../../constants/routes';
import { ADVISOR_CONFIGS } from '../../../advisors/registry';
import { createDefaultAppState } from '../../../state/init';
import { createStrategicDashboardYear } from '../../../types/strategic-dashboard';
import { addDays, startOfWeek, today } from '../../../utils/date';

const { useAdvisor, useAuth } = vi.hoisted(() => ({
  useAdvisor: vi.fn(),
  useAuth: vi.fn(),
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../../hooks/use-advisor', () => ({
  useAdvisor,
}));

vi.mock('../../../auth/auth-context', () => ({
  useAuth,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

vi.mock('../../scheduling/ScheduleModal', () => ({
  ScheduleModal: ({
    taskLabel,
    onClose,
  }: {
    taskLabel?: string;
    onClose: () => void;
  }) => (
    <div>
      <p>Schedule modal for {taskLabel}</p>
      <button onClick={onClose}>Close schedule</button>
    </div>
  ),
}));

import { AdvisorDetail } from '../AdvisorDetail';

describe('AdvisorDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows planner context and routes task actions into the canonical planner state', () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();
    const appState = createDefaultAppState();
    const currentYear = new Date().getFullYear();
    const currentDate = today();
    const weekStart = startOfWeek(currentDate);
    const previousDate = addDays(currentDate, -1);
    const advisorState = appState.advisors.prioritization;

    advisorState.activated = true;
    advisorState.tasks = [
      {
        id: 'task-1',
        task: 'Lock the quarterly priorities',
        dueDate: currentDate,
        priority: 'high',
        status: 'open',
        createdDate: previousDate,
      },
      {
        id: 'task-2',
        task: 'Draft the weekly review narrative',
        dueDate: 'ongoing',
        priority: 'medium',
        status: 'open',
        createdDate: currentDate,
      },
    ];
    appState.taskPlanning['prioritization:task-1'] = {
      advisorId: 'prioritization',
      taskId: 'task-1',
      bucket: 'today',
      updatedAt: `${previousDate}T09:00:00.000Z`,
    };
    appState.weeklyFocus.weeks = [
      {
        weekStart,
        items: [
          {
            advisorId: 'prioritization',
            taskId: 'task-1',
            addedAt: '2026-03-30T10:00:00.000Z',
            carriedForwardFromWeekStart: null,
          },
        ],
      },
    ];
    appState.strategicDashboard.years = [createStrategicDashboardYear(currentYear)];
    appState.strategicDashboard.years[0].sections.yearGoals.goals[0].text = 'Ship the unified LAB';
    useNavigate.mockReturnValue(navigate);

    useAdvisor.mockReturnValue({
      config: ADVISOR_CONFIGS.prioritization,
      state: advisorState,
      status: 'attention',
      dispatch,
      appState,
    });
    useAuth.mockReturnValue({
      profile: {
        schedulingEnabled: true,
      },
    });

    const { container } = render(
      <MemoryRouter>
        <AdvisorDetail advisorId="prioritization" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Planning Context')).toBeInTheDocument();
    expect(screen.getByText('Needs Triage deserves the next sweep')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Carry Over (1)' })).toBeInTheDocument();
    expect(
      screen.getByText('2 open tasks in this domain. 1 still needs a queue home.'),
    ).toBeInTheDocument();

    const planningCard = screen.getByText('Needs Triage deserves the next sweep').closest('div');
    expect(planningCard).not.toBeNull();
    fireEvent.click(
      within(planningCard as HTMLElement).getByRole('button', { name: 'Open Needs Triage in Weekly LAB' }),
    );
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

    fireEvent.click(screen.getByRole('button', { name: 'Open advisor task list' }));
    expect(navigate).toHaveBeenCalledWith(QUANTUM_PLANNER_PATH, {
      state: {
        dashboard: {
          tab: 'week',
          taskList: {
            advisorId: 'prioritization',
          },
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open Compass' }));
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);

    const carryOverTaskRow = container.querySelector('[data-task-id="task-1"]');
    const taskRow = container.querySelector('[data-task-id="task-2"]');
    expect(carryOverTaskRow).not.toBeNull();
    expect(taskRow).not.toBeNull();

    fireEvent.click(
      within(carryOverTaskRow as HTMLElement).getByRole('button', { name: 'Open Carry Over in Weekly LAB' }),
    );
    expect(navigate).toHaveBeenLastCalledWith(QUANTUM_PLANNER_PATH, {
      state: {
        dashboard: {
          tab: 'week',
          taskList: {
            advisorId: 'prioritization',
            taskListPreset: 'carry_over',
          },
        },
      },
    });

    fireEvent.click(
      within(taskRow as HTMLElement).getByRole('button', { name: 'Open Needs Triage in Weekly LAB' }),
    );
    expect(navigate).toHaveBeenLastCalledWith(QUANTUM_PLANNER_PATH, {
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

    fireEvent.click(within(taskRow as HTMLElement).getByRole('button', { name: 'This Week' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TASK_PLAN_BUCKET',
      payload: {
        advisorId: 'prioritization',
        taskId: 'task-2',
        bucket: 'this_week',
      },
    });

    fireEvent.click(within(taskRow as HTMLElement).getByRole('button', { name: 'Focus' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: 'prioritization',
        taskId: 'task-2',
        weekStart,
      },
    });

    fireEvent.click(within(taskRow as HTMLElement).getByRole('button', { name: 'Schedule' }));
    expect(screen.getByText('Schedule modal for Draft the weekly review narrative')).toBeInTheDocument();
  });
});
