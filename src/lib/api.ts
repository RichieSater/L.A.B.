import type { AppState } from '../types/app-state';
import type {
  AdminUserSummary,
  ApiError,
  BootstrapResponse,
  CreateScheduledSessionInput,
  GoogleCalendarConnection,
  UpdateAdminUserTierInput,
  UpdateScheduledSessionInput,
  UpdateUserProfileInput,
  UserProfile,
} from '../types/api';
import type { ScheduledSession } from '../types/scheduled-session';
import type {
  CompassSessionDetail,
  CompassSessionSummary,
  CreateCompassSessionInput,
  UpdateCompassSessionInput,
} from '../types/compass';

export class ApiClientError extends Error implements ApiError {
  code?: string;
  requestId?: string;
  status?: number;
  error: string;

  constructor(payload: ApiError) {
    super(payload.error);
    this.name = 'ApiClientError';
    this.error = payload.error;
    this.code = payload.code;
    this.requestId = payload.requestId;
    this.status = payload.status;
  }
}

function isApiErrorPayload(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return typeof (value as ApiError).error === 'string';
}

async function parseErrorResponse(response: Response): Promise<ApiClientError> {
  const fallbackMessage = `Request failed with status ${response.status}`;
  const body = await response.text();

  if (!body) {
    return new ApiClientError({
      error: fallbackMessage,
      status: response.status,
    });
  }

  try {
    const parsed = JSON.parse(body) as unknown;

    if (isApiErrorPayload(parsed)) {
      return new ApiClientError({
        ...parsed,
        status: response.status,
      });
    }
  } catch {
    // Fall back to plain text response bodies.
  }

  return new ApiClientError({
    error: body,
    status: response.status,
  });
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await parseErrorResponse(response);
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

  updateProfile(updates: UpdateUserProfileInput): Promise<UserProfile> {
    return request<UserProfile>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  listAdminUsers(): Promise<AdminUserSummary[]> {
    return request<AdminUserSummary[]>('/api/admin/users');
  },

  updateAdminUserTier(userId: string, input: UpdateAdminUserTierInput): Promise<AdminUserSummary> {
    return request<AdminUserSummary>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  saveAppState(appState: AppState): Promise<void> {
    return request<void>('/api/app-state', {
      method: 'PUT',
      body: JSON.stringify({ appState }),
    });
  },

  resetUserData(): Promise<void> {
    return request<void>('/api/reset-user-data', {
      method: 'POST',
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

  listCompassSessions(): Promise<CompassSessionSummary[]> {
    return request<CompassSessionSummary[]>('/api/compass-sessions');
  },

  createCompassSession(input: CreateCompassSessionInput): Promise<CompassSessionDetail> {
    return request<CompassSessionDetail>('/api/compass-sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getCompassSession(id: string): Promise<CompassSessionDetail> {
    return request<CompassSessionDetail>(`/api/compass-sessions/${id}`);
  },

  updateCompassSession(id: string, input: UpdateCompassSessionInput): Promise<CompassSessionDetail> {
    return request<CompassSessionDetail>(`/api/compass-sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },
};

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
