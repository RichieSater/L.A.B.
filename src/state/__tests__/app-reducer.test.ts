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
});
