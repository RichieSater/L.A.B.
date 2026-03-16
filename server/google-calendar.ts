import { env } from './env.js';

const GOOGLE_AUTH_BASE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

function getRedirectUri(): string | null {
  if (!env.appUrl) {
    return null;
  }

  return `${env.appUrl.replace(/\/$/, '')}/api/google-calendar/callback`;
}

function requireGoogleConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const redirectUri = getRedirectUri();
  if (!env.googleClientId || !env.googleClientSecret || !redirectUri) {
    return null;
  }

  return {
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri,
  };
}

async function getAccessToken(refreshToken: string): Promise<string> {
  const config = requireGoogleConfig();
  if (!config) {
    throw new Error('Google Calendar is not configured.');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Google Calendar access token.');
  }

  const data = await response.json() as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Missing Google Calendar access token.');
  }

  return data.access_token;
}

export function isGoogleCalendarConfigured(): boolean {
  return !!requireGoogleConfig();
}

export function getGoogleCalendarAuthUrl(state: string): string | null {
  const config = requireGoogleConfig();
  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state,
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  });

  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeGoogleCalendarCode(code: string): Promise<{
  refreshToken: string;
  email: string | null;
}> {
  const config = requireGoogleConfig();
  if (!config) {
    throw new Error('Google Calendar is not configured.');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange Google Calendar authorization code.');
  }

  const data = await response.json() as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!data.access_token || !data.refresh_token) {
    throw new Error('Google Calendar did not return the required tokens.');
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${data.access_token}`,
    },
  });

  const userInfo = userInfoResponse.ok
    ? await userInfoResponse.json() as { email?: string }
    : { email: null };

  return {
    refreshToken: data.refresh_token,
    email: userInfo.email ?? null,
  };
}

export async function upsertCalendarEvent(input: {
  refreshToken: string;
  eventId?: string | null;
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
}): Promise<string> {
  const accessToken = await getAccessToken(input.refreshToken);
  const response = await fetch(
    input.eventId ? `${GOOGLE_CALENDAR_BASE}/${input.eventId}` : GOOGLE_CALENDAR_BASE,
    {
      method: input.eventId ? 'PUT' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Failed to sync Google Calendar event.');
  }

  const data = await response.json() as { id?: string };
  if (!data.id) {
    throw new Error('Google Calendar event response did not include an ID.');
  }

  return data.id;
}

export async function deleteCalendarEvent(refreshToken: string, eventId: string): Promise<void> {
  const accessToken = await getAccessToken(refreshToken);
  const response = await fetch(`${GOOGLE_CALENDAR_BASE}/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to delete Google Calendar event.');
  }
}
