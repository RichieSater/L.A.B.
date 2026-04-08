import type { AppState } from './app-state';
import type { ScheduledSession, ScheduledSessionStatus } from './scheduled-session';
import type { AdvisorId } from './advisor';

export type AccountTier = 'free' | 'premium' | 'admin';
export type ManagedAccountTier = Exclude<AccountTier, 'admin'>;

export interface UserProfile {
  displayName: string | null;
  schedulingEnabled: boolean;
  googleCalendarConnected: boolean;
  googleCalendarEmail: string | null;
  accountTier: AccountTier;
}

export interface ApiError {
  error: string;
  code?: string;
  requestId?: string;
  status?: number;
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

export interface UpdateUserProfileInput {
  displayName?: string | null;
  schedulingEnabled?: boolean;
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

export interface AdminUserSummary {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  accountTier: AccountTier;
  createdAt: string;
}

export interface UpdateAdminUserTierInput {
  accountTier: ManagedAccountTier;
}
