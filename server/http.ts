import type { VercelRequest, VercelResponse } from '@vercel/node';

export function methodNotAllowed(res: VercelResponse, methods: string[]): VercelResponse {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Allow', methods.join(', '));
  return res.status(405).send(`Method not allowed. Allowed methods: ${methods.join(', ')}`);
}

export function json(res: VercelResponse, status: number, body: unknown): VercelResponse {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return res.status(status).json(body);
}

export function absoluteUrl(req: VercelRequest): string {
  const host = req.headers.host ?? 'localhost:3000';
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader ?? 'https';
  const url = req.url ?? '/';
  return `${protocol}://${host}${url}`;
}

export function toRequest(req: VercelRequest): Request {
  return new Request(absoluteUrl(req), {
    method: req.method,
    headers: new Headers(req.headers as Record<string, string>),
  });
}

export function readJsonBody<T>(req: VercelRequest): T {
  if (req.body == null) {
    return {} as T;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }

  return req.body as T;
}
