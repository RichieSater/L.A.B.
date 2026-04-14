// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CANONICAL_PRODUCTION_URL = 'https://lab-three-alpha.vercel.app/';
const CANONICAL_PRODUCTION_ALIAS = 'lab-three-alpha.vercel.app';

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('LAB deploy policy', () => {
  it('keeps repo instructions locked to the canonical production URL', () => {
    const policyFiles = [
      'README.md',
      'docs/agent/index.md',
      'docs/agent/current-state.md',
      'docs/agent/workflows.md',
    ];

    for (const relativePath of policyFiles) {
      expect(readRepoFile(relativePath)).toContain(CANONICAL_PRODUCTION_URL);
    }
  });

  it('keeps deploy.sh production-only and free of preview fallbacks', () => {
    const deployScript = readRepoFile('deploy.sh');

    expect(deployScript).toContain(CANONICAL_PRODUCTION_ALIAS);
    expect(deployScript).toContain(CANONICAL_PRODUCTION_URL);
    expect(deployScript).toContain('Production-only deploy blocked');
    expect(deployScript).toContain('This script takes no arguments.');

    for (const forbidden of [
      'claim-deployment',
      'skill-deploy',
      'npx vercel --prod',
      'Preview URL:',
      'Claim URL:',
    ]) {
      expect(deployScript).not.toContain(forbidden);
    }
  });

  it('keeps repo-root preflight aligned with the same production-only URL', () => {
    const preflightScript = readRepoFile('scripts/verify-lab-root.sh');

    expect(preflightScript).toContain(CANONICAL_PRODUCTION_ALIAS);
    expect(preflightScript).toContain(CANONICAL_PRODUCTION_URL);
    expect(preflightScript).toContain('non-production deploys are invalid for LAB');
  });
});
