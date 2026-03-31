import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultAppState } from '../../../state/init';
import { addDays, startOfWeek, today } from '../../../utils/date';
import { TaskDashboard } from '../TaskDashboard';

const { useAppState } = vi.hoisted(() => ({
  useAppState: vi.fn(),
}));

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../state/app-context', () => ({
  useAppState,
}));

vi.mock('../../../auth/auth-context', () => ({
  useAuth,
}));

describe('TaskDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      profile: { schedulingEnabled: false },
    });
  });

  it('jumps the raw task list into high-signal preset views', () => {
    const state = createDefaultAppState();
    const currentDate = today();
    const weekStart = startOfWeek(currentDate);

    state.advisors.prioritization.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'triage-task',
        task: 'Give the backlog item a real bucket',
        dueDate: addDays(currentDate, 2),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
      {
        id: 'carry-over-task',
        task: 'Stop carrying this task in Today',
        dueDate: addDays(currentDate, 1),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -4),
      },
      {
        id: 'overdue-task',
        task: 'Recover the overdue commitment',
        dueDate: addDays(currentDate, -1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -5),
      },
      {
        id: 'focus-task',
        task: 'Move the weekly focus item forward',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];

    state.taskPlanning['prioritization:carry-over-task'] = {
      advisorId: 'prioritization',
      taskId: 'carry-over-task',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['prioritization:overdue-task'] = {
      advisorId: 'prioritization',
      taskId: 'overdue-task',
      bucket: 'this_week',
      updatedAt: `${currentDate}T09:00:00.000Z`,
    };
    state.taskPlanning['prioritization:focus-task'] = {
      advisorId: 'prioritization',
      taskId: 'focus-task',
      bucket: 'later',
      updatedAt: `${currentDate}T10:00:00.000Z`,
    };
    state.weeklyFocus.weeks = [
      {
        weekStart,
        items: [
          {
            advisorId: 'prioritization',
            taskId: 'focus-task',
            addedAt: `${currentDate}T11:00:00.000Z`,
            carriedForwardFromWeekStart: null,
          },
        ],
      },
    ];

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(<TaskDashboard />);

    const taskList = screen.getByLabelText('Task list');

    fireEvent.click(screen.getByRole('button', { name: /needs triage/i }));
    expect(within(taskList).getByText('Give the backlog item a real bucket')).toBeInTheDocument();
    expect(within(taskList).queryByText('Stop carrying this task in Today')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /carry over/i }));
    expect(within(taskList).getByText('Stop carrying this task in Today')).toBeInTheDocument();
    expect(within(taskList).queryByText('Recover the overdue commitment')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /weekly focus/i }));
    expect(within(taskList).getByText('Move the weekly focus item forward')).toBeInTheDocument();
    expect(within(taskList).queryByText('Give the backlog item a real bucket')).not.toBeInTheDocument();
  });
});
