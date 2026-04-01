import { describe, it, expect, beforeEach } from 'vitest';
import { appReducer } from '../app-reducer';
import { createDefaultAppState } from '../init';
import type { AppState } from '../../types/app-state';
import type { SessionImport } from '../../types/session';
import { normalizeSessionImport } from '../../parser/import-normalizer';
import { createStrategicDashboardYear } from '../../types/strategic-dashboard';

function makeSessionImport(overrides: Partial<SessionImport> = {}): SessionImport {
  return {
    advisor: 'prioritization',
    date: '2025-06-15',
    summary: 'Good session on priorities.',
    task_ops: {
      create: [
        { id: 'new-1', task: 'Review quarterly goals', dueDate: '2025-06-22', priority: 'high' },
      ],
      update: [],
      complete: [],
      defer: [],
      close: [],
    },
    habit_ops: {
      create: [],
      update: [],
      archive: [],
    },
    metrics: { clarity: 8 },
    context_for_next_session: 'Follow up on quarterly goals.',
    mood: 'focused',
    energy: 7,
    session_rating: 8,
    narrative_update: 'Focused on aligning priorities.',
    card_preview: 'Priorities aligned',
    ...overrides,
  };
}

function importAction(state: AppState, sessionImport: SessionImport) {
  return {
    type: 'IMPORT_SESSION' as const,
    payload: {
      advisorId: 'prioritization' as const,
      normalizedImport: normalizeSessionImport(state.advisors.prioritization, sessionImport),
    },
  };
}

describe('appReducer', () => {
  let defaultState: AppState;

  beforeEach(() => {
    defaultState = createDefaultAppState();
  });

  it('adds session record to advisor state', () => {
    const result = appReducer(defaultState, importAction(defaultState, makeSessionImport()));

    expect(result.advisors.prioritization.sessions).toHaveLength(1);
    expect(result.advisors.prioritization.lastSessionDate).toBe('2025-06-15');
    expect(result.advisors.prioritization.lastSessionSummary).toBe('Good session on priorities.');
  });

  it('adds new tasks from import', () => {
    const initialCount = defaultState.advisors.prioritization.tasks.length;
    const result = appReducer(defaultState, importAction(defaultState, makeSessionImport()));

    expect(result.advisors.prioritization.tasks.length).toBe(initialCount + 1);
  });

  it('completes existing tasks', () => {
    const itemId = defaultState.advisors.prioritization.tasks[0]?.id;
    if (!itemId) return;

    const sessionImport = makeSessionImport({
      task_ops: {
        create: [],
        update: [],
        complete: [itemId],
        defer: [],
        close: [],
      },
    });

    const result = appReducer(defaultState, importAction(defaultState, sessionImport));
    const completedItem = result.advisors.prioritization.tasks.find(i => i.id === itemId);
    expect(completedItem?.status).toBe('completed');
  });

  it('auto-merges task updates by text match', () => {
    const existing = defaultState.advisors.prioritization.tasks[0];
    const sessionImport = makeSessionImport({
      task_ops: {
        create: [],
        update: [
          {
            match: existing.task,
            task: `${existing.task} by Friday`,
            dueDate: '2025-06-20',
            priority: 'high',
          },
        ],
        complete: [],
        defer: [],
        close: [],
      },
    });

    const result = appReducer(defaultState, importAction(defaultState, sessionImport));
    const updatedItem = result.advisors.prioritization.tasks.find(i => i.id === existing.id);

    expect(updatedItem?.task).toContain('by Friday');
    expect(updatedItem?.dueDate).toBe('2025-06-20');
    expect(result.advisors.prioritization.tasks).toHaveLength(defaultState.advisors.prioritization.tasks.length);
  });

  it('adds habits and replaces advisor check-in config', () => {
    const sessionImport = makeSessionImport({
      task_ops: { create: [], update: [], complete: [], defer: [], close: [] },
      habit_ops: {
        create: [{ id: 'PRIH-1', name: 'Plan tomorrow', cadence: 'daily', targetCount: 1, unit: 'times' }],
        update: [],
        archive: [],
      },
      check_in_config: [
        { id: 'focus_quality', label: 'Focus quality', type: 'rating', min: 1, max: 10, source: 'metric' },
      ],
    });

    const result = appReducer(defaultState, importAction(defaultState, sessionImport));

    expect(result.advisors.prioritization.habits).toHaveLength(1);
    expect(result.advisors.prioritization.checkInConfig?.[0]?.id).toBe('focus_quality');
  });

  it('updates task status directly', () => {
    const itemId = defaultState.advisors.prioritization.tasks[0]?.id;
    if (!itemId) return;

    const result = appReducer(defaultState, {
      type: 'UPDATE_TASK',
      payload: { advisorId: 'prioritization', taskId: itemId, status: 'completed' },
    });

    const item = result.advisors.prioritization.tasks.find(i => i.id === itemId);
    expect(item?.status).toBe('completed');
  });

  it('stores a planning bucket for an open task', () => {
    const itemId = defaultState.advisors.prioritization.tasks[0]?.id;
    if (!itemId) return;

    const result = appReducer(defaultState, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: itemId, bucket: 'today' },
    });

    expect(Object.values(result.taskPlanning)).toEqual([
      expect.objectContaining({
        advisorId: 'prioritization',
        taskId: itemId,
        bucket: 'today',
      }),
    ]);
  });

  it('clears planning metadata when a task is completed', () => {
    const itemId = defaultState.advisors.prioritization.tasks[0]?.id;
    if (!itemId) return;

    const plannedState = appReducer(defaultState, {
      type: 'SET_TASK_PLAN_BUCKET',
      payload: { advisorId: 'prioritization', taskId: itemId, bucket: 'today' },
    });

    const result = appReducer(plannedState, {
      type: 'UPDATE_TASK',
      payload: { advisorId: 'prioritization', taskId: itemId, status: 'completed' },
    });

    expect(result.taskPlanning).toEqual({});
  });

  it('stores daily planning notes and completion for the current date', () => {
    const drafted = appReducer(defaultState, {
      type: 'SET_DAILY_PLANNING_FIELD',
      payload: {
        date: '2026-03-31',
        field: 'headline',
        value: 'Protect the top two priorities before noon.',
      },
    });

    const result = appReducer(drafted, {
      type: 'COMPLETE_DAILY_PLAN',
      payload: { date: '2026-03-31' },
    });

    expect(result.dailyPlanning.entries).toHaveLength(1);
    expect(result.dailyPlanning.entries[0]).toEqual(
      expect.objectContaining({
        date: '2026-03-31',
        headline: 'Protect the top two priorities before noon.',
      }),
    );
    expect(result.dailyPlanning.entries[0]?.completedAt).toMatch(/T/);
  });

  it('stores weekly review reflections and completion on the current week entry', () => {
    const drafted = appReducer(defaultState, {
      type: 'SET_WEEKLY_REVIEW_FIELD',
      payload: {
        weekStart: '2026-03-29',
        field: 'biggestWin',
        value: 'Booked the therapist follow-up before Friday.',
      },
    });

    const result = appReducer(drafted, {
      type: 'COMPLETE_WEEKLY_REVIEW',
      payload: { weekStart: '2026-03-29' },
    });

    expect(result.weeklyReview.entries).toHaveLength(1);
    expect(result.weeklyReview.entries[0]).toEqual(
      expect.objectContaining({
        weekStart: '2026-03-29',
        biggestWin: 'Booked the therapist follow-up before Friday.',
      }),
    );
    expect(result.weeklyReview.entries[0]?.completedAt).toMatch(/T/);
  });

  it('stores weekly focus tasks for the given week and prevents duplicates', () => {
    const itemId = defaultState.advisors.prioritization.tasks[0]?.id;
    if (!itemId) return;

    const focusedState = appReducer(defaultState, {
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: { advisorId: 'prioritization', taskId: itemId, weekStart: '2026-03-29' },
    });

    const duplicateState = appReducer(focusedState, {
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: { advisorId: 'prioritization', taskId: itemId, weekStart: '2026-03-29' },
    });

    expect(duplicateState.weeklyFocus.weeks).toHaveLength(1);
    expect(duplicateState.weeklyFocus.weeks[0]?.items).toHaveLength(1);
    expect(duplicateState.weeklyFocus.weeks[0]?.items[0]).toEqual(
      expect.objectContaining({
        advisorId: 'prioritization',
        taskId: itemId,
      }),
    );
  });

  it('prunes weekly focus items when an advisor is reset', () => {
    const itemId = defaultState.advisors.prioritization.tasks[0]?.id;
    if (!itemId) return;

    const focusedState = appReducer(defaultState, {
      type: 'ADD_WEEKLY_FOCUS_TASK',
      payload: { advisorId: 'prioritization', taskId: itemId, weekStart: '2026-03-29' },
    });

    const result = appReducer(focusedState, {
      type: 'RESET_ADVISOR',
      payload: { advisorId: 'prioritization' },
    });

    expect(result.weeklyFocus.weeks).toEqual([]);
  });

  it('promotes a strategic goal into a canonical task and links the goal back to it', () => {
    const planningYear = new Date().getFullYear();
    const draftedState = createDefaultAppState();
    draftedState.strategicDashboard.years = [createStrategicDashboardYear(planningYear)];

    const withGoal = appReducer(draftedState, {
      type: 'SET_STRATEGIC_GOAL_SLOT',
      payload: {
        year: planningYear,
        sectionKey: 'quarterGoals',
        index: 0,
        text: 'Lock the quarter priorities',
      },
    });

    const promoted = appReducer(withGoal, {
      type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
      payload: {
        year: planningYear,
        sectionKey: 'quarterGoals',
        index: 0,
        advisorId: 'prioritization',
        bucket: 'this_week',
        addToWeeklyFocusWeekStart: '2026-03-29',
      },
    });

    const linkedGoal = promoted.strategicDashboard.years[0]?.sections.quarterGoals.goals[0];
    expect(linkedGoal?.linkedTask).toEqual(
      expect.objectContaining({
        advisorId: 'prioritization',
      }),
    );

    const linkedTaskId = linkedGoal?.linkedTask?.taskId;
    expect(linkedTaskId).toBeTruthy();
    expect(promoted.advisors.prioritization.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: linkedTaskId,
          task: 'Lock the quarter priorities',
          status: 'open',
        }),
      ]),
    );
    expect(promoted.taskPlanning[`prioritization:${linkedTaskId}`]).toEqual(
      expect.objectContaining({
        bucket: 'this_week',
      }),
    );
    expect(promoted.weeklyFocus.weeks[0]?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          advisorId: 'prioritization',
          taskId: linkedTaskId,
        }),
      ]),
    );
  });

  it('re-promotes a linked strategic goal by updating the same canonical task', () => {
    const planningYear = new Date().getFullYear();
    const draftedState = createDefaultAppState();
    draftedState.strategicDashboard.years = [createStrategicDashboardYear(planningYear)];

    const firstPass = appReducer(
      appReducer(draftedState, {
        type: 'SET_STRATEGIC_GOAL_SLOT',
        payload: {
          year: planningYear,
          sectionKey: 'monthGoals',
          index: 0,
          text: 'Ship the first draft',
        },
      }),
      {
        type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
        payload: {
          year: planningYear,
          sectionKey: 'monthGoals',
          index: 0,
          advisorId: 'prioritization',
          bucket: 'today',
          addToWeeklyFocusWeekStart: null,
        },
      },
    );

    const linkedTaskId = firstPass.strategicDashboard.years[0]?.sections.monthGoals.goals[0].linkedTask?.taskId;
    expect(linkedTaskId).toBeTruthy();

    const secondPass = appReducer(
      appReducer(firstPass, {
        type: 'SET_STRATEGIC_GOAL_SLOT',
        payload: {
          year: planningYear,
          sectionKey: 'monthGoals',
          index: 0,
          text: 'Ship the polished first draft',
        },
      }),
      {
        type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
        payload: {
          year: planningYear,
          sectionKey: 'monthGoals',
          index: 0,
          advisorId: 'prioritization',
          bucket: 'today',
          addToWeeklyFocusWeekStart: null,
        },
      },
    );

    const matchingTasks = secondPass.advisors.prioritization.tasks.filter(task => task.id === linkedTaskId);
    expect(matchingTasks).toHaveLength(1);
    expect(matchingTasks[0]?.task).toBe('Ship the polished first draft');
  });
});
