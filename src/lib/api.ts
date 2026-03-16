import type { AppState } from '../types/app-state';
import type {
  ApiError,
  BootstrapResponse,
  CreateScheduledSessionInput,
  GoogleCalendarConnection,
  UpdateScheduledSessionInput,
  UserProfile,
} from '../types/api';
import type { ScheduledSession } from '../types/scheduled-session';

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
};

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
