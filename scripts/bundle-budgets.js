import fs from 'node:fs';
import path from 'node:path';

export const bundleBudgets = [
  {
    label: 'entry',
    budgetKb: 12,
    select: chunk =>
      chunk.isEntry === true &&
      chunk.file.startsWith('assets/index-') &&
      chunk.file.endsWith('.js'),
  },
  {
    label: 'router',
    budgetKb: 45,
    select: chunk => chunk.name === 'router' && chunk.file.endsWith('.js'),
  },
  {
    label: 'clerk',
    budgetKb: 85,
    select: chunk => chunk.name === 'clerk' && chunk.file.endsWith('.js'),
  },
  {
    label: 'react-vendor',
    budgetKb: 205,
    select: chunk => chunk.name === 'react-vendor' && chunk.file.endsWith('.js'),
  },
];

export function loadManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

export function evaluateBundleBudgets({
  budgets = bundleBudgets,
  manifest,
  outDir,
  statSync = fs.statSync,
}) {
  const manifestEntries = Object.entries(manifest);
  const results = [];
  const failures = [];

  for (const budget of budgets) {
    const matches = manifestEntries.filter(([, chunk]) => chunk && budget.select(chunk));

    if (matches.length === 0) {
      failures.push(`${budget.label}: no matching chunk found in build manifest.`);
      continue;
    }

    if (matches.length > 1) {
      failures.push(
        `${budget.label}: expected one chunk but found ${matches.length} (${matches
          .map(([, chunk]) => chunk.file)
          .join(', ')}).`,
      );
      continue;
    }

    const [, chunk] = matches[0];
    const filePath = path.join(outDir, chunk.file);
    const sizeBytes = statSync(filePath).size;
    const budgetBytes = budget.budgetKb * 1024;

    results.push({
      label: budget.label,
      file: chunk.file,
      sizeBytes,
      budgetBytes,
      passed: sizeBytes <= budgetBytes,
    });

    if (sizeBytes > budgetBytes) {
      failures.push(
        `${budget.label}: ${formatKb(sizeBytes)} exceeds ${formatKb(budgetBytes)} (${chunk.file}).`,
      );
    }
  }

  return { results, failures };
}

export function formatBudgetReport({ results, failures }) {
  const lines = ['Bundle budgets:'];

  for (const result of results) {
    lines.push(
      `- ${result.passed ? 'PASS' : 'FAIL'} ${result.label}: ${formatKb(result.sizeBytes)} / ${formatKb(result.budgetBytes)} (${result.file})`,
    );
  }

  if (failures.length > 0) {
    lines.push('Budget failures:');

    for (const failure of failures) {
      lines.push(`- ${failure}`);
    }
  }

  return lines.join('\n');
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(2)} kB`;
}
