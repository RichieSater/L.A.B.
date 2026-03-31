import { describe, expect, it } from 'vitest';
import { createDefaultAppState } from '../init';
import { appReducer } from '../app-reducer';
import {
  selectAdvisorAttentionSummary,
  selectDailyPlanningSummary,
  selectRecentActivitySummary,
  selectTaskPlanningSummary,
  selectWeeklyFocusSummary,
  selectWeeklyReviewSummary,
} from '../selectors';

describe('selectTaskPlanningSummary', () => {
  it('groups open tasks into planning lanes and leaves the rest unplanned', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.prioritization.activated = true;
    const firstTaskId = initialState.advisors.prioritization.tasks[0]?.id;
    const secondTaskId = initialState.advisors.prioritization.tasks[1]?.id;

    if (!firstTaskId || !secondTaskId) {
      throw new Error('Expected default prioritization tasks for selector test.');
    }

    const plannedToday = appReducer(initialState, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: firstTaskId, bucket: 'today' },
    });

    const plannedWeek = appReducer(plannedToday, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: secondTaskId, bucket: 'this_week' },
    });

    const summary = selectTaskPlanningSummary(plannedWeek);
    const todayLane = summary.lanes.find(lane => lane.bucket === 'today');
    const weekLane = summary.lanes.find(lane => lane.bucket === 'this_week');

    expect(todayLane?.items.map(item => item.id)).toContain(firstTaskId);
    expect(weekLane?.items.map(item => item.id)).toContain(secondTaskId);
    expect(summary.totalPlanned).toBe(2);
    expect(summary.unplanned.every(item => item.id !== firstTaskId && item.id !== secondTaskId)).toBe(true);
  });
});

describe('selectAdvisorAttentionSummary', () => {
  it('derives adjacent planner lanes for planning-focused advisor nudges', () => {
    const state = createDefaultAppState();
    state.advisors.prioritization.activated = true;

    state.advisors.prioritization.tasks = [
      {
        id: 'triage-task',
        task: 'Give this backlog item a bucket',
        dueDate: '2026-04-02',
        priority: 'high',
        status: 'open',
        createdDate: '2026-03-28',
      },
      {
        id: 'carry-task',
        task: 'Stop carrying this today task',
        dueDate: '2026-04-01',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-26',
      },
      {
        id: 'overdue-task',
        task: 'Recover the slipped commitment',
        dueDate: '2026-03-30',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-25',
      },
      {
        id: 'focus-task',
        task: 'Move the weekly focus item',
        dueDate: '2026-04-03',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-27',
      },
    ];
    state.advisors.prioritization.lastSessionDate = '2026-03-28';
    state.advisors.prioritization.nextDueDate = '2026-04-08';

    state.taskPlanning['prioritization:carry-task'] = {
      advisorId: 'prioritization',
      taskId: 'carry-task',
      bucket: 'today',
      updatedAt: '2026-03-30T09:00:00.000Z',
    };
    state.taskPlanning['prioritization:overdue-task'] = {
      advisorId: 'prioritization',
      taskId: 'overdue-task',
      bucket: 'this_week',
      updatedAt: '2026-03-31T09:00:00.000Z',
    };
    state.taskPlanning['prioritization:focus-task'] = {
      advisorId: 'prioritization',
      taskId: 'focus-task',
      bucket: 'later',
      updatedAt: '2026-03-31T10:00:00.000Z',
    };
    state.weeklyFocus.weeks = [
      {
        weekStart: '2026-03-29',
        items: [
          {
            advisorId: 'prioritization',
            taskId: 'focus-task',
            addedAt: '2026-03-31T11:00:00.000Z',
            carriedForwardFromWeekStart: null,
          },
        ],
      },
    ];

    const summary = selectAdvisorAttentionSummary(state, '2026-03-31');
    const prioritizationItem = summary.items.find(item => item.advisorId === 'prioritization');

    expect(prioritizationItem?.primaryAction).toBe('plan');
    expect(prioritizationItem?.planningPreset).toBe('needs_triage');
    expect(prioritizationItem?.alternatePlanningShortcuts).toEqual([
      {
        preset: 'carry_over',
        label: 'Carry Over',
        count: 1,
        headline: 'Today work is stalling',
        reason: '1 task is still sitting in Today from an earlier sweep. Rebucket or schedule the real commitment before adding more.',
      },
      {
        preset: 'overdue',
        label: 'Overdue',
        count: 1,
        headline: 'Task pressure is building',
        reason: '1 overdue task is still open. Clear the slipped commitment before it becomes ambient stress.',
      },
      {
        preset: 'weekly_focus',
        label: 'Weekly Focus',
        count: 1,
        headline: 'Weekly focus is stuck',
        reason: '1 weekly focus task is still open for this advisor. Move the current commitment before promoting fresh work.',
      },
    ]);
  });
});

describe('selectWeeklyReviewSummary', () => {
  it('derives adjacent planner lanes for weekly-review advisor cards', () => {
    const state = createDefaultAppState();
    state.advisors.prioritization.activated = true;

    state.advisors.prioritization.tasks = [
      {
        id: 'triage-task',
        task: 'Give this backlog item a bucket',
        dueDate: '2026-04-02',
        priority: 'high',
        status: 'open',
        createdDate: '2026-03-28',
      },
      {
        id: 'carry-task',
        task: 'Stop carrying this today task',
        dueDate: '2026-04-01',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-26',
      },
      {
        id: 'overdue-task',
        task: 'Recover the slipped commitment',
        dueDate: '2026-03-30',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-25',
      },
      {
        id: 'focus-task',
        task: 'Move the weekly focus item',
        dueDate: '2026-04-03',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-27',
      },
    ];

    state.taskPlanning['prioritization:carry-task'] = {
      advisorId: 'prioritization',
      taskId: 'carry-task',
      bucket: 'today',
      updatedAt: '2026-03-30T09:00:00.000Z',
    };
    state.taskPlanning['prioritization:overdue-task'] = {
      advisorId: 'prioritization',
      taskId: 'overdue-task',
      bucket: 'this_week',
      updatedAt: '2026-03-31T09:00:00.000Z',
    };
    state.taskPlanning['prioritization:focus-task'] = {
      advisorId: 'prioritization',
      taskId: 'focus-task',
      bucket: 'later',
      updatedAt: '2026-03-31T10:00:00.000Z',
    };
    state.weeklyFocus.weeks = [
      {
        weekStart: '2026-03-29',
        items: [
          {
            advisorId: 'prioritization',
            taskId: 'focus-task',
            addedAt: '2026-03-31T11:00:00.000Z',
            carriedForwardFromWeekStart: null,
          },
        ],
      },
    ];

    const summary = selectWeeklyReviewSummary(state, '2026-03-31');
    const prioritizationSnapshot = summary.advisorSnapshots.find(
      snapshot => snapshot.advisorId === 'prioritization',
    );

    expect(prioritizationSnapshot?.recommendedPreset).toBe('needs_triage');
    expect(prioritizationSnapshot?.alternatePlanningShortcuts).toEqual([
      {
        preset: 'carry_over',
        label: 'Carry Over',
        count: 1,
      },
      {
        preset: 'overdue',
        label: 'Overdue',
        count: 1,
      },
      {
        preset: 'weekly_focus',
        label: 'Weekly Focus',
        count: 1,
      },
    ]);
  });

  it('summarizes queue health for the current week', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.prioritization.activated = true;
    initialState.advisors.therapist.activated = true;

    const [firstTask, secondTask, thirdTask] = initialState.advisors.prioritization.tasks;
    const therapistTask = initialState.advisors.therapist.tasks[0];

    if (!firstTask || !secondTask || !thirdTask || !therapistTask) {
      throw new Error('Expected default tasks for weekly review selector test.');
    }

    firstTask.dueDate = '2026-03-29';
    secondTask.priority = 'high';
    thirdTask.dueDate = '2026-03-28';
    therapistTask.status = 'completed';
    therapistTask.completedDate = '2026-03-30';

    initialState.advisors.therapist.sessions.push({
      id: 'sess-1',
      advisorId: 'therapist',
      date: '2026-03-30',
      summary: 'Therapy reset',
      mood: 'steady',
      energy: 7,
      sessionRating: 8,
      tasksCreated: 0,
      tasksCompleted: 1,
      habitsCreated: 0,
      narrativeUpdate: '',
      rawImport: {
        advisor: 'therapist',
        date: '2026-03-30',
        summary: 'Therapy reset',
        task_ops: { create: [], update: [], complete: [], defer: [], close: [] },
        habit_ops: { create: [], update: [], archive: [] },
        metrics: {},
        context_for_next_session: '',
        mood: 'steady',
        energy: 7,
        session_rating: 8,
        narrative_update: '',
        card_preview: '',
      },
    });
    initialState.quickLogs.push({
      advisorId: 'therapist',
      date: '2026-03-30',
      timestamp: '2026-03-30T12:00:00.000Z',
      logs: { mood_rating: 7 },
    });
    initialState.weeklyFocus = {
      weeks: [
        {
          weekStart: '2026-03-29',
          items: [
            {
              advisorId: 'therapist',
              taskId: therapistTask.id,
              addedAt: '2026-03-30T12:00:00.000Z',
              carriedForwardFromWeekStart: null,
            },
          ],
        },
      ],
    };

    const stateWithPlan = appReducer(initialState, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: firstTask.id, bucket: 'today' },
    });

    const fullyPlannedState = appReducer(stateWithPlan, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: thirdTask.id, bucket: 'this_week' },
    });

    fullyPlannedState.taskPlanning[`prioritization:${firstTask.id}`] = {
      advisorId: 'prioritization',
      taskId: firstTask.id,
      bucket: 'today',
      updatedAt: '2026-03-30T12:00:00.000Z',
    };
    fullyPlannedState.taskPlanning[`prioritization:${thirdTask.id}`] = {
      advisorId: 'prioritization',
      taskId: thirdTask.id,
      bucket: 'this_week',
      updatedAt: '2026-03-31T12:00:00.000Z',
    };
    fullyPlannedState.weeklyReview = {
      entries: [
        {
          weekStart: '2026-03-29',
          completedAt: '2026-03-31T12:00:00.000Z',
          biggestWin: 'Closed the biggest open loop.',
          biggestLesson: 'Today lane needs a stricter cap.',
          nextWeekNote: 'Schedule from the queue sooner.',
        },
        {
          weekStart: '2026-03-22',
          completedAt: '2026-03-24T09:00:00.000Z',
          biggestWin: 'Protected the calendar once.',
          biggestLesson: 'Unplanned tasks piled up.',
          nextWeekNote: 'Carry forward the real priorities.',
        },
      ],
    };

    const summary = selectWeeklyReviewSummary(fullyPlannedState, '2026-03-31');

    expect(summary.completedThisWeek).toBe(true);
    expect(summary.entry.biggestWin).toBe('Closed the biggest open loop.');
    expect(summary.previousEntry?.weekStart).toBe('2026-03-22');
    expect(summary.counts.today).toBe(1);
    expect(summary.counts.unplanned).toBeGreaterThan(0);
    expect(summary.overduePlanned.map(item => item.id)).toContain(firstTask.id);
    expect(summary.overduePlanned.map(item => item.id)).toContain(thirdTask.id);
    expect(summary.staleToday.map(item => item.id)).toContain(firstTask.id);
    expect(summary.highPriorityUnplanned.map(item => item.id)).toContain(secondTask.id);
    expect(summary.actionGroups.map(group => group.id)).toEqual([
      'stale_today',
      'overdue_planned',
      'high_priority_unplanned',
    ]);
    expect(summary.actionGroups[0]?.items.map(item => item.id)).toEqual([firstTask.id]);
    expect(summary.actionGroups[1]?.items.map(item => item.id)).toEqual([thirdTask.id]);
    expect(summary.actionGroups[2]?.items.map(item => item.id)).toContain(secondTask.id);
    expect(summary.momentum).toEqual({
      completedTasks: 1,
      completedFocusTasks: 1,
      sessions: 1,
      quickLogDays: 1,
      activeAdvisors: 1,
    });
    expect(summary.recentWins.map(item => item.id)).toEqual([therapistTask.id]);
    expect(summary.advisorSnapshots.find(item => item.advisorId === 'therapist')?.status).toBe('momentum');
    expect(summary.advisorSnapshots.find(item => item.advisorId === 'prioritization')?.status).toBe('attention');
    expect(summary.recapSections.map(section => section.id)).toEqual([
      'wins',
      'advisors',
      'pressure',
      'focus',
    ]);
    expect(summary.recapSections.find(section => section.id === 'wins')?.lines).toEqual([
      `${therapistTask.task} (Therapist)`,
    ]);
    expect(summary.recapSections.find(section => section.id === 'pressure')?.lines).toContain(
      `Overdue planned: ${firstTask.task}, ${thirdTask.task}.`,
    );
    expect(summary.recapSections.find(section => section.id === 'focus')?.lines).toContain(
      `Resolve ${firstTask.task} before adding fresh commitments.`,
    );
  });
});

describe('selectRecentActivitySummary', () => {
  it('builds a mixed activity feed across tasks, sessions, quick logs, and planning rituals', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.prioritization.activated = true;
    initialState.advisors.therapist.activated = true;

    const prioritizationTask = initialState.advisors.prioritization.tasks[0];
    if (!prioritizationTask) {
      throw new Error('Expected prioritization task for recent activity selector test.');
    }

    prioritizationTask.status = 'completed';
    prioritizationTask.completedDate = '2026-03-31';

    initialState.advisors.therapist.sessions.push({
      id: 'sess-1',
      advisorId: 'therapist',
      date: '2026-03-30',
      summary: 'Therapy reset',
      mood: 'steady',
      energy: 7,
      sessionRating: 8,
      tasksCreated: 0,
      tasksCompleted: 1,
      habitsCreated: 0,
      narrativeUpdate: '',
      rawImport: {
        advisor: 'therapist',
        date: '2026-03-30',
        summary: 'Therapy reset',
        task_ops: { create: [], update: [], complete: [], defer: [], close: [] },
        habit_ops: { create: [], update: [], archive: [] },
        metrics: {},
        context_for_next_session: '',
        mood: 'steady',
        energy: 7,
        session_rating: 8,
        narrative_update: '',
        card_preview: '',
      },
    });
    initialState.quickLogs.push({
      advisorId: 'therapist',
      date: '2026-03-29',
      timestamp: '2026-03-29T12:00:00.000Z',
      logs: { mood_rating: 7, energy: 6 },
    });
    initialState.dailyPlanning = {
      entries: [
        {
          date: '2026-03-31',
          completedAt: '2026-03-31T08:00:00.000Z',
          headline: 'Protect the real block.',
          guardrail: '',
        },
      ],
    };
    initialState.weeklyReview = {
      entries: [
        {
          weekStart: '2026-03-29',
          completedAt: '2026-03-30T09:00:00.000Z',
          biggestWin: 'Stopped carrying therapist follow-up as background guilt.',
          biggestLesson: '',
          nextWeekNote: '',
        },
      ],
    };

    const summary = selectRecentActivitySummary(initialState, 'last_7_days', '2026-03-31');
    const todaySummary = selectRecentActivitySummary(initialState, 'today', '2026-03-31');

    expect(summary.total).toBe(5);
    expect(summary.counts).toEqual({
      completedTasks: 1,
      sessions: 1,
      quickLogs: 1,
      rituals: 2,
    });
    expect(summary.items.map(item => item.type)).toContain('task_complete');
    expect(summary.items.map(item => item.type)).toContain('session');
    expect(summary.items.map(item => item.type)).toContain('quick_log');
    expect(summary.items.map(item => item.type)).toContain('daily_plan');
    expect(summary.items.map(item => item.type)).toContain('weekly_review');
    expect(todaySummary.total).toBe(2);
    expect(todaySummary.items.map(item => item.type)).toEqual(['task_complete', 'daily_plan']);
  });

  it('can scope recent activity to one advisor without mixing in other advisors or global rituals', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.therapist.activated = true;
    initialState.advisors.fitness.activated = true;

    initialState.advisors.therapist.tasks[0]!.status = 'completed';
    initialState.advisors.therapist.tasks[0]!.completedDate = '2026-03-31';
    initialState.advisors.fitness.tasks[0]!.status = 'completed';
    initialState.advisors.fitness.tasks[0]!.completedDate = '2026-03-30';

    initialState.advisors.therapist.sessions.push({
      id: 'therapy-session',
      advisorId: 'therapist',
      date: '2026-03-30',
      summary: 'Therapy check-in',
      mood: 'steady',
      energy: 7,
      sessionRating: 8,
      tasksCreated: 0,
      tasksCompleted: 0,
      habitsCreated: 0,
      narrativeUpdate: '',
      rawImport: {
        advisor: 'therapist',
        date: '2026-03-30',
        summary: 'Therapy check-in',
        task_ops: { create: [], update: [], complete: [], defer: [], close: [] },
        habit_ops: { create: [], update: [], archive: [] },
        metrics: {},
        context_for_next_session: '',
        mood: 'steady',
        energy: 7,
        session_rating: 8,
        narrative_update: '',
        card_preview: '',
      },
    });
    initialState.quickLogs.push({
      advisorId: 'fitness',
      date: '2026-03-30',
      timestamp: '2026-03-30T08:00:00.000Z',
      logs: { energy: 7 },
    });
    initialState.dailyPlanning.entries.push({
      date: '2026-03-31',
      completedAt: '2026-03-31T08:00:00.000Z',
      headline: 'Protect the real block.',
      guardrail: '',
    });

    const summary = selectRecentActivitySummary(initialState, 'last_7_days', '2026-03-31', 'therapist');

    expect(summary.scopeAdvisorId).toBe('therapist');
    expect(summary.scopeAdvisorName).toBe('Therapist');
    expect(summary.counts).toEqual({
      completedTasks: 1,
      sessions: 1,
      quickLogs: 0,
      rituals: 0,
    });
    expect(summary.items.every(item => item.advisorId === 'therapist')).toBe(true);
    expect(summary.items.map(item => item.type)).toEqual(['task_complete', 'session']);
  });
});

describe('selectDailyPlanningSummary', () => {
  it('surfaces carry-over, focus gaps, and strong pull-in candidates', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.prioritization.activated = true;

    const [firstTask, secondTask, thirdTask] = initialState.advisors.prioritization.tasks;

    if (!firstTask || !secondTask || !thirdTask) {
      throw new Error('Expected default prioritization tasks for daily planning selector test.');
    }

    secondTask.priority = 'high';
    thirdTask.priority = 'high';

    const withCarryOver = appReducer(initialState, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: firstTask.id, bucket: 'today' },
    });
    withCarryOver.taskPlanning[`prioritization:${firstTask.id}`] = {
      advisorId: 'prioritization',
      taskId: firstTask.id,
      bucket: 'today',
      updatedAt: '2026-03-30T08:00:00.000Z',
    };

    const withFocus = appReducer(withCarryOver, {
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: 'prioritization',
        taskId: secondTask.id,
        weekStart: '2026-03-29',
      },
    });

    const withThisWeekPlan = appReducer(withFocus, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: secondTask.id, bucket: 'this_week' },
    });

    withThisWeekPlan.dailyPlanning = {
      entries: [
        {
          date: '2026-03-31',
          completedAt: null,
          headline: 'Keep today tight.',
          guardrail: '',
        },
        {
          date: '2026-03-30',
          completedAt: '2026-03-30T08:30:00.000Z',
          headline: 'Do not turn setup into work avoidance.',
          guardrail: 'Protect the real block.',
        },
      ],
    };

    const summary = selectDailyPlanningSummary(withThisWeekPlan, '2026-03-31');

    expect(summary.previousEntry?.date).toBe('2026-03-30');
    expect(summary.carryOverToday.map(item => item.id)).toEqual([firstTask.id]);
    expect(summary.focusOutsideToday.map(item => item.id)).toEqual([secondTask.id]);
    expect(summary.pullInCandidates.map(item => item.id)).toContain(thirdTask.id);
    expect(summary.actionGroups.map(group => group.id)).toEqual([
      'carry_over',
      'focus_outside_today',
      'pull_into_today',
    ]);
  });
});

describe('selectWeeklyFocusSummary', () => {
  it('builds current focus, carry-forward candidates, and suggestions from task state', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.prioritization.activated = true;

    const [firstTask, secondTask, thirdTask] = initialState.advisors.prioritization.tasks;

    if (!firstTask || !secondTask || !thirdTask) {
      throw new Error('Expected default prioritization tasks for weekly focus selector test.');
    }

    secondTask.priority = 'high';
    thirdTask.dueDate = '2026-03-30';

    const previousWeekFocus = appReducer(initialState, {
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: 'prioritization',
        taskId: firstTask.id,
        weekStart: '2026-03-22',
      },
    });

    const currentWeekFocus = appReducer(previousWeekFocus, {
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: {
        advisorId: 'prioritization',
        taskId: thirdTask.id,
        weekStart: '2026-03-29',
      },
    });

    const summary = selectWeeklyFocusSummary(currentWeekFocus, '2026-03-31');

    expect(summary.weekStart).toBe('2026-03-29');
    expect(summary.items.map(item => item.id)).toEqual([thirdTask.id]);
    expect(summary.previousWeekStart).toBe('2026-03-22');
    expect(summary.carryForwardCandidates.map(item => item.id)).toContain(firstTask.id);
    expect(summary.suggestedTasks.map(item => item.id)).toContain(secondTask.id);
    expect(summary.remainingSlots).toBe(2);
  });
});

describe('selectAdvisorAttentionSummary', () => {
  it('ranks schedule, planning, and quick-log nudges into obvious next actions', () => {
    const initialState = createDefaultAppState();
    initialState.advisors.therapist.activated = true;
    initialState.advisors.prioritization.activated = true;
    initialState.advisors.fitness.activated = true;

    initialState.advisors.therapist.lastSessionDate = '2026-03-15';
    initialState.advisors.therapist.nextDueDate = '2026-03-20';

    initialState.advisors.prioritization.lastSessionDate = '2026-03-28';
    initialState.advisors.prioritization.nextDueDate = '2026-04-06';
    const prioritizationTask = initialState.advisors.prioritization.tasks[0];

    if (!prioritizationTask) {
      throw new Error('Expected prioritization task for advisor attention selector test.');
    }

    prioritizationTask.priority = 'high';

    initialState.advisors.fitness.lastSessionDate = '2026-03-29';
    initialState.advisors.fitness.nextDueDate = '2026-04-06';
    initialState.advisors.fitness.tasks.forEach(task => {
      task.status = 'completed';
      task.completedDate = '2026-03-29';
    });

    const summary = selectAdvisorAttentionSummary(initialState, '2026-03-30');

    expect(summary.items[0]?.advisorId).toBe('therapist');
    expect(summary.items.find(item => item.advisorId === 'therapist')?.primaryAction).toBe('schedule');
    expect(summary.items.find(item => item.advisorId === 'prioritization')?.primaryAction).toBe('plan');
    expect(summary.items.find(item => item.advisorId === 'fitness')?.primaryAction).toBe('quick_log');
    expect(summary.scheduleCount).toBe(1);
    expect(summary.planCount).toBe(1);
    expect(summary.quickLogCount).toBe(1);
  });
});
