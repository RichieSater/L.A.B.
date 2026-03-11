import { describe, it, expect, beforeEach } from 'vitest';
import { appReducer } from '../app-reducer';
import { createDefaultAppState } from '../init';
import type { AppState } from '../../types/app-state';
import type { SessionExport } from '../../types/session';

function makeSessionExport(overrides: Partial<SessionExport> = {}): SessionExport {
  return {
    advisor: 'prioritization',
    date: '2025-06-15',
    summary: 'Good session on priorities.',
    action_items: [
      { id: 'new-1', task: 'Review quarterly goals', due: '2025-06-22', priority: 'high' },
    ],
    completed_items: [],
    deferred_items: [],
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

describe('appReducer', () => {
  let defaultState: AppState;

  beforeEach(() => {
    defaultState = createDefaultAppState();
  });

  describe('INITIALIZE', () => {
    it('replaces entire state with payload', () => {
      const newState: AppState = {
        ...defaultState,
        quickLogs: [{ advisorId: 'career', date: '2025-01-01', timestamp: '2025-01-01T00:00:00Z', logs: {} }],
      };
      const result = appReducer(defaultState, { type: 'INITIALIZE', payload: newState });
      expect(result).toBe(newState);
    });
  });

  describe('IMPORT_SESSION', () => {
    it('adds session record to advisor state', () => {
      const sessionExport = makeSessionExport();
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.prioritization.sessions).toHaveLength(1);
      expect(result.advisors.prioritization.lastSessionDate).toBe('2025-06-15');
      expect(result.advisors.prioritization.lastSessionSummary).toBe('Good session on priorities.');
    });

    it('adds new action items from session', () => {
      const sessionExport = makeSessionExport();
      const initialItemCount = defaultState.advisors.prioritization.actionItems.length;

      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.prioritization.actionItems.length).toBe(initialItemCount + 1);
    });

    it('marks completed items', () => {
      const itemId = defaultState.advisors.prioritization.actionItems[0]?.id;
      if (!itemId) return;

      const sessionExport = makeSessionExport({ completed_items: [itemId] });
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      const completedItem = result.advisors.prioritization.actionItems.find(i => i.id === itemId);
      expect(completedItem?.status).toBe('completed');
    });

    it('updates metrics', () => {
      const sessionExport = makeSessionExport({ metrics: { clarity: 9 } });
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.prioritization.metricsLatest.clarity).toBe(9);
      expect(result.advisors.prioritization.metricsHistory).toHaveLength(1);
    });

    it('updates narrative', () => {
      const sessionExport = makeSessionExport({ narrative_update: 'New insight' });
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.prioritization.narrative).toContain('New insight');
    });

    it('calculates streak correctly for first session', () => {
      const sessionExport = makeSessionExport();
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.prioritization.streak).toBe(1);
    });

    it('sets context for next session', () => {
      const sessionExport = makeSessionExport({ context_for_next_session: 'Review goals' });
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.prioritization.contextForNextSession).toBe('Review goals');
    });

    it('does not affect other advisors', () => {
      const sessionExport = makeSessionExport();
      const result = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport },
      });

      expect(result.advisors.career.sessions).toEqual([]);
      expect(result.advisors.career.lastSessionDate).toBeNull();
    });
  });

  describe('UPDATE_ACTION_ITEM', () => {
    it('updates item status', () => {
      const itemId = defaultState.advisors.prioritization.actionItems[0]?.id;
      if (!itemId) return;

      const result = appReducer(defaultState, {
        type: 'UPDATE_ACTION_ITEM',
        payload: { advisorId: 'prioritization', itemId, status: 'completed' },
      });

      const item = result.advisors.prioritization.actionItems.find(i => i.id === itemId);
      expect(item?.status).toBe('completed');
    });
  });

  describe('TOGGLE_ADVISOR_ACTIVATION', () => {
    it('toggles activation on', () => {
      expect(defaultState.advisors.prioritization.activated).toBe(false);

      const result = appReducer(defaultState, {
        type: 'TOGGLE_ADVISOR_ACTIVATION',
        payload: { advisorId: 'prioritization' },
      });

      expect(result.advisors.prioritization.activated).toBe(true);
    });

    it('toggles activation off', () => {
      const activated = appReducer(defaultState, {
        type: 'TOGGLE_ADVISOR_ACTIVATION',
        payload: { advisorId: 'prioritization' },
      });

      const result = appReducer(activated, {
        type: 'TOGGLE_ADVISOR_ACTIVATION',
        payload: { advisorId: 'prioritization' },
      });

      expect(result.advisors.prioritization.activated).toBe(false);
    });
  });

  describe('RESET_ADVISOR', () => {
    it('resets advisor to default state', () => {
      const withSession = appReducer(defaultState, {
        type: 'IMPORT_SESSION',
        payload: { advisorId: 'prioritization', sessionExport: makeSessionExport() },
      });

      expect(withSession.advisors.prioritization.sessions).toHaveLength(1);

      const result = appReducer(withSession, {
        type: 'RESET_ADVISOR',
        payload: { advisorId: 'prioritization' },
      });

      expect(result.advisors.prioritization.sessions).toEqual([]);
      expect(result.advisors.prioritization.lastSessionDate).toBeNull();
      expect(result.advisors.prioritization.activated).toBe(false);
    });
  });

  describe('ADD_QUICK_LOG', () => {
    it('appends a quick log entry', () => {
      const entry = {
        advisorId: 'fitness',
        date: '2025-06-15',
        timestamp: '2025-06-15T10:00:00Z',
        logs: { weight: 180 },
      };

      const result = appReducer(defaultState, {
        type: 'ADD_QUICK_LOG',
        payload: entry,
      });

      expect(result.quickLogs).toHaveLength(1);
      expect(result.quickLogs[0].advisorId).toBe('fitness');
    });
  });
});
