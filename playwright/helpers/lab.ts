import { expect, type Page } from '@playwright/test';

interface BootstrapPayload {
  scheduledSessions: Array<{ id: string }>;
}

interface ScheduledSessionPayload {
  id: string;
  scheduledAt: string;
}

interface ResetResponse {
  success: boolean;
}

interface JsonRequestOptions {
  path: string;
  method?: 'GET' | 'POST';
  body?: unknown;
}

async function requestJson<T>(page: Page, options: JsonRequestOptions): Promise<T> {
  return page.evaluate(async ({ path, method, body }) => {
    const response = await fetch(path, {
      method: method ?? 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    return text ? JSON.parse(text) : null;
  }, options);
}

export async function waitForLabReady(page: Page): Promise<void> {
  await expect(page.getByRole('heading', { name: 'The System' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Open Quantum Planner' })).toBeVisible({ timeout: 15000 });
}

export async function getBootstrap(page: Page): Promise<BootstrapPayload> {
  return requestJson<BootstrapPayload>(page, {
    path: '/api/bootstrap',
  });
}

export async function createScheduledSession(
  page: Page,
  scheduledAt: string,
  advisorId = 'career',
): Promise<ScheduledSessionPayload> {
  return requestJson<ScheduledSessionPayload>(page, {
    path: '/api/scheduled-sessions',
    method: 'POST',
    body: {
      advisorId,
      scheduledAt,
    },
  });
}

export async function resetLabData(page: Page): Promise<void> {
  const payload = await requestJson<ResetResponse>(page, {
    path: '/api/reset-user-data',
    method: 'POST',
  });

  if (!payload.success) {
    throw new Error('Expected reset-user-data to return success.');
  }
}
