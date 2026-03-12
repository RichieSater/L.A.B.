import type { AppState } from '../types/app-state';
import type {
  BootstrapResponse,
  CreateScheduledSessionInput,
  GoogleCalendarConnection,
  UpdateScheduledSessionInput,
  UserProfile,
} from '../types/api';
import type { ScheduledSession } from '../types/scheduled-session';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  return parseJsonResponse<T>(response);
}

export const apiClient = {
  getBootstrap(): Promise<BootstrapResponse> {
    return request<BootstrapResponse>('/api/bootstrap');
  },

  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    return request<UserProfile>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  saveAppState(appState: AppState): Promise<void> {
    return request<void>('/api/app-state', {
      method: 'PUT',
      body: JSON.stringify({ appState }),
    });
  },

  listScheduledSessions(): Promise<ScheduledSession[]> {
    return request<ScheduledSession[]>('/api/scheduled-sessions');
  },

  createScheduledSession(input: CreateScheduledSessionInput): Promise<ScheduledSession> {
    return request<ScheduledSession>('/api/scheduled-sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateScheduledSession(id: string, input: UpdateScheduledSessionInput): Promise<ScheduledSession | null> {
    return request<ScheduledSession | null>(`/api/scheduled-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  disconnectGoogleCalendar(): Promise<UserProfile> {
    return request<UserProfile>('/api/google-calendar/connection', {
      method: 'DELETE',
    });
  },

  getGoogleCalendarConnection(): Promise<GoogleCalendarConnection> {
    return request<GoogleCalendarConnection>('/api/google-calendar/connection');
  },
};
