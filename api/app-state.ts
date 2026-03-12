import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AppState } from '../src/types/app-state';
import { requireUser } from '../server/auth';
import { saveAppState } from '../server/data';
import { json, methodNotAllowed, readJsonBody } from '../server/http';

interface SaveAppStateBody {
  appState: AppState;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> {
  if (req.method !== 'PUT') {
    return methodNotAllowed(res, ['PUT']);
  }

  const auth = await requireUser(req);

  if (!auth) {
    return json(res, 401, { error: 'Unauthorized' });
  }

  const { appState } = readJsonBody<SaveAppStateBody>(req);
  await saveAppState(auth.userId, appState);
  return res.status(204).send('');
}
