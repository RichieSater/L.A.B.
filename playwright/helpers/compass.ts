import { expect, type ConsoleMessage, type Page, type Response } from '@playwright/test';
import { QUANTUM_PLANNER_PATH } from '../../src/constants/routes';
import { getAllCompassScreens } from '../../src/lib/compass-flow';
import { getCompassScreenIndex, getCompassTestAnswerRecord } from '../../src/testing/compass-test-data';
import type { CompassPromptDefinition } from '../../src/types/compass';

type CompassScreen = ReturnType<typeof getAllCompassScreens>[number];

interface CompassAudit {
  apiFailures: string[];
  consoleErrors: string[];
  pageErrors: string[];
  stop: () => void;
}

const COMPASS_SCREENS = getAllCompassScreens();
const IGNORED_CONSOLE_ERROR_PATTERNS = [
  /Failed to load resource: the server responded with a status of 404 \(Not Found\)/,
  /Failed to save app state: TypeError: Failed to fetch/,
];

export function startCompassAudit(page: Page): CompassAudit {
  const apiFailures: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const handleResponse = (response: Response) => {
    if (!response.url().includes('/api/')) {
      return;
    }

    if (response.ok()) {
      return;
    }

    apiFailures.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  };

  const handleConsole = (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      const text = message.text();
      if (IGNORED_CONSOLE_ERROR_PATTERNS.some(pattern => pattern.test(text))) {
        return;
      }

      consoleErrors.push(text);
    }
  };

  const handlePageError = (error: Error) => {
    pageErrors.push(error.message);
  };

  page.on('response', handleResponse);
  page.on('console', handleConsole);
  page.on('pageerror', handlePageError);

  return {
    apiFailures,
    consoleErrors,
    pageErrors,
    stop: () => {
      page.off('response', handleResponse);
      page.off('console', handleConsole);
      page.off('pageerror', handlePageError);
    },
  };
}

export async function assertCompassAuditClean(audit: CompassAudit) {
  expect(audit.consoleErrors).toEqual([]);
  expect(audit.pageErrors).toEqual([]);
  expect(audit.apiFailures).toEqual([]);
}

export async function openGoldenCompassFromModuleHub(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The System' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Golden Compass' }).click();
  await expect(page.getByText('Recalibrate the year before you plan the week')).toBeVisible();
}

export async function createCompassSessionFromDashboard(page: Page): Promise<string> {
  const createButton = page.getByRole('button', { name: 'New Compass' });
  await expect(createButton).toBeVisible();
  await createButton.click();
  await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/golden-compass\/[^/]+$/);

  const sessionId = page.url().split('/').pop();
  if (!sessionId) {
    throw new Error('Expected Compass session id in the current URL.');
  }

  return sessionId;
}

export async function advanceCompassUntilScreen(
  page: Page,
  targetScreenId: string,
  startAtScreenId = COMPASS_SCREENS[0]?.id,
) {
  const startIndex = getCompassScreenIndex(startAtScreenId);
  const targetIndex = getCompassScreenIndex(targetScreenId);

  for (let index = startIndex; index < targetIndex; index += 1) {
    const screen = COMPASS_SCREENS[index];
    await expectCompassScreen(page, screen);
    await fillCompassScreen(page, screen);
    await continueFromScreen(page, index);
  }

  await expectCompassScreen(page, COMPASS_SCREENS[targetIndex]);
}

export async function completeCompassFromScreen(page: Page, startAtScreenId: string) {
  const startIndex = getCompassScreenIndex(startAtScreenId);

  for (let index = startIndex; index < COMPASS_SCREENS.length; index += 1) {
    const screen = COMPASS_SCREENS[index];
    await expectCompassScreen(page, screen);
    await fillCompassScreen(page, screen);
    await continueFromScreen(page, index);
  }
}

export async function resumeCompassFromPlanner(page: Page) {
  await page.goto(QUANTUM_PLANNER_PATH);
  const resumeButton = page.getByRole('button', { name: 'Resume Compass' });
  await expect(resumeButton).toBeVisible();
  await resumeButton.click();
}

async function expectCompassScreen(page: Page, screen: CompassScreen) {
  const primaryPrompt = screen.prompts?.[0];

  if (primaryPrompt) {
    await expect(page.getByRole('heading', { name: primaryPrompt.label })).toBeVisible();
    return;
  }

  const primaryCopy = screen.headline ?? screen.sectionTitle;
  await expect(page.getByText(primaryCopy, { exact: true }).first()).toBeVisible();
}

async function fillCompassScreen(page: Page, screen: CompassScreen) {
  const answers = getCompassTestAnswerRecord(screen.id);

  if (screen.id === 'past-monthly-events') {
    const monthEntries = Object.entries(answers)
      .filter(([key]) => /^month\d+$/.test(key))
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

    const addButtons = page.getByRole('button', { name: /Add event for / });

    for (const [index, [, value]] of monthEntries.entries()) {
      const items = parseItems(value);
      if (items.length === 0) {
        continue;
      }

      const addButton = addButtons.nth(index);
      const addButtonName = await addButton.getAttribute('aria-label');
      const monthName = addButtonName?.replace('Add event for ', '');

      if (!monthName) {
        continue;
      }

      const firstInput = page.getByRole('textbox', { name: `${monthName} event 1` });
      await firstInput.scrollIntoViewIfNeeded();
      await firstInput.fill(items[0] ?? '');

      for (let itemIndex = 1; itemIndex < items.length; itemIndex += 1) {
        await addButton.scrollIntoViewIfNeeded();
        await addButton.click();
        const nextInput = page.getByRole('textbox', { name: `${monthName} event ${itemIndex + 1}` });
        await nextInput.scrollIntoViewIfNeeded();
        await nextInput.fill(items[itemIndex] ?? '');
      }
    }

    return;
  }

  for (const prompt of screen.prompts ?? []) {
    await fillCompassPrompt(page, prompt, answers);
  }
}

async function fillCompassPrompt(
  page: Page,
  prompt: CompassPromptDefinition,
  answers: Record<string, string>,
) {
  switch (prompt.type) {
    case 'checklist':
      for (const item of prompt.checklistItems ?? []) {
        const checkbox = page.getByLabel(item.label);
        await expect(checkbox).toBeVisible();
        await checkbox.check();
      }
      return;
    case 'short-text': {
      const input = page.getByRole('textbox', { name: prompt.label });
      await input.scrollIntoViewIfNeeded();
      await input.fill(answers[prompt.key] ?? '');
      return;
    }
    case 'textarea': {
      const input = page.getByRole('textbox', { name: prompt.label });
      await input.scrollIntoViewIfNeeded();
      await input.fill(answers[prompt.key] ?? '');
      return;
    }
    case 'multi-short-text':
    case 'multi-textarea': {
      for (const inputDefinition of prompt.inputs ?? []) {
        const fieldLabel = inputDefinition.label ?? inputDefinition.placeholder;
        if (!fieldLabel) {
          continue;
        }

        const field = page.getByLabel(fieldLabel);
        await field.scrollIntoViewIfNeeded();
        await field.fill(answers[inputDefinition.key] ?? '');
      }
      return;
    }
    case 'multi-input': {
      const items = parseItems(answers[prompt.key]);

      for (let index = 0; index < items.length; index += 1) {
        let input = page.getByRole('textbox', { name: `${prompt.label} ${index + 1}` });

        if ((await input.count()) === 0) {
          const addItemButton = page.getByRole('button', { name: `Add item for ${prompt.label}` });
          await addItemButton.scrollIntoViewIfNeeded();
          await addItemButton.click();
          input = page.getByRole('textbox', { name: `${prompt.label} ${index + 1}` });
        }

        await input.scrollIntoViewIfNeeded();
        await input.fill(items[index]);
      }
      return;
    }
    case 'signature': {
      const nameInput = page.getByRole('textbox', { name: 'Your name' });
      const signatureInput = page.getByRole('textbox', { name: 'Your signature' });

      await nameInput.scrollIntoViewIfNeeded();
      await nameInput.fill(answers.name ?? '');
      await signatureInput.scrollIntoViewIfNeeded();
      await signatureInput.fill(answers.signature ?? '');
      return;
    }
    default:
      return;
  }
}

function parseItems(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
  } catch {
    return [];
  }
}

async function continueFromScreen(page: Page, screenIndex: number) {
  const isLastScreen = screenIndex === COMPASS_SCREENS.length - 1;
  const button = page.getByRole('button', {
    name: isLastScreen ? 'Complete Compass' : 'Continue',
  });

  await button.scrollIntoViewIfNeeded();
  await button.click();
}
