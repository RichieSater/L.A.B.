import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireUser = vi.fn();
const buildBootstrapResponse = vi.fn();
const json = vi.fn((_res, _status, body) => body);
const methodNotAllowed = vi.fn();

vi.mock('../../server/auth', () => ({
  requireUser,
}));

vi.mock('../../server/data', () => ({
  buildBootstrapResponse,
}));

vi.mock('../../server/http', () => ({
  json,
  methodNotAllowed,
}));

describe('/api/bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a structured 500 error when bootstrap fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    const handler = (await import('../bootstrap')).default;

    requireUser.mockResolvedValue({ userId: 'user_123' });
    buildBootstrapResponse.mockRejectedValue(new Error('database down'));

    const req = {
      method: 'GET',
      headers: {
        'x-vercel-id': 'iad1::request-123',
      },
    } as never;
    const res = {} as never;

    await handler(req, res);

    expect(json).toHaveBeenLastCalledWith(res, 500, {
      error: 'A server error has occurred',
      code: 'BOOTSTRAP_FAILED',
      requestId: 'iad1::request-123',
    });

    consoleError.mockRestore();
    consoleInfo.mockRestore();
  });
});
