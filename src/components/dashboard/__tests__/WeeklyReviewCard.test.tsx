import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WeeklyReviewCard } from '../WeeklyReviewCard';
import type { WeeklyReviewSummary } from '../../../state/selectors';

function makeSummary(
  overrides: Partial<WeeklyReviewSummary> = {},
): WeeklyReviewSummary {
  return {
    weekStart: '2026-03-29',
    weekEnd: '2026-04-04',
    entry: {
      weekStart: '2026-03-29',
      completedAt: null,
      biggestWin: '',
      biggestLesson: '',
      nextWeekNote: '',
    },
    previousEntry: {
      weekStart: '2026-03-22',
      completedAt: '2026-03-24T10:00:00.000Z',
      biggestWin: 'Protected one meaningful block.',
      biggestLesson: 'Too many urgent tasks stayed unplanned.',
      nextWeekNote: 'Decide what really belongs in Today.',
    },
    completedThisWeek: false,
    completedAt: null,
    counts: {
      today: 2,
      thisWeek: 3,
      later: 1,
      unplanned: 2,
      overdueOpen: 1,
    },
    momentum: {
      completedTasks: 2,
      completedFocusTasks: 1,
      sessions: 1,
      quickLogDays: 2,
      activeAdvisors: 2,
    },
    staleToday: [],
    overduePlanned: [
      {
        id: 'task-1',
        task: 'Rebook therapist session',
        dueDate: '2026-03-28',
        priority: 'high',
        status: 'open',
        createdDate: '2026-03-27',
        advisorId: 'therapist',
        advisorIcon: 'T',
        advisorName: 'Therapist',
        advisorColor: '#38bdf8',
        planningBucket: 'today',
        planningUpdatedAt: '2026-03-28T12:00:00.000Z',
      },
    ],
    highPriorityUnplanned: [],
    actionGroups: [
      {
        id: 'overdue_planned',
        title: 'Rebalance Due Work',
        description: 'Queued tasks that are already past due and need a real decision now.',
        items: [
          {
            id: 'task-1',
            task: 'Rebook therapist session',
            dueDate: '2026-03-28',
            priority: 'high',
            status: 'open',
            createdDate: '2026-03-27',
            advisorId: 'therapist',
            advisorIcon: 'T',
            advisorName: 'Therapist',
            advisorColor: '#38bdf8',
            planningBucket: 'today',
            planningUpdatedAt: '2026-03-28T12:00:00.000Z',
          },
        ],
        remainingCount: 0,
      },
    ],
    recentWins: [
      {
        id: 'task-win',
        task: 'Closed the therapist intake loop',
        dueDate: '2026-03-29',
        priority: 'high',
        status: 'completed',
        createdDate: '2026-03-26',
        completedDate: '2026-03-30',
        advisorId: 'therapist',
        advisorIcon: 'T',
        advisorName: 'Therapist',
        advisorColor: '#38bdf8',
        planningBucket: null,
        planningUpdatedAt: null,
      },
    ],
    advisorSnapshots: [
      {
        advisorId: 'therapist',
        advisorIcon: 'T',
        advisorName: 'Therapist',
        advisorColor: '#38bdf8',
        completedTasks: 1,
        sessions: 1,
        quickLogs: 1,
        openTasks: 3,
        plannedOpen: 2,
        overdueOpen: 1,
        status: 'attention',
        note: '1 completed, 1 session, 1 quick log, but 1 overdue task still open.',
        recommendedPreset: 'carry_over',
        recommendedLabel: 'Carry Over',
        recommendedCount: 1,
        alternatePlanningShortcuts: [
          {
            preset: 'overdue',
            label: 'Overdue',
            count: 1,
          },
        ],
      },
      {
        advisorId: 'fitness',
        advisorIcon: 'F',
        advisorName: 'Fitness',
        advisorColor: '#22c55e',
        completedTasks: 1,
        sessions: 0,
        quickLogs: 1,
        openTasks: 2,
        plannedOpen: 1,
        overdueOpen: 0,
        status: 'momentum',
        note: '1 completed, 1 quick log',
        recommendedPreset: 'all_open',
        recommendedLabel: 'Open Tasks',
        recommendedCount: 2,
        alternatePlanningShortcuts: [],
      },
    ],
    recapSections: [
      {
        id: 'wins',
        title: 'What moved',
        description: 'Concrete wins from the week so the review starts from evidence.',
        lines: ['Closed the therapist intake loop (Therapist)'],
        emptyState: 'No completed task wins were captured this week yet.',
        tone: 'success',
      },
      {
        id: 'advisors',
        title: 'Active domains',
        description: 'Which advisors generated momentum or still need attention.',
        lines: ['Therapist: 1 completed, 1 session, 1 quick log, but 1 overdue task still open.'],
        emptyState: 'No advisor-specific movement is standing out yet.',
        tone: 'primary',
      },
      {
        id: 'pressure',
        title: 'Unfinished pressure',
        description: 'The queue or planning friction most likely to leak into next week.',
        lines: ['Overdue planned: Rebook therapist session.'],
        emptyState: 'The queue is balanced right now; there is no obvious spillover pressure.',
        tone: 'attention',
      },
      {
        id: 'focus',
        title: 'Next week focus',
        description: 'Deterministic prompts for what deserves the first planning decision next.',
        lines: ['Resolve Rebook therapist session before adding fresh commitments.'],
        emptyState: 'Protect momentum and schedule from the current Today bucket before adding more backlog.',
        tone: 'neutral',
      },
    ],
    ...overrides,
  };
}

describe('WeeklyReviewCard', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows review signals and lets the user mark the week as reviewed', () => {
    const onCompleteReview = vi.fn();
    const onSetPlanBucket = vi.fn();
    const onSetReviewField = vi.fn();
    const onOpenAdvisorLane = vi.fn();

    render(
      <WeeklyReviewCard
        summary={makeSummary()}
        onCompleteReview={onCompleteReview}
        onSetReviewField={onSetReviewField}
        onAddFocusTask={vi.fn()}
        onRemoveFocusTask={vi.fn()}
        focusTaskKeys={new Set()}
        onSetPlanBucket={onSetPlanBucket}
        onClearPlanBucket={vi.fn()}
        onScheduleTask={vi.fn()}
        onOpenAdvisorLane={onOpenAdvisorLane}
        schedulingEnabled={false}
      />,
    );

    expect(screen.getByText('Weekly Review')).toBeInTheDocument();
    expect(screen.getByText('1 planned task already overdue')).toBeInTheDocument();
    expect(screen.getByText('Rebalance Due Work')).toBeInTheDocument();
    expect(screen.getByText('Previous Review')).toBeInTheDocument();
    expect(screen.getByText('Momentum Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Closed the therapist intake loop')).toBeInTheDocument();
    expect(screen.getByText('Advisor Signals')).toBeInTheDocument();
    expect(screen.getByText('Weekly Recap')).toBeInTheDocument();
    expect(screen.getByText('What moved')).toBeInTheDocument();
    expect(screen.getByText('Unfinished pressure')).toBeInTheDocument();
    expect(screen.getByText('Resolve Rebook therapist session before adding fresh commitments.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Carry Over (1)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Overdue (1)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark review done' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Today' })[0]);

    expect(onOpenAdvisorLane).toHaveBeenCalledWith('therapist', 'carry_over');
    expect(onOpenAdvisorLane).toHaveBeenCalledWith('therapist', 'overdue');
    expect(onCompleteReview).toHaveBeenCalledWith('2026-03-29');
    expect(onSetPlanBucket).toHaveBeenCalledWith('therapist', 'task-1', 'today');
  });

  it('buffers review typing until blur or idle and skips unchanged blur', async () => {
    vi.useFakeTimers();
    const onSetReviewField = vi.fn();

    render(
      <WeeklyReviewCard
        summary={makeSummary()}
        onCompleteReview={vi.fn()}
        onSetReviewField={onSetReviewField}
        onAddFocusTask={vi.fn()}
        onRemoveFocusTask={vi.fn()}
        focusTaskKeys={new Set()}
        onSetPlanBucket={vi.fn()}
        onClearPlanBucket={vi.fn()}
        onScheduleTask={vi.fn()}
        onOpenAdvisorLane={vi.fn()}
        schedulingEnabled={false}
      />,
    );

    const biggestWin = screen.getByLabelText('Biggest win');
    fireEvent.change(biggestWin, {
      target: { value: 'Finally closed the lingering therapist loop.' },
    });

    expect(biggestWin).toHaveValue('Finally closed the lingering therapist loop.');
    expect(onSetReviewField).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.blur(biggestWin);
    });

    expect(onSetReviewField).toHaveBeenCalledTimes(1);
    expect(onSetReviewField).toHaveBeenCalledWith(
      '2026-03-29',
      'biggestWin',
      'Finally closed the lingering therapist loop.',
    );

    fireEvent.change(screen.getByLabelText('Next week note'), {
      target: { value: 'Start by resolving overdue planned work.' },
    });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(onSetReviewField).toHaveBeenCalledTimes(2);
    expect(onSetReviewField).toHaveBeenLastCalledWith(
      '2026-03-29',
      'nextWeekNote',
      'Start by resolving overdue planned work.',
    );

    await act(async () => {
      fireEvent.blur(screen.getByLabelText('Lesson or friction'));
    });

    expect(onSetReviewField).toHaveBeenCalledTimes(2);
  });
});
