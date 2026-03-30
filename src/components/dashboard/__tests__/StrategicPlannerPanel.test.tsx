import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultAppState } from '../../../state/init';
import { createStrategicDashboardYear } from '../../../types/strategic-dashboard';
import { StrategicPlannerPanel } from '../StrategicPlannerPanel';

const { useAppState } = vi.hoisted(() => ({
  useAppState: vi.fn(),
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
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

describe('StrategicPlannerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows linked canonical task status and reuses the same promotion action', () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();
    const currentYear = new Date().getFullYear();
    const appState = createDefaultAppState();
    const linkedTaskId = 'PRI-LINKED-1';

    appState.advisors.prioritization.activated = true;
    appState.advisors.prioritization.tasks = [
      {
        id: linkedTaskId,
        task: 'Turn strategy into this-week priorities',
        dueDate: 'ongoing',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-30',
      },
    ];
    appState.taskPlanning[`prioritization:${linkedTaskId}`] = {
      advisorId: 'prioritization',
      taskId: linkedTaskId,
      bucket: 'later',
      updatedAt: '2026-03-30T09:00:00.000Z',
    };
    appState.weeklyFocus.weeks = [
      {
        weekStart: '2026-03-29',
        items: [
          {
            advisorId: 'prioritization',
            taskId: linkedTaskId,
            addedAt: '2026-03-30T10:00:00.000Z',
            carriedForwardFromWeekStart: null,
          },
        ],
      },
    ];

    const strategicYear = createStrategicDashboardYear(currentYear);
    strategicYear.sections.yearGoals.goals[0] = {
      ...strategicYear.sections.yearGoals.goals[0],
      text: 'Turn strategy into this-week priorities',
      linkedTask: {
        advisorId: 'prioritization',
        taskId: linkedTaskId,
      },
    };
    appState.strategicDashboard.years = [strategicYear];

    useAppState.mockReturnValue({
      state: appState,
      dispatch,
    });
    useNavigate.mockReturnValue(navigate);

    const { container } = render(<StrategicPlannerPanel />);

    const row = container.querySelector('[data-goal-key="yearGoals-0"]');
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText('Linked task: Prioritization • In weekly focus')).toBeInTheDocument();
    expect(
      within(row as HTMLElement).getByText(
        'Further promotions will update this same canonical task instead of creating a duplicate.',
      ),
    ).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('Linked Task Controls')).toBeInTheDocument();
    expect(within(row as HTMLElement).getByRole('combobox')).toBeDisabled();

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Today' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_TASK_PLAN_BUCKET',
      payload: {
        advisorId: 'prioritization',
        taskId: linkedTaskId,
        bucket: 'today',
      },
    });

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Unplanned' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'CLEAR_TASK_PLAN_BUCKET',
      payload: {
        advisorId: 'prioritization',
        taskId: linkedTaskId,
      },
    });

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Remove Focus' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: 'prioritization',
        taskId: linkedTaskId,
        weekStart: '2026-03-29',
      },
    });

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Update linked task' }));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
      payload: {
        year: currentYear,
        sectionKey: 'yearGoals',
        index: 0,
        advisorId: 'prioritization',
        bucket: 'later',
        addToWeeklyFocusWeekStart: null,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open Compass' }));
    expect(navigate).toHaveBeenCalledWith('/compass');
  });
});
