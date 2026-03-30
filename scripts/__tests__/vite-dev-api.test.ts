// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { mergeDevApiQuery, resolveDevApiRoute } from '../vite-dev-api';

describe('resolveDevApiRoute', () => {
  it('maps exact API files to their module path', () => {
    expect(resolveDevApiRoute('/api/bootstrap', ['bootstrap.ts'])).toEqual({
      modulePath: '/api/bootstrap.ts',
      params: {},
    });
  });

  it('maps index handlers for collection routes', () => {
    expect(resolveDevApiRoute('/api/scheduled-sessions', ['scheduled-sessions/index.ts'])).toEqual({
      modulePath: '/api/scheduled-sessions/index.ts',
      params: {},
    });
  });

  it('maps dynamic handlers and exposes route params', () => {
    expect(resolveDevApiRoute('/api/scheduled-sessions/session-123', ['scheduled-sessions/[id].ts'])).toEqual({
      modulePath: '/api/scheduled-sessions/[id].ts',
      params: { id: 'session-123' },
    });
  });

  it('prefers exact matches over dynamic matches when both fit', () => {
    expect(resolveDevApiRoute('/api/google-calendar/connection', [
      'google-calendar/[id].ts',
      'google-calendar/connection.ts',
    ])).toEqual({
      modulePath: '/api/google-calendar/connection.ts',
      params: {},
    });
  });
});

describe('mergeDevApiQuery', () => {
  it('combines search params with dynamic route params', () => {
    const url = new URL('http://localhost/api/scheduled-sessions/session-123?tag=one&tag=two');

    expect(mergeDevApiQuery(url, { id: 'session-123' })).toEqual({
      id: 'session-123',
      tag: ['one', 'two'],
    });
  });
});
