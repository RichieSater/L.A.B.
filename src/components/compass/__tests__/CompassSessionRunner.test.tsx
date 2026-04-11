import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GOLDEN_COMPASS_PATH } from '../../../constants/routes';
import {
  COMPASS_TEST_INSIGHTS,
  COMPASS_TEST_SCREEN_VALUES,
  createCompassTestAnswers,
  createCompassTestSession,
  getCompassScreenIndex,
} from '../../../testing/compass-test-data';
import { CompassSessionRunner } from '../CompassSessionRunner';

const { apiClient, useAuth } = vi.hoisted(() => ({
  apiClient: {
    updateCompassSession: vi.fn(),
  },
  useAuth: vi.fn(),
}));

const { useNavigate } = vi.hoisted(() => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../../auth/auth-context', () => ({
  useAuth,
}));

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual<typeof import('../../../lib/api')>('../../../lib/api');
  return {
    ...actual,
    apiClient,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate,
  };
});

function renderRunner(initialSession = createCompassTestSession()) {
  render(
    <MemoryRouter>
      <CompassSessionRunner initialSession={initialSession} />
    </MemoryRouter>,
  );

  return initialSession;
}

describe('CompassSessionRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(vi.fn());
    useAuth.mockReturnValue({
      refreshBootstrap: vi.fn(),
    });
    apiClient.updateCompassSession.mockImplementation(async (sessionId: string, input: Record<string, unknown>) => {
      const status = input.status === 'completed' ? 'completed' : 'in_progress';

      return createCompassTestSession({
        id: sessionId,
        currentScreen: typeof input.currentScreen === 'number' ? input.currentScreen : 0,
        answers: (input.answers as ReturnType<typeof createCompassTestAnswers> | undefined) ?? createCompassTestAnswers(),
        status,
        insights: status === 'completed' ? COMPASS_TEST_INSIGHTS : null,
        completedAt: status === 'completed' ? '2026-04-11T12:20:00.000Z' : null,
      });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    {
      label: 'multi-input',
      screenId: 'bonfire-write',
      assertValues: () => {
        expect(screen.getByRole('textbox', { name: 'Compass item 1' })).toHaveValue(
          (COMPASS_TEST_SCREEN_VALUES['bonfire-write'] as string[])[0],
        );
      },
    },
    {
      label: 'textarea',
      screenId: 'past-proud',
      assertValues: () => {
        expect(screen.getByRole('textbox')).toHaveValue(
          String(COMPASS_TEST_SCREEN_VALUES['past-proud']),
        );
      },
    },
    {
      label: 'short-text',
      screenId: 'movie-title',
      assertValues: () => {
        expect(screen.getByRole('textbox')).toHaveValue(
          String(COMPASS_TEST_SCREEN_VALUES['movie-title']),
        );
      },
    },
    {
      label: 'multi-short-text',
      screenId: 'top-3-goals',
      assertValues: () => {
        expect(screen.getByDisplayValue(COMPASS_TEST_INSIGHTS.annualGoals[0])).toBeInTheDocument();
        expect(screen.getByDisplayValue(COMPASS_TEST_INSIGHTS.annualGoals[1])).toBeInTheDocument();
        expect(screen.getByDisplayValue(COMPASS_TEST_INSIGHTS.annualGoals[2])).toBeInTheDocument();
      },
    },
    {
      label: 'signature',
      screenId: 'final-commitment',
      assertValues: () => {
        expect(screen.getByPlaceholderText('Your name')).toHaveValue('Richie Sater');
        expect(screen.getByPlaceholderText('Type your signature or commitment line')).toHaveValue(
          'I choose this year on purpose and I am willing to act like it.',
        );
      },
    },
  ])('rehydrates saved answers for the $label screen type', ({ screenId, assertValues }) => {
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex(screenId),
      }),
    );

    assertValues();
  });

  it('gates progress until required multi-input answers exist and persists back/continue navigation', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('bonfire-write'),
      answers: {},
      answerCount: 0,
    });

    renderRunner(initialSession);

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Compass item 1' }), 'Clear the noise first');

    expect(continueButton).toBeEnabled();
    apiClient.updateCompassSession.mockClear();

    await user.click(continueButton);

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        currentScreen: getCompassScreenIndex('bonfire-complete'),
      });
    });
    expect(screen.getByText('Leave It Here')).toBeInTheDocument();

    await act(async () => {
      await new Promise(resolve => window.setTimeout(resolve, 950));
    });
    apiClient.updateCompassSession.mockClear();
    await user.click(screen.getByRole('button', { name: 'Back' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        currentScreen: getCompassScreenIndex('bonfire-write'),
      });
    });
    expect(screen.getByText("What's weighing on your mind right now?")).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('flushes pending autosave work before saving and exiting', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('past-proud'),
      answers: {},
      answerCount: 0,
    });

    renderRunner(initialSession);

    const proudAnswer = 'I am proud that I kept rebuilding instead of hiding.';
    await user.type(screen.getByRole('textbox'), proudAnswer);
    apiClient.updateCompassSession.mockClear();

    await user.click(screen.getByRole('button', { name: 'Save and Exit' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        answers: {
          'past-proud': {
            main: proudAnswer,
          },
        },
        currentScreen: getCompassScreenIndex('past-proud'),
      });
    });
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);

    await act(async () => {
      await new Promise(resolve => window.setTimeout(resolve, 1100));
    });
    expect(apiClient.updateCompassSession).toHaveBeenCalledTimes(1);
  });

  it('completes the Compass session, refreshes bootstrap, and shows the completion summary', async () => {
    const user = userEvent.setup();
    const refreshBootstrap = vi.fn();
    useAuth.mockReturnValue({
      refreshBootstrap,
    });

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('congratulations'),
    });

    renderRunner(initialSession);

    await user.click(screen.getByRole('button', { name: 'Complete Compass' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        answers: initialSession.answers,
        currentScreen: getCompassScreenIndex('congratulations'),
        status: 'completed',
      });
    });
    expect(refreshBootstrap).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Compass Completed')).toBeInTheDocument();
    expect(screen.getByText(COMPASS_TEST_INSIGHTS.annualGoals[0])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Weekly LAB' })).toBeInTheDocument();
  });
});
