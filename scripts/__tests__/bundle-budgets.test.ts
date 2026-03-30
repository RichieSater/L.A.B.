import { describe, expect, it } from 'vitest';
import { bundleBudgets, evaluateBundleBudgets, formatBudgetReport } from '../bundle-budgets.js';

const manifest = {
  'index.html': {
    file: 'assets/index-abc123.js',
    isEntry: true,
    name: 'index',
  },
  '_router-def456.js': {
    file: 'assets/router-def456.js',
    name: 'router',
  },
  '_clerk-ghi789.js': {
    file: 'assets/clerk-ghi789.js',
    name: 'clerk',
  },
  '_react-vendor-jkl012.js': {
    file: 'assets/react-vendor-jkl012.js',
    name: 'react-vendor',
  },
};

describe('evaluateBundleBudgets', () => {
  it('passes when all tracked chunks stay within budget', () => {
    const { failures, results } = evaluateBundleBudgets({
      manifest,
      outDir: '/tmp/dist',
      statSync(filePath) {
        const sizeMap = {
          '/tmp/dist/assets/index-abc123.js': { size: 11 * 1024 },
          '/tmp/dist/assets/router-def456.js': { size: 40 * 1024 },
          '/tmp/dist/assets/clerk-ghi789.js': { size: 80 * 1024 },
          '/tmp/dist/assets/react-vendor-jkl012.js': { size: 200 * 1024 },
        };

        return sizeMap[filePath as keyof typeof sizeMap];
      },
    });

    expect(failures).toEqual([]);
    expect(results).toHaveLength(bundleBudgets.length);
    expect(results.every(result => result.passed)).toBe(true);
  });

  it('fails when a tracked chunk exceeds its budget', () => {
    const evaluation = evaluateBundleBudgets({
      manifest,
      outDir: '/tmp/dist',
      statSync(filePath) {
        const sizeMap = {
          '/tmp/dist/assets/index-abc123.js': { size: 11 * 1024 },
          '/tmp/dist/assets/router-def456.js': { size: 40 * 1024 },
          '/tmp/dist/assets/clerk-ghi789.js': { size: 86 * 1024 },
          '/tmp/dist/assets/react-vendor-jkl012.js': { size: 200 * 1024 },
        };

        return sizeMap[filePath as keyof typeof sizeMap];
      },
    });

    expect(evaluation.failures).toEqual([
      'clerk: 86.00 kB exceeds 85.00 kB (assets/clerk-ghi789.js).',
    ]);
    expect(formatBudgetReport(evaluation)).toContain('FAIL clerk: 86.00 kB / 85.00 kB');
  });

  it('fails when a tracked chunk is missing from the manifest', () => {
    const manifestWithoutReactVendor = Object.fromEntries(
      Object.entries(manifest).filter(([key]) => key !== '_react-vendor-jkl012.js'),
    );

    const { failures } = evaluateBundleBudgets({
      manifest: manifestWithoutReactVendor,
      outDir: '/tmp/dist',
      statSync() {
        return { size: 0 };
      },
    });

    expect(failures).toContain('react-vendor: no matching chunk found in build manifest.');
  });
});
