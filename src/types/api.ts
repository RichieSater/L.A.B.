import type { AppState } from './app-state';
import type { ScheduledSession, ScheduledSessionStatus } from './scheduled-session';
import type { AdvisorId } from './advisor';

export interface UserProfile {
  displayName: string | null;
  schedulingEnabled: boolean;
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
}

export interface AuthUser {
  id: string;
  primaryEmailAddress: string | null;
}

export interface BootstrapResponse {
  profile: UserProfile;
  appState: AppState;
  scheduledSessions: ScheduledSession[];
  buildVersion: string;
}

export interface CreateScheduledSessionInput {
  advisorId: AdvisorId;
  scheduledAt: string;
  durationMinutes?: number;
}

export interface UpdateScheduledSessionInput {
  scheduledAt?: string;
  durationMinutes?: number;
  status?: ScheduledSessionStatus;
}

export interface GoogleCalendarConnection {
  connected: boolean;
  email: string | null;
  authUrl?: string | null;
}
