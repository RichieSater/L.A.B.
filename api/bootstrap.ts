import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { requireUser } from '../server/auth.js';
import { buildBootstrapResponse } from '../server/data.js';
import { json, methodNotAllowed } from '../server/http.js';

function getRequestId(req: VercelRequest): string {
  const vercelId = req.headers['x-vercel-id'];

  if (Array.isArray(vercelId)) {
    return vercelId[0] ?? randomUUID();
  }

  return vercelId ?? randomUUID();
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, ['GET']);
  }

  const requestId = getRequestId(req);
  let phase = 'authenticate';
  let userId: string | null = null;

  try {
    console.info('[bootstrap] Request started.', { requestId, phase });
    const auth = await requireUser(req);

    if (!auth) {
      console.warn('[bootstrap] Unauthorized request.', { requestId });
      return json(res, 401, { error: 'Unauthorized', code: 'UNAUTHORIZED', requestId });
    }

    userId = auth.userId;
    phase = 'build';
    console.info('[bootstrap] Building response.', { requestId, userId });

    const payload = await buildBootstrapResponse(auth.userId);

    console.info('[bootstrap] Request succeeded.', { requestId, userId });
    return json(res, 200, payload);
  } catch (error) {
    console.error('[bootstrap] Request failed.', {
      requestId,
      userId,
      phase,
      error: error instanceof Error ? error.message : String(error),
    });

    return json(res, 500, {
      error: 'A server error has occurred',
      code: 'BOOTSTRAP_FAILED',
      requestId,
    });
  }
}
