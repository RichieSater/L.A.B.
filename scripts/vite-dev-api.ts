import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';

type QueryValue = string | string[];

type QueryRecord = Record<string, QueryValue>;

interface ResolvedApiRoute {
  modulePath: string;
  params: Record<string, string>;
}

interface DevApiRequest extends IncomingMessage {
  body?: string;
  cookies: Record<string, string>;
  query: QueryRecord;
}

interface DevApiResponse extends ServerResponse<IncomingMessage> {
  json: (body: unknown) => DevApiResponse;
  redirect: (statusOrUrl: number | string, url?: string) => DevApiResponse;
  send: (body: unknown) => DevApiResponse;
  status: (code: number) => DevApiResponse;
}

export function resolveDevApiRoute(pathname: string, routeFiles: string[]): ResolvedApiRoute | null {
  if (pathname !== '/api' && !pathname.startsWith('/api/')) {
    return null;
  }

  const requestSegments = pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(segment => decodeURIComponent(segment));

  let bestMatch: (ResolvedApiRoute & { score: number }) | null = null;

  for (const routeFile of routeFiles) {
    const routeSegments = routeFileToSegments(routeFile);

    if (routeSegments.length !== requestSegments.length) {
      continue;
    }

    const params: Record<string, string> = {};
    let matched = true;
    let score = routeFile.endsWith('/index.ts') ? 0 : 1;

    for (let index = 0; index < routeSegments.length; index += 1) {
      const routeSegment = routeSegments[index];
      const requestSegment = requestSegments[index];

      if (!routeSegment || !requestSegment) {
        matched = false;
        break;
      }

      if (isDynamicSegment(routeSegment)) {
        params[routeSegment.slice(1, -1)] = requestSegment;
        continue;
      }

      if (routeSegment !== requestSegment) {
        matched = false;
        break;
      }

      score += 10;
    }

    if (!matched) {
      continue;
    }

    const nextMatch = {
      modulePath: `/${normalizePath(path.join('api', routeFile))}`,
      params,
      score,
    };

    if (!bestMatch || nextMatch.score > bestMatch.score) {
      bestMatch = nextMatch;
    }
  }

  if (!bestMatch) {
    return null;
  }

  return {
    modulePath: bestMatch.modulePath,
    params: bestMatch.params,
  };
}

export function mergeDevApiQuery(url: URL, params: Record<string, string>): QueryRecord {
  const query: QueryRecord = {};

  const append = (key: string, value: string) => {
    const existing = query[key];

    if (existing === undefined) {
      query[key] = value;
      return;
    }

    if (Array.isArray(existing)) {
      existing.push(value);
      return;
    }

    query[key] = [existing, value];
  };

  for (const [key, value] of url.searchParams.entries()) {
    append(key, value);
  }

  for (const [key, value] of Object.entries(params)) {
    append(key, value);
  }

  return query;
}

export function viteDevApiPlugin(): Plugin {
  return {
    name: 'lab-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleDevApiRequest(server, req, res, next);
      });
    },
  };
}

async function handleDevApiRequest(
  server: ViteDevServer,
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  next: (error?: unknown) => void,
): Promise<void> {
  const requestUrl = req.url;

  if (!requestUrl) {
    next();
    return;
  }

  const url = new URL(requestUrl, `http://${req.headers.host ?? 'localhost'}`);
  const routeFiles = collectApiRouteFiles(path.join(server.config.root, 'api'));
  const resolvedRoute = resolveDevApiRoute(url.pathname, routeFiles);

  if (!resolvedRoute) {
    next();
    return;
  }

  try {
    const body = await readBody(req);
    const devReq = decorateRequest(req, url, resolvedRoute.params, body);
    const devRes = decorateResponse(res);
    const module = await server.ssrLoadModule(resolvedRoute.modulePath);
    const handler = module.default;

    if (typeof handler !== 'function') {
      throw new Error(`API handler ${resolvedRoute.modulePath} does not export a default function.`);
    }

    await handler(devReq, devRes);

    if (!res.writableEnded) {
      devRes.status(204).send('');
    }
  } catch (error) {
    if (error instanceof Error) {
      server.ssrFixStacktrace(error);
    }

    const message = error instanceof Error ? error.message : 'Unknown dev API error.';

    if (!res.writableEnded) {
      decorateResponse(res)
        .status(500)
        .json({ error: message, code: 'DEV_API_FAILED' });
      return;
    }

    next(error);
  }
}

function decorateRequest(
  req: IncomingMessage,
  url: URL,
  params: Record<string, string>,
  body: string | undefined,
): DevApiRequest {
  const headers = req.headers as Record<string, string | string[] | undefined>;

  if (!headers['x-forwarded-proto']) {
    headers['x-forwarded-proto'] = 'http';
  }

  const devReq = req as DevApiRequest;
  devReq.body = body;
  devReq.cookies = parseCookies(headers.cookie);
  devReq.query = mergeDevApiQuery(url, params);
  return devReq;
}

function decorateResponse(res: ServerResponse<IncomingMessage>): DevApiResponse {
  const devRes = res as DevApiResponse;

  devRes.status = (code: number) => {
    res.statusCode = code;
    return devRes;
  };

  devRes.send = (body: unknown) => {
    if (res.writableEnded) {
      return devRes;
    }

    if (body === undefined || body === null) {
      res.end(body ?? '');
      return devRes;
    }

    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
      res.end(body);
      return devRes;
    }

    if (typeof body === 'object') {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }

      res.end(JSON.stringify(body));
      return devRes;
    }

    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }

    res.end(String(body));
    return devRes;
  };

  devRes.json = (body: unknown) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    res.end(JSON.stringify(body));
    return devRes;
  };

  devRes.redirect = (statusOrUrl: number | string, maybeUrl?: string) => {
    const status = typeof statusOrUrl === 'number' ? statusOrUrl : 302;
    const location = typeof statusOrUrl === 'string' ? statusOrUrl : maybeUrl;

    if (!location) {
      throw new Error('Redirect location is required.');
    }

    res.statusCode = status;
    res.setHeader('Location', location);
    res.end();
    return devRes;
  };

  return devRes;
}

function collectApiRouteFiles(apiDir: string, prefix = ''): string[] {
  if (!fs.existsSync(apiDir)) {
    return [];
  }

  const routeFiles: string[] = [];
  const entries = fs.readdirSync(apiDir, { withFileTypes: true });

  for (const entry of entries) {
    const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
    const fullPath = path.join(apiDir, entry.name);

    if (entry.isDirectory()) {
      routeFiles.push(...collectApiRouteFiles(fullPath, nextPrefix));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      routeFiles.push(normalizePath(nextPrefix));
    }
  }

  return routeFiles;
}

function routeFileToSegments(routeFile: string): string[] {
  const segments = routeFile
    .replace(/\.ts$/, '')
    .split('/')
    .filter(Boolean);

  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }

  return segments;
}

function isDynamicSegment(segment: string): boolean {
  return segment.startsWith('[') && segment.endsWith(']');
}

async function readBody(req: IncomingMessage): Promise<string | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  if (chunks.length === 0) {
    return undefined;
  }

  return Buffer.concat(chunks).toString('utf8');
}

function parseCookies(cookieHeader: string | string[] | undefined): Record<string, string> {
  const rawCookie = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;

  if (!rawCookie) {
    return {};
  }

  return rawCookie.split(';').reduce<Record<string, string>>((cookies, pair) => {
    const separatorIndex = pair.indexOf('=');

    if (separatorIndex === -1) {
      return cookies;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (key) {
      cookies[key] = decodeURIComponent(value);
    }

    return cookies;
  }, {});
}
