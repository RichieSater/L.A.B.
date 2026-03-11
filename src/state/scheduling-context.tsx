import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/auth-context';
import type { AdvisorId } from '../types/advisor';
import type { ScheduledSession, ScheduledSessionStatus } from '../types/scheduled-session';

interface SchedulingContextValue {
  sessions: ScheduledSession[];
  scheduleSession: (advisorId: AdvisorId, scheduledAt: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: ScheduledSessionStatus) => Promise<void>;
  getUpcomingSession: (advisorId: AdvisorId) => ScheduledSession | null;
}

const SchedulingContext = createContext<SchedulingContextValue | null>(null);

export function SchedulingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);

  // Load sessions from Supabase
  useEffect(() => {
    if (!user) return;

    async function loadSessions() {
      const { data } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .in('status', ['scheduled'])
        .order('scheduled_at', { ascending: true });

      if (data) {
        const rows = data as Record<string, unknown>[];
        setSessions(
          rows.map(row => ({
            id: row.id as string,
            advisorId: row.advisor_id as AdvisorId,
            scheduledAt: row.scheduled_at as string,
            windowMinutes: row.window_minutes as number,
            status: row.status as ScheduledSessionStatus,
            createdAt: row.created_at as string,
          })),
        );
      }
    }

    loadSessions();
  }, [user]);

  // Check for expired sessions every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSessions(prev =>
        prev.map(s => {
          if (s.status !== 'scheduled') return s;
          const windowEnd = new Date(
            new Date(s.scheduledAt).getTime() + s.windowMinutes * 60 * 1000,
          );
          if (now > windowEnd) {
            // Mark as missed in DB (fire and forget)
            supabase
              .from('scheduled_sessions')
              .update({ status: 'missed', updated_at: new Date().toISOString() })
              .eq('id', s.id)
              .then();
            return { ...s, status: 'missed' as ScheduledSessionStatus };
          }
          return s;
        }),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const scheduleSession = useCallback(async (advisorId: AdvisorId, scheduledAt: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('scheduled_sessions')
      .insert({
        user_id: user.id,
        advisor_id: advisorId,
        scheduled_at: scheduledAt,
        window_minutes: 60,
        status: 'scheduled',
      })
      .select()
      .single();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      const session: ScheduledSession = {
        id: row.id as string,
        advisorId: row.advisor_id as AdvisorId,
        scheduledAt: row.scheduled_at as string,
        windowMinutes: row.window_minutes as number,
        status: row.status as ScheduledSessionStatus,
        createdAt: row.created_at as string,
      };
      setSessions(prev => [...prev, session].sort(
        (a, b) => a.scheduledAt.localeCompare(b.scheduledAt),
      ));
    }
  }, [user]);

  const cancelSession = useCallback(async (sessionId: string) => {
    await supabase
      .from('scheduled_sessions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const completeSession = useCallback(async (sessionId: string) => {
    await supabase
      .from('scheduled_sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    setSessions(prev => prev.filter(s => s.id !== sessionId));
  }, []);

  const updateSessionStatus = useCallback(async (sessionId: string, status: ScheduledSessionStatus) => {
    await supabase
      .from('scheduled_sessions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (status === 'scheduled') {
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status } : s));
    } else {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
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
