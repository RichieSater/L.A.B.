/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useReducer, useCallback, type ReactNode } from 'react';
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../lib/api';
import type { AdvisorId } from '../types/advisor';
import type { ScheduledSession, ScheduledSessionStatus } from '../types/scheduled-session';

interface SchedulingContextValue {
  sessions: ScheduledSession[];
  scheduleSession: (advisorId: AdvisorId, scheduledAt: string, durationMinutes?: number, sessionId?: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: ScheduledSessionStatus) => Promise<void>;
  getUpcomingSession: (advisorId: AdvisorId) => ScheduledSession | null;
}

type SchedulingAction =
  | { type: 'INITIALIZE'; payload: ScheduledSession[] }
  | { type: 'ADD'; payload: ScheduledSession }
  | { type: 'REMOVE'; payload: string }
  | { type: 'UPSERT'; payload: ScheduledSession };

const SchedulingContext = createContext<SchedulingContextValue | null>(null);

function schedulingReducer(state: ScheduledSession[], action: SchedulingAction): ScheduledSession[] {
  switch (action.type) {
    case 'INITIALIZE':
      return action.payload;
    case 'ADD':
      return [...state, action.payload].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    case 'REMOVE':
      return state.filter(session => session.id !== action.payload);
    case 'UPSERT':
      return state.map(session => (session.id === action.payload.id ? action.payload : session));
    default:
      return state;
  }
}

export function SchedulingProvider({ children }: { children: ReactNode }) {
  const { bootstrapData } = useAuth();
  const [sessions, dispatch] = useReducer(schedulingReducer, []);

  useEffect(() => {
    dispatch({ type: 'INITIALIZE', payload: bootstrapData?.scheduledSessions ?? [] });
  }, [bootstrapData]);

  const scheduleSession = useCallback(async (
    advisorId: AdvisorId,
    scheduledAt: string,
    durationMinutes = 60,
    sessionId?: string,
  ) => {
    if (sessionId) {
      const updated = await apiClient.updateScheduledSession(sessionId, { scheduledAt, durationMinutes });
      if (updated) {
        dispatch({ type: 'UPSERT', payload: updated });
      }
      return;
    }

    const existing = sessions.find(session => session.advisorId === advisorId && session.status === 'scheduled');
    if (existing) {
      const updated = await apiClient.updateScheduledSession(existing.id, { scheduledAt, durationMinutes });
      if (updated) {
        dispatch({ type: 'UPSERT', payload: updated });
      }
      return;
    }

    const session = await apiClient.createScheduledSession({ advisorId, scheduledAt, durationMinutes });
    dispatch({ type: 'ADD', payload: session });
  }, [sessions]);

  const cancelSession = useCallback(async (sessionId: string) => {
    await apiClient.updateScheduledSession(sessionId, { status: 'cancelled' });
    dispatch({ type: 'REMOVE', payload: sessionId });
  }, []);

  const completeSession = useCallback(async (sessionId: string) => {
    await apiClient.updateScheduledSession(sessionId, { status: 'completed' });
    dispatch({ type: 'REMOVE', payload: sessionId });
  }, []);

  const updateSessionStatus = useCallback(async (sessionId: string, status: ScheduledSessionStatus) => {
    const updated = await apiClient.updateScheduledSession(sessionId, { status });

    if (!updated || status !== 'scheduled') {
      dispatch({ type: 'REMOVE', payload: sessionId });
      return;
    }

    dispatch({ type: 'UPSERT', payload: updated });
  }, []);

  const getUpcomingSession = useCallback((advisorId: AdvisorId): ScheduledSession | null => {
    return sessions.find(s => s.advisorId === advisorId && s.status === 'scheduled') ?? null;
  }, [sessions]);

  return (
    <SchedulingContext.Provider
      value={{ sessions, scheduleSession, cancelSession, completeSession, updateSessionStatus, getUpcomingSession }}
    >
      {children}
    </SchedulingContext.Provider>
  );
}

export function useScheduling(): SchedulingContextValue {
  const ctx = useContext(SchedulingContext);
  if (!ctx) throw new Error('useScheduling must be used within SchedulingProvider');
  return ctx;
}
