import { describe, it, expect, beforeEach } from 'vitest';
import { appReducer } from '../app-reducer';
import { createDefaultAppState } from '../init';
import type { AppState } from '../../types/app-state';
import type { SessionImport } from '../../types/session';
import { normalizeSessionImport } from '../../parser/import-normalizer';

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

  it('promotes a strategic goal into one canonical advisor task and links it back to the goal', () => {
    defaultState.strategicDashboard.years[0].sections.quarterGoals.goals[0].text =
      'Turn the annual direction into a real quarter plan';

    const result = appReducer(defaultState, {
      type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
      payload: {
        year: defaultState.strategicDashboard.years[0].year,
        sectionKey: 'quarterGoals',
        index: 0,
        advisorId: 'prioritization',
        bucket: 'this_week',
        addToWeeklyFocusWeekStart: '2026-03-29',
      },
    });

    const linkedTask = result.advisors.prioritization.tasks.find(
      item => item.task === 'Turn the annual direction into a real quarter plan',
    );

    expect(linkedTask).toBeDefined();
    expect(result.strategicDashboard.years[0].sections.quarterGoals.goals[0]?.linkedTask).toEqual({
      advisorId: 'prioritization',
      taskId: linkedTask?.id,
    });
    expect(result.taskPlanning[`prioritization:${linkedTask?.id}`]).toEqual(
      expect.objectContaining({
        advisorId: 'prioritization',
        taskId: linkedTask?.id,
        bucket: 'this_week',
      }),
    );
    expect(result.weeklyFocus.weeks[0]?.items).toEqual([
      expect.objectContaining({
        advisorId: 'prioritization',
        taskId: linkedTask?.id,
      }),
    ]);
  });

  it('re-promotes a linked open strategic task without creating a duplicate', () => {
    const existingTaskId = 'PRI-EXISTING-1';
    defaultState.advisors.prioritization.tasks.push({
      id: existingTaskId,
      task: 'Old strategy wording',
      dueDate: 'ongoing',
      priority: 'medium',
      status: 'open',
      createdDate: '2026-03-30',
    });
    defaultState.strategicDashboard.years[0].sections.yearGoals.goals[0] = {
      ...defaultState.strategicDashboard.years[0].sections.yearGoals.goals[0],
      text: 'Sharper strategy wording',
      linkedTask: {
        advisorId: 'prioritization',
        taskId: existingTaskId,
      },
    };

    const result = appReducer(defaultState, {
      type: 'PROMOTE_STRATEGIC_GOAL_TO_TASK',
      payload: {
        year: defaultState.strategicDashboard.years[0].year,
        sectionKey: 'yearGoals',
        index: 0,
        advisorId: 'prioritization',
        bucket: 'later',
        addToWeeklyFocusWeekStart: null,
      },
    });

    const updatedTasks = result.advisors.prioritization.tasks.filter(item => item.id === existingTaskId);
    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0]?.task).toBe('Sharper strategy wording');
    expect(result.taskPlanning[`prioritization:${existingTaskId}`]).toEqual(
      expect.objectContaining({
        bucket: 'later',
      }),
    );
  });
});
