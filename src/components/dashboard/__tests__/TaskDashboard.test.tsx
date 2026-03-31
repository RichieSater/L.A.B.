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

  it('recommends the highest-signal next move and jumps the raw task list into preset views', () => {
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

    expect(screen.getByText('Recommended Next Move')).toBeInTheDocument();
    expect(screen.getByText('Needs Triage deserves the next sweep')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Jump to Needs Triage' }));
    expect(screen.getByRole('button', { name: 'Viewing Needs Triage' })).toBeInTheDocument();
    expect(within(taskList).getByText('Give the backlog item a real bucket')).toBeInTheDocument();
    expect(within(taskList).queryByText('Stop carrying this task in Today')).not.toBeInTheDocument();

    fireEvent.click(within(taskList).getByRole('button', { name: /carry over/i, pressed: false }));
    expect(within(taskList).getByText('Stop carrying this task in Today')).toBeInTheDocument();
    expect(within(taskList).queryByText('Recover the overdue commitment')).not.toBeInTheDocument();

    fireEvent.click(within(taskList).getByRole('button', { name: /weekly focus/i, pressed: false }));
    expect(within(taskList).getByText('Move the weekly focus item forward')).toBeInTheDocument();
    expect(within(taskList).queryByText('Give the backlog item a real bucket')).not.toBeInTheDocument();
  });

  it('falls back to weekly focus when no higher-urgency planner lane is available', () => {
    const state = createDefaultAppState();
    const currentDate = today();
    const weekStart = startOfWeek(currentDate);

    state.advisors.prioritization.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'focus-task',
        task: 'Move the weekly focus item forward',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];

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

    expect(screen.getByText('Weekly Focus deserves the next sweep')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Jump to Weekly Focus' }));

    const taskList = screen.getByLabelText('Task list');
    expect(within(taskList).getByText('Move the weekly focus item forward')).toBeInTheDocument();
  });

  it('surfaces alternate live lanes next to the recommended next move', () => {
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

    expect(screen.getByText('Other live lanes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open recommended Carry Over lane' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open recommended Weekly Focus lane' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open recommended Carry Over lane' }));

    const taskList = screen.getByLabelText('Task list');
    expect(within(taskList).getByRole('button', { name: /carry over/i, pressed: true })).toBeInTheDocument();
    expect(within(taskList).getByText('Stop carrying this task in Today')).toBeInTheDocument();
    expect(within(taskList).queryByText('Give the backlog item a real bucket')).not.toBeInTheDocument();
  });

  it('applies routed advisor-specific task lane requests without creating new filter state', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-triage',
        task: 'Give prioritization a queue home',
        dueDate: addDays(currentDate, 1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-triage',
        task: 'Give therapy a queue home',
        dueDate: addDays(currentDate, 1),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
    ];

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-1',
          advisorId: 'prioritization',
          taskListPreset: 'needs_triage',
        }}
      />,
    );

    const taskList = screen.getByLabelText('Task list');

    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(within(taskList).getByText('Give prioritization a queue home')).toBeInTheDocument();
    expect(within(taskList).queryByText('Give therapy a queue home')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewing Needs Triage' })).toBeInTheDocument();
  });

  it('keeps advisor scope when switching planner presets from a routed advisor view', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-triage',
        task: 'Give prioritization a queue home',
        dueDate: addDays(currentDate, 1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
      {
        id: 'prio-carry',
        task: 'Rebucket the stale prioritization today task',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-carry',
        task: 'Therapy carry-over should stay hidden',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.taskPlanning['prioritization:prio-carry'] = {
      advisorId: 'prioritization',
      taskId: 'prio-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-carry'] = {
      advisorId: 'therapist',
      taskId: 'therapy-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T10:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-2',
          advisorId: 'prioritization',
          taskListPreset: 'needs_triage',
        }}
      />,
    );

    const taskList = screen.getByLabelText('Task list');
    fireEvent.click(within(taskList).getByRole('button', { name: /carry over/i, pressed: false }));
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(within(taskList).getByText('Rebucket the stale prioritization today task')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy carry-over should stay hidden')).not.toBeInTheDocument();
  });

  it('derives the recommended next move from the active advisor scope', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-carry',
        task: 'Rebucket the stale prioritization today task',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-triage',
        task: 'Therapy triage should not drive the scoped recommendation',
        dueDate: addDays(currentDate, 1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
    ];
    state.taskPlanning['prioritization:prio-carry'] = {
      advisorId: 'prioritization',
      taskId: 'prio-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-3',
          advisorId: 'prioritization',
        }}
      />,
    );

    expect(screen.getByText('Carry Over deserves the next sweep')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Jump to Carry Over' }));

    const taskList = screen.getByLabelText('Task list');
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(screen.getByText('Tasks for Prioritization still sitting in Today from an earlier sweep.')).toBeInTheDocument();
    expect(within(taskList).getByText('Rebucket the stale prioritization today task')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy triage should not drive the scoped recommendation')).not.toBeInTheDocument();
  });

  it('keeps advisor scope when using alternate live lanes from the recommended next move', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-carry',
        task: 'Rebucket the stale prioritization today task',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
      {
        id: 'prio-focus',
        task: 'Move the prioritization focus task forward',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-triage',
        task: 'Therapy triage should stay outside the scoped alternate lane',
        dueDate: addDays(currentDate, 1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
      {
        id: 'therapy-focus',
        task: 'Therapy focus should stay outside the scoped alternate lane',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.taskPlanning['prioritization:prio-carry'] = {
      advisorId: 'prioritization',
      taskId: 'prio-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['prioritization:prio-focus'] = {
      advisorId: 'prioritization',
      taskId: 'prio-focus',
      bucket: 'later',
      updatedAt: `${currentDate}T10:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-focus'] = {
      advisorId: 'therapist',
      taskId: 'therapy-focus',
      bucket: 'later',
      updatedAt: `${currentDate}T11:00:00.000Z`,
    };
    state.weeklyFocus.weeks = [
      {
        weekStart: startOfWeek(currentDate),
        items: [
          {
            advisorId: 'prioritization',
            taskId: 'prio-focus',
            addedAt: `${currentDate}T12:00:00.000Z`,
            carriedForwardFromWeekStart: null,
          },
          {
            advisorId: 'therapist',
            taskId: 'therapy-focus',
            addedAt: `${currentDate}T13:00:00.000Z`,
            carriedForwardFromWeekStart: null,
          },
        ],
      },
    ];

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-3b',
          advisorId: 'prioritization',
        }}
      />,
    );

    expect(screen.getByText('Carry Over deserves the next sweep')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open recommended Weekly Focus lane' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open recommended Weekly Focus lane' }));

    const taskList = screen.getByLabelText('Task list');
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(within(taskList).getByRole('button', { name: /weekly focus/i, pressed: true })).toBeInTheDocument();
    expect(within(taskList).getByText('Move the prioritization focus task forward')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy focus should stay outside the scoped alternate lane')).not.toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy triage should stay outside the scoped alternate lane')).not.toBeInTheDocument();
  });

  it('shows routed attention context and can expand back to the full LAB lane', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-triage',
        task: 'Give prioritization a queue home',
        dueDate: addDays(currentDate, 1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-triage',
        task: 'Give therapy a queue home too',
        dueDate: addDays(currentDate, 1),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
    ];

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-4',
          advisorId: 'prioritization',
          taskListPreset: 'needs_triage',
          attentionContext: {
            advisorName: 'Prioritization',
            headline: 'Queue needs a decision',
            reason: '1 high-priority unplanned • 1 unplanned total. Move this work into a real bucket before it turns into background guilt.',
            planningLabel: 'Needs Triage',
            planningCount: 1,
          },
        }}
      />,
    );

    const taskList = screen.getByLabelText('Task list');

    expect(screen.getByText('Attention Radar Handoff')).toBeInTheDocument();
    expect(screen.getByText('Prioritization: Queue needs a decision')).toBeInTheDocument();
    expect(screen.getByText('1 scoped task currently matches Needs Triage.')).toBeInTheDocument();
    expect(within(taskList).getByText('Give prioritization a queue home')).toBeInTheDocument();
    expect(within(taskList).queryByText('Give therapy a queue home too')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expand to all advisors' }));

    expect(screen.queryByText('Attention Radar Handoff')).not.toBeInTheDocument();
    expect(screen.queryByText('Scoped to Prioritization')).not.toBeInTheDocument();
    expect(within(taskList).getByText('Give prioritization a queue home')).toBeInTheDocument();
    expect(within(taskList).getByText('Give therapy a queue home too')).toBeInTheDocument();
  });

  it('lets a routed attention handoff pivot into another non-empty scoped planner lane', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-triage',
        task: 'Give prioritization a queue home',
        dueDate: addDays(currentDate, 1),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
      {
        id: 'prio-carry',
        task: 'Rebucket the routed prioritization carry-over task',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-carry',
        task: 'Therapy carry-over should stay hidden from the routed pivot',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.taskPlanning['prioritization:prio-carry'] = {
      advisorId: 'prioritization',
      taskId: 'prio-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-carry'] = {
      advisorId: 'therapist',
      taskId: 'therapy-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T10:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-5',
          advisorId: 'prioritization',
          taskListPreset: 'needs_triage',
          attentionContext: {
            advisorName: 'Prioritization',
            headline: 'Queue needs a decision',
            reason: '1 high-priority unplanned • 2 open total. Sweep the scoped lanes without leaving the advisor context.',
            planningLabel: 'Needs Triage',
            planningCount: 1,
          },
        }}
      />,
    );

    const taskList = screen.getByLabelText('Task list');

    expect(screen.getByRole('button', { name: 'Open Carry Over lane' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Carry Over lane' }));

    expect(screen.getByText('Attention Radar Handoff')).toBeInTheDocument();
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(screen.getByText('Tasks for Prioritization still sitting in Today from an earlier sweep.')).toBeInTheDocument();
    expect(within(taskList).getByText('Rebucket the routed prioritization carry-over task')).toBeInTheDocument();
    expect(within(taskList).queryByText('Give prioritization a queue home')).not.toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy carry-over should stay hidden from the routed pivot')).not.toBeInTheDocument();
  });

  it('shows scoped advisor context and opens a quick log when that is the next advisor action', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.fitness.activated = true;
    state.advisors.fitness.lastSessionDate = addDays(currentDate, -2);
    state.advisors.fitness.nextDueDate = addDays(currentDate, 5);
    state.advisors.fitness.tasks = [
      {
        id: 'fitness-check-in',
        task: 'Capture the current training signal',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.taskPlanning['fitness:fitness-check-in'] = {
      advisorId: 'fitness',
      taskId: 'fitness-check-in',
      bucket: 'later',
      updatedAt: `${currentDate}T09:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-6',
          advisorId: 'fitness',
        }}
      />,
    );

    expect(screen.getByText('Advisor Context')).toBeInTheDocument();
    expect(screen.getByText('Fitness: No quick log captured yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quick log' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quick log' }));

    expect(screen.getByText('Quick Log')).toBeInTheDocument();
    expect(screen.getByText('Fitness')).toBeInTheDocument();
  });

  it('lets scoped advisor context pivot into another non-empty lane without a handoff banner', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.fitness.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.fitness.lastSessionDate = addDays(currentDate, -2);
    state.advisors.fitness.nextDueDate = addDays(currentDate, 5);
    state.advisors.fitness.tasks = [
      {
        id: 'fitness-check-in',
        task: 'Capture the current training signal',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
      {
        id: 'fitness-carry',
        task: 'Rebucket the stale fitness today task',
        dueDate: addDays(currentDate, 2),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -4),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-carry',
        task: 'Therapy carry-over should stay hidden from the scoped advisor pivot',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -4),
      },
    ];
    state.taskPlanning['fitness:fitness-check-in'] = {
      advisorId: 'fitness',
      taskId: 'fitness-check-in',
      bucket: 'later',
      updatedAt: `${currentDate}T09:00:00.000Z`,
    };
    state.taskPlanning['fitness:fitness-carry'] = {
      advisorId: 'fitness',
      taskId: 'fitness-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-carry'] = {
      advisorId: 'therapist',
      taskId: 'therapy-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T10:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-7',
          advisorId: 'fitness',
        }}
      />,
    );

    const taskList = screen.getByLabelText('Task list');

    expect(screen.getByText('Advisor Context')).toBeInTheDocument();
    expect(screen.queryByText('Attention Radar Handoff')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Carry Over lane' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Carry Over lane' }));

    expect(screen.getByText('Scoped to Fitness')).toBeInTheDocument();
    expect(screen.getByText('Tasks for Fitness still sitting in Today from an earlier sweep.')).toBeInTheDocument();
    expect(within(taskList).getByText('Rebucket the stale fitness today task')).toBeInTheDocument();
    expect(within(taskList).queryByText('Capture the current training signal')).not.toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy carry-over should stay hidden from the scoped advisor pivot')).not.toBeInTheDocument();
  });

  it('scopes recent activity to the active advisor view', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.fitness.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.fitness.tasks[0] = {
      ...state.advisors.fitness.tasks[0]!,
      status: 'completed',
      completedDate: currentDate,
    };
    state.advisors.therapist.tasks[0] = {
      ...state.advisors.therapist.tasks[0]!,
      status: 'completed',
      completedDate: addDays(currentDate, -1),
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(
      <TaskDashboard
        navigationRequest={{
          requestKey: 'advisor-route-8',
          advisorId: 'fitness',
        }}
      />,
    );

    expect(
      screen.getByText(
        'A compact timeline of actual movement for Fitness so this advisor sweep reflects recent momentum, not unrelated activity.',
      ),
    ).toBeInTheDocument();
    const timeline = screen.getByText('Recent Activity').closest('section');

    expect(timeline).not.toBeNull();
    expect(within(timeline as HTMLElement).getByText(state.advisors.fitness.tasks[0]!.task)).toBeInTheDocument();
    expect(within(timeline as HTMLElement).queryByText(state.advisors.therapist.tasks[0]!.task)).not.toBeInTheDocument();
  });

  it('opens an advisor-scoped planner lane from advisor-linked recent activity', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-done',
        task: 'Close the previous prioritization loop',
        dueDate: addDays(currentDate, -1),
        priority: 'medium',
        status: 'completed',
        createdDate: addDays(currentDate, -4),
        completedDate: currentDate,
      },
      {
        id: 'prio-triage',
        task: 'Give the next prioritization backlog item a bucket',
        dueDate: addDays(currentDate, 2),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -1),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-later',
        task: 'Therapy task should stay hidden from the recent activity handoff',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.taskPlanning['therapist:therapy-later'] = {
      advisorId: 'therapist',
      taskId: 'therapy-later',
      bucket: 'later',
      updatedAt: `${currentDate}T10:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(<TaskDashboard />);

    const timeline = screen.getByText('Recent Activity').closest('section');
    if (!timeline) {
      throw new Error('Expected recent activity section.');
    }

    fireEvent.click(within(timeline).getByRole('button', { name: 'Open Needs Triage (1)' }));

    const taskList = screen.getByLabelText('Task list');
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewing Needs Triage' })).toBeInTheDocument();
    expect(within(taskList).getByText('Give the next prioritization backlog item a bucket')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy task should stay hidden from the recent activity handoff')).not.toBeInTheDocument();
  });

  it('opens an advisor-scoped planner lane from weekly review advisor signals', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-carry',
        task: 'Rebucket the stale prioritization today task',
        dueDate: addDays(currentDate, 2),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-later',
        task: 'Therapy task should stay hidden from the review handoff',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.taskPlanning['prioritization:prio-carry'] = {
      advisorId: 'prioritization',
      taskId: 'prio-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-later'] = {
      advisorId: 'therapist',
      taskId: 'therapy-later',
      bucket: 'later',
      updatedAt: `${currentDate}T10:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(<TaskDashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Carry Over (1)' }));

    const taskList = screen.getByLabelText('Task list');
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewing Carry Over' })).toBeInTheDocument();
    expect(within(taskList).getByText('Rebucket the stale prioritization today task')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy task should stay hidden from the review handoff')).not.toBeInTheDocument();
  });

  it('opens an advisor-scoped planner lane from a daily planning action card', () => {
    const state = createDefaultAppState();
    const currentDate = today();

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-carry',
        task: 'Rebucket the stale prioritization today task',
        dueDate: addDays(currentDate, 1),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -3),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-later',
        task: 'Therapy task should stay hidden from the daily planning handoff',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.taskPlanning['prioritization:prio-carry'] = {
      advisorId: 'prioritization',
      taskId: 'prio-carry',
      bucket: 'today',
      updatedAt: `${addDays(currentDate, -1)}T09:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-later'] = {
      advisorId: 'therapist',
      taskId: 'therapy-later',
      bucket: 'later',
      updatedAt: `${currentDate}T10:00:00.000Z`,
    };

    useAppState.mockReturnValue({
      state,
      dispatch: vi.fn(),
    });

    render(<TaskDashboard />);

    const dailyPlan = screen.getByText('Daily Plan').closest('section');
    if (!dailyPlan) {
      throw new Error('Expected daily planning section.');
    }

    fireEvent.click(within(dailyPlan).getByRole('button', { name: 'Open Carry Over in Weekly LAB' }));

    const taskList = screen.getByLabelText('Task list');
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewing Carry Over' })).toBeInTheDocument();
    expect(within(taskList).getByText('Rebucket the stale prioritization today task')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy task should stay hidden from the daily planning handoff')).not.toBeInTheDocument();
  });

  it('opens an advisor-scoped planner lane from a weekly focus card', () => {
    const state = createDefaultAppState();
    const currentDate = today();
    const weekStart = startOfWeek(currentDate);

    state.advisors.prioritization.activated = true;
    state.advisors.therapist.activated = true;
    state.advisors.prioritization.tasks = [
      {
        id: 'prio-focus',
        task: 'Move the prioritization focus task forward',
        dueDate: addDays(currentDate, 2),
        priority: 'high',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.advisors.therapist.tasks = [
      {
        id: 'therapy-later',
        task: 'Therapy task should stay hidden from the weekly focus handoff',
        dueDate: addDays(currentDate, 3),
        priority: 'medium',
        status: 'open',
        createdDate: addDays(currentDate, -2),
      },
    ];
    state.taskPlanning['prioritization:prio-focus'] = {
      advisorId: 'prioritization',
      taskId: 'prio-focus',
      bucket: 'this_week',
      updatedAt: `${currentDate}T09:00:00.000Z`,
    };
    state.taskPlanning['therapist:therapy-later'] = {
      advisorId: 'therapist',
      taskId: 'therapy-later',
      bucket: 'later',
      updatedAt: `${currentDate}T10:00:00.000Z`,
    };
    state.weeklyFocus.weeks = [
      {
        weekStart,
        items: [
          {
            advisorId: 'prioritization',
            taskId: 'prio-focus',
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

    const weeklyFocus = screen.getByRole('heading', { name: 'Weekly Focus' }).closest('section');
    if (!weeklyFocus) {
      throw new Error('Expected weekly focus section.');
    }

    fireEvent.click(within(weeklyFocus).getByRole('button', { name: 'Open Weekly Focus in Weekly LAB' }));

    const taskList = screen.getByLabelText('Task list');
    expect(screen.getByText('Scoped to Prioritization')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viewing Weekly Focus' })).toBeInTheDocument();
    expect(within(taskList).getByText('Move the prioritization focus task forward')).toBeInTheDocument();
    expect(within(taskList).queryByText('Therapy task should stay hidden from the weekly focus handoff')).not.toBeInTheDocument();
  });
});
