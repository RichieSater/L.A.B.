import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getGoldenCompassSessionPath,
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../../../constants/routes';
import { createDefaultAppState } from '../../../state/init';
import { createStrategicDashboardYear } from '../../../types/strategic-dashboard';
import { startOfWeek, today } from '../../../utils/date';
import { StrategicPlannerPanel } from '../StrategicPlannerPanel';

const { useAppState, apiClient } = vi.hoisted(() => ({
  useAppState: vi.fn(),
  apiClient: {
    listCompassSessions: vi.fn(),
  },
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../../state/app-context', () => ({
  useAppState,
}));

vi.mock('../../../lib/api', () => ({
  apiClient,
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
    apiClient.listCompassSessions.mockResolvedValue([]);
  });

  it('shows linked canonical task status and reuses the same promotion action', async () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();
    const currentYear = new Date().getFullYear();
    const appState = createDefaultAppState();
    const linkedTaskId = 'PRI-LINKED-1';
    const currentWeekStart = startOfWeek(today());

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
        weekStart: currentWeekStart,
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

    await waitFor(() => {
      expect(apiClient.listCompassSessions).toHaveBeenCalledTimes(1);
    });

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
        weekStart: currentWeekStart,
      },
    });

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Open Weekly Focus in Weekly LAB' }));
    expect(navigate).toHaveBeenCalledWith(QUANTUM_PLANNER_PATH, {
      state: {
        dashboard: {
          tab: 'week',
          taskList: {
            advisorId: 'prioritization',
            taskListPreset: 'weekly_focus',
          },
        },
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
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);
  });

  it('falls back to the advisor-scoped task list when a linked task has no special weekly lane', async () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();
    const currentYear = new Date().getFullYear();
    const appState = createDefaultAppState();
    const linkedTaskId = 'PRI-LINKED-2';

    appState.advisors.prioritization.activated = true;
    appState.advisors.prioritization.tasks = [
      {
        id: linkedTaskId,
        task: 'Keep the month goal moving',
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

    const strategicYear = createStrategicDashboardYear(currentYear);
    strategicYear.sections.monthGoals.goals[0] = {
      ...strategicYear.sections.monthGoals.goals[0],
      text: 'Keep the month goal moving',
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

    await waitFor(() => {
      expect(apiClient.listCompassSessions).toHaveBeenCalledTimes(1);
    });

    const row = container.querySelector('[data-goal-key="monthGoals-0"]');
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Open advisor task list' }));
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
  });

  it('surfaces the active Compass session and resumes it directly from the planner shell', async () => {
    const dispatch = vi.fn();
    const navigate = vi.fn();
    const appState = createDefaultAppState();

    useAppState.mockReturnValue({
      state: appState,
      dispatch,
    });
    useNavigate.mockReturnValue(navigate);
    apiClient.listCompassSessions.mockResolvedValue([
      {
        id: 'compass-session-1',
        title: `Golden Compass ${new Date().getFullYear()}`,
        planningYear: new Date().getFullYear(),
        status: 'in_progress',
        currentScreen: 6,
        answerCount: 14,
        createdAt: '2026-03-30T12:00:00.000Z',
        updatedAt: '2026-03-30T13:30:00.000Z',
        completedAt: null,
        insights: null,
      },
    ]);

    render(<StrategicPlannerPanel />);

    expect(await screen.findByText('Compass in progress')).toBeInTheDocument();
    expect(screen.getByText(/Step 7 saved/i)).toBeInTheDocument();
    expect(screen.getByText(/14 answers captured/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resume Compass' }));
    expect(navigate).toHaveBeenCalledWith(getGoldenCompassSessionPath('compass-session-1'));

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(navigate).toHaveBeenCalledWith(getGoldenCompassSessionPath('compass-session-1'));

    fireEvent.click(screen.getByRole('button', { name: 'Open Compass Library' }));
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);

    await waitFor(() => {
      expect(apiClient.listCompassSessions).toHaveBeenCalledTimes(1);
    });
  });
});
