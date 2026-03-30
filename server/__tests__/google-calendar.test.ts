import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

vi.mock('../env', () => ({
  env: {
    appUrl: 'http://localhost:5173',
    googleClientId: 'google-client-id',
    googleClientSecret: 'google-client-secret',
  },
}));

describe('deleteCalendarEvent', () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it('treats 410 Gone as an already-deleted event during cleanup', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'access-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 410,
      });

    const { deleteCalendarEvent } = await import('../google-calendar');

    await expect(deleteCalendarEvent('refresh-token', 'google-event-id')).resolves.toBeUndefined();
  });
});
