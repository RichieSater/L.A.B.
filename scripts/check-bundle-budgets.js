#!/usr/bin/env node

import path from 'node:path';
import process from 'node:process';
import {
  evaluateBundleBudgets,
  formatBudgetReport,
  loadManifest,
} from './bundle-budgets.js';

const outDir = path.resolve(process.cwd(), 'dist');
const manifestPath = path.join(outDir, '.vite', 'manifest.json');

const manifest = loadManifest(manifestPath);
const evaluation = evaluateBundleBudgets({
  manifest,
  outDir,
});

console.log(formatBudgetReport(evaluation));

if (evaluation.failures.length > 0) {
  process.exit(1);
}
