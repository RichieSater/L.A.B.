import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GOLDEN_COMPASS_PATH,
  getGoldenCompassSessionViewPath,
} from '../../../constants/routes';
import {
  COMPASS_TEST_INSIGHTS,
  createCompassTestAnswers,
  createCompassTestSession,
  getCompassScreenIndex,
  getCompassTestAnswerRecord,
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

function getPastMonthsListItems(): string[] {
  return within(screen.getByRole('list', { name: 'Previous 12 months' }))
    .getAllByRole('listitem')
    .map(item => item.textContent ?? '');
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
        expect(
          screen.getByRole('textbox', { name: 'What is causing discomfort in your life right now? 1' }),
        ).toHaveValue(
          JSON.parse(getCompassTestAnswerRecord('bonfire-write').items ?? '[]')[0],
        );
      },
    },
    {
      label: 'multi-input legacy-textarea conversion',
      screenId: 'past-compassion-box',
      assertValues: () => {
        expect(
          screen.getByRole('textbox', { name: 'What are you ready to forgive yourself for? 1' }),
        ).toHaveValue(
          JSON.parse(getCompassTestAnswerRecord('past-compassion-box').main ?? '[]')[0],
        );
      },
    },
    {
      label: 'short-text',
      screenId: 'movie-title',
      assertValues: () => {
        expect(screen.getByRole('textbox')).toHaveValue(
          getCompassTestAnswerRecord('movie-title').main ?? '',
        );
      },
    },
    {
      label: 'multi-input exact-count conversion',
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

    await user.type(
      screen.getByRole('textbox', { name: 'What is causing discomfort in your life right now? 1' }),
      'Clear the noise first',
    );

    expect(continueButton).toBeEnabled();
    apiClient.updateCompassSession.mockClear();

    await user.click(continueButton);

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        currentScreen: getCompassScreenIndex('bonfire-release'),
      });
    });
    expect(screen.getByText('How would it feel to mentally let go of everything that’s in the box?')).toBeInTheDocument();

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
    expect(screen.getByText('What is causing discomfort in your life right now?')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('flushes pending autosave work before saving and exiting', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('past-compassion-box'),
      answers: {},
      answerCount: 0,
    });

    renderRunner(initialSession);

    const proudAnswer = 'I am proud that I kept rebuilding instead of hiding.';
    await user.type(
      screen.getByRole('textbox', { name: 'What are you ready to forgive yourself for? 1' }),
      proudAnswer,
    );
    apiClient.updateCompassSession.mockClear();

    await user.click(screen.getByRole('button', { name: 'Save and Exit' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        answers: {
          'past-compassion-box': {
            main: JSON.stringify([proudAnswer]),
          },
        },
        currentScreen: getCompassScreenIndex('past-compassion-box'),
      });
    });
    expect(navigate).toHaveBeenCalledWith(GOLDEN_COMPASS_PATH);

    await act(async () => {
      await new Promise(resolve => window.setTimeout(resolve, 1100));
    });
    expect(apiClient.updateCompassSession).toHaveBeenCalledTimes(1);
  });

  it('hydrates legacy fixed-key and plain-text answers into converted list builders', () => {
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('top-3-goals'),
        answers: {
          'top-3-goals': {
            goal1: 'Ship LAB cleanly',
            goal2: 'Stabilize the money layer',
            goal3: 'Protect the body baseline',
          },
        },
      }),
    );

    expect(screen.getByDisplayValue('Ship LAB cleanly')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Stabilize the money layer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Protect the body baseline')).toBeInTheDocument();
  });

  it('hydrates legacy newline text into converted add-item rows', () => {
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('past-compassion-box'),
        answers: {
          'past-compassion-box': {
            main: 'Old guilt one\nOld guilt two',
          },
        },
      }),
    );

    expect(screen.getByDisplayValue('Old guilt one')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Old guilt two')).toBeInTheDocument();
  });

  it('enforces exact-count list rules and disables adding past the max', async () => {
    const user = userEvent.setup();

    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('point-a'),
        answers: {},
      }),
    );

    const continueButton = screen.getByRole('button', { name: 'Continue' });
    const addItemButton = screen.getByRole('button', { name: 'Add item for Point A — Summarise where you are at today in a few lines' });

    expect(continueButton).toBeDisabled();
    expect(screen.getByText('0 of 3 items added')).toBeInTheDocument();

    await user.type(
      screen.getByRole('textbox', { name: 'Point A — Summarise where you are at today in a few lines 1' }),
      'I have momentum.',
    );
    await user.click(addItemButton);
    await user.type(
      screen.getByRole('textbox', { name: 'Point A — Summarise where you are at today in a few lines 2' }),
      'I still have too many live threads.',
    );
    await user.click(addItemButton);
    await user.type(
      screen.getByRole('textbox', { name: 'Point A — Summarise where you are at today in a few lines 3' }),
      'I need a calmer operating rhythm.',
    );

    expect(continueButton).toBeEnabled();
    expect(screen.getByText('3 of 3 items added')).toBeInTheDocument();
    expect(addItemButton).toBeDisabled();
  });

  it('supports list keyboard shortcuts for add-row and advance behavior', async () => {
    const user = userEvent.setup();
    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('past-golden-moments'),
      answers: {},
    });

    renderRunner(initialSession);

    const firstGoldenMoment = screen.getByRole('textbox', { name: 'Golden moments from the last year 1' });
    await user.type(firstGoldenMoment, 'A calmer win');
    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('textbox', { name: 'Golden moments from the last year 2' }),
    ).toHaveFocus();

    await user.type(screen.getByRole('textbox', { name: 'Golden moments from the last year 2' }), 'A body breakthrough');
    await user.click(screen.getByRole('button', { name: 'Add item for Golden moments from the last year' }));
    await user.type(screen.getByRole('textbox', { name: 'Golden moments from the last year 3' }), 'A great conversation');
    apiClient.updateCompassSession.mockClear();

    await user.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        currentScreen: getCompassScreenIndex('past-challenges'),
      });
    });
  });

  it('advances short-text prompts with Enter', async () => {
    const user = userEvent.setup();
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('movie-title'),
        answers: {},
      }),
    );

    await user.type(screen.getByRole('textbox', { name: 'If your next year was the title of a movie… what would it be?' }), 'Quiet Year');
    apiClient.updateCompassSession.mockClear();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalled();
    });
  });

  it('advances textarea prompts with Cmd/Ctrl+Enter', async () => {
    const user = userEvent.setup();
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('golden-path-final-notes'),
        answers: {
          'golden-path-final-notes': {
            finalNotes: 'Stay simpler sooner.',
          },
        },
      }),
    );

    apiClient.updateCompassSession.mockClear();
    await user.click(screen.getByRole('textbox', { name: 'How do you feel? Write a few final notes to yourself:' }));
    await user.keyboard('{Control>}{Enter}{/Control}');

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalled();
    });
  });

  it('shows a read-only month list and defaults to including the current month after the 10th day', () => {
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('past-months'),
        answers: {},
        answerCount: 0,
        createdAt: '2026-04-11T12:00:00.000Z',
      }),
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Include current month' })).toHaveAttribute('aria-pressed', 'true');
    expect(getPastMonthsListItems()).toEqual([
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
      'April',
    ]);
  });

  it('defaults to the last full 12 completed months on the 10th day or earlier and persists that mode on continue', async () => {
    const user = userEvent.setup();

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('past-months'),
      answers: {},
      answerCount: 0,
      createdAt: '2026-04-10T12:00:00.000Z',
    });

    renderRunner(initialSession);

    expect(screen.getByRole('button', { name: 'Include current month' })).toHaveAttribute('aria-pressed', 'false');
    expect(getPastMonthsListItems()).toEqual([
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
    ]);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        answers: {
          'past-months': {
            includeCurrentMonth: 'false',
          },
        },
        currentScreen: getCompassScreenIndex('past-monthly-events'),
      });
    });
  });

  it('toggles whether the current month is included and persists only the toggle choice', async () => {
    const user = userEvent.setup();

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('past-months'),
      answers: {},
      answerCount: 0,
      createdAt: '2026-04-10T12:00:00.000Z',
    });

    renderRunner(initialSession);

    const toggle = screen.getByRole('button', { name: 'Include current month' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(getPastMonthsListItems()).toEqual([
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
      'April',
    ]);

    apiClient.updateCompassSession.mockClear();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        answers: {
          'past-months': {
            includeCurrentMonth: 'true',
          },
        },
        currentScreen: getCompassScreenIndex('past-monthly-events'),
      });
    });
  });

  it('shows month-specific event fields before the snapshot and gates progress until at least one month has content', async () => {
    const user = userEvent.setup();
    const answers = createCompassTestAnswers();
    answers['past-months'] = {
      includeCurrentMonth: 'false',
    };
    delete answers['past-monthly-events'];

    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('past-monthly-events'),
        answers,
        createdAt: '2026-04-10T12:00:00.000Z',
      }),
    );

    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'April event 1' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'March event 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add event for April' })).toBeInTheDocument();
    expect(screen.queryByText('The Snapshot Of Your Past Year')).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'April event 1' }), 'Signed the lease');
    await user.click(screen.getByRole('button', { name: 'Add event for April' }));
    await user.type(screen.getByRole('textbox', { name: 'April event 2' }), 'Took the first real trip');

    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });

  it('routes month-by-month review into the past preview checkpoint before the snapshot screens', async () => {
    const user = userEvent.setup();

    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('past-monthly-events'),
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Preview Your Past Year')).toBeInTheDocument();
    expect(screen.getByText('Month-by-month review')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('The Snapshot Of Your Past Year')).toBeInTheDocument();
  });

  it('hydrates legacy newline month notes into add-item rows', () => {
    const answers = createCompassTestAnswers();
    answers['past-monthly-events'] = {
      month1: 'Signed the lease\nTook the first real trip',
    };

    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('past-monthly-events'),
        answers,
        createdAt: '2026-04-10T12:00:00.000Z',
      }),
    );

    expect(screen.getByDisplayValue('Signed the lease')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Took the first real trip')).toBeInTheDocument();
  });

  it('does not jump backward on resume when past-monthly-events has no stored answer yet', () => {
    const answers = createCompassTestAnswers();
    delete answers['past-monthly-events'];

    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('past-highlights'),
        answers,
      }),
    );

    expect(screen.getByText('The Snapshot Of Your Past Year')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Previous 12 months' })).not.toBeInTheDocument();
    expect(
      screen.queryByText('Significant events, changes, wins, or losses from the past year'),
    ).not.toBeInTheDocument();
  });

  it('maps legacy stored month names back to the matching toggle mode before persisting the new answer shape', async () => {
    const user = userEvent.setup();

    const initialSession = createCompassTestSession({
      currentScreen: getCompassScreenIndex('past-months'),
      answers: {
        'past-months': {
          month1: 'April',
          month2: 'May',
          month3: 'June',
          month4: 'July',
          month5: 'August',
          month6: 'September',
          month7: 'October',
          month8: 'November',
          month9: 'December',
          month10: 'January',
          month11: 'February',
          month12: 'March',
        },
      },
      answerCount: 1,
      createdAt: '2026-04-11T12:00:00.000Z',
    });

    renderRunner(initialSession);

    expect(screen.getByRole('button', { name: 'Include current month' })).toHaveAttribute('aria-pressed', 'false');
    expect(getPastMonthsListItems()).toEqual([
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
      'January',
      'February',
      'March',
    ]);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(apiClient.updateCompassSession).toHaveBeenCalledWith(initialSession.id, {
        answers: {
          'past-months': {
            includeCurrentMonth: 'false',
          },
        },
        currentScreen: getCompassScreenIndex('past-monthly-events'),
      });
    });
  });

  it('shows the lighting preview checkpoint before the Golden Path starts', async () => {
    const user = userEvent.setup();

    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('lighting-self-rewards'),
      }),
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Preview The Direction You Set')).toBeInTheDocument();
    expect(screen.getAllByText('Lighting The Path')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByText('We are now going to draw a direct path to your perfect day, along with milestones to achieve this.'),
    ).toBeInTheDocument();
  });

  it('can resume directly onto a preview checkpoint', () => {
    renderRunner(
      createCompassTestSession({
        currentScreen: getCompassScreenIndex('lighting-preview'),
      }),
    );

    expect(screen.getByText('Preview The Direction You Set')).toBeInTheDocument();
  });

  it('completes the Compass session, refreshes bootstrap, and shows the completion summary', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    useNavigate.mockReturnValue(navigate);
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
    expect(screen.getByRole('button', { name: 'View Compass' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View Compass' }));
    expect(navigate).toHaveBeenCalledWith(getGoldenCompassSessionViewPath(initialSession.id));
  });
});
