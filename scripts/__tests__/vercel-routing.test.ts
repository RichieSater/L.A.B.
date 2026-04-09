// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface RewriteRule {
  source: string;
  destination: string;
}

function walkFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function loadRewrites(): RewriteRule[] {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  const raw = fs.readFileSync(vercelConfigPath, 'utf8');
  const parsed = JSON.parse(raw) as { rewrites?: RewriteRule[] };
  return parsed.rewrites ?? [];
}

function expectedDynamicApiRewrites(): RewriteRule[] {
  const apiRoot = path.join(process.cwd(), 'api');
  const routeFiles = walkFiles(apiRoot)
    .map(filePath => path.relative(apiRoot, filePath).replaceAll(path.sep, '/'))
    .filter(relativePath => relativePath.endsWith('/[id].ts'));

  return routeFiles.map(relativePath => {
    const routePrefix = relativePath.slice(0, -'/[id].ts'.length);

    return {
      source: `/api/${routePrefix}/:id`,
      destination: `/api/${routePrefix}/[id]?id=:id`,
    };
  });
}

describe('vercel.json dynamic API rewrites', () => {
  it('routes all dynamic API handlers before the generic API and SPA fallbacks', () => {
    const rewrites = loadRewrites();
    const expectedDynamicRewrites = expectedDynamicApiRewrites();
    const apiCatchAllIndex = rewrites.findIndex(
      rule => rule.source === '/api/:path*' && rule.destination === '/api/:path*',
    );
    const spaCatchAllIndex = rewrites.findIndex(
      rule => rule.source === '/:path*' && rule.destination === '/index.html',
    );

    expect(apiCatchAllIndex).toBeGreaterThan(-1);
    expect(spaCatchAllIndex).toBeGreaterThan(-1);

    for (const expected of expectedDynamicRewrites) {
      const rewriteIndex = rewrites.findIndex(
        rule =>
          rule.source === expected.source
          && rule.destination === expected.destination,
      );

      expect(rewriteIndex).toBeGreaterThan(-1);
      expect(rewriteIndex).toBeLessThan(apiCatchAllIndex);
      expect(rewriteIndex).toBeLessThan(spaCatchAllIndex);
    }
  });
});
