import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecentActivityTimeline } from '../RecentActivityTimeline';
import type { RecentActivitySummary } from '../../../state/selectors';

function makeSummary(
  overrides: Partial<RecentActivitySummary> = {},
): RecentActivitySummary {
  return {
    window: 'last_7_days',
    windowLabel: 'Last 7 Days',
    rangeStart: '2026-03-25',
    rangeEnd: '2026-03-31',
    total: 3,
    remainingCount: 0,
    counts: {
      completedTasks: 1,
      sessions: 1,
      quickLogs: 1,
      rituals: 1,
    },
    items: [
      {
        id: 'task:therapist:1:2026-03-31',
        type: 'task_complete',
        title: 'Closed the therapist intake loop',
        detail: 'Completed high priority task.',
        occurredAt: '2026-03-31',
        occurredDate: '2026-03-31',
        advisorId: 'therapist',
        advisorIcon: 'T',
        advisorName: 'Therapist',
        advisorColor: '#38bdf8',
      },
      {
        id: 'quick-log:fitness:2026-03-30T09:00:00.000Z',
        type: 'quick_log',
        title: 'Fitness quick log',
        detail: 'energy: 7',
        occurredAt: '2026-03-30T09:00:00.000Z',
        occurredDate: '2026-03-30',
        advisorId: 'fitness',
        advisorIcon: 'F',
        advisorName: 'Fitness',
        advisorColor: '#22c55e',
      },
      {
        id: 'daily-plan:2026-03-31:2026-03-31T08:00:00.000Z',
        type: 'daily_plan',
        title: 'Daily plan completed',
        detail: 'Protect the real therapist block.',
        occurredAt: '2026-03-31T08:00:00.000Z',
        occurredDate: '2026-03-31',
        advisorId: null,
        advisorIcon: null,
        advisorName: null,
        advisorColor: null,
      },
    ],
    ...overrides,
  };
}

describe('RecentActivityTimeline', () => {
  it('renders recent activity and lets the user switch windows', () => {
    const onSelectWindow = vi.fn();

    render(
      <RecentActivityTimeline
        summary={makeSummary()}
        selectedWindow="last_7_days"
        onSelectWindow={onSelectWindow}
      />,
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Closed the therapist intake loop')).toBeInTheDocument();
    expect(screen.getByText('Fitness quick log')).toBeInTheDocument();
    expect(screen.getByText('Daily plan completed')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(onSelectWindow).toHaveBeenCalledWith('today');
  });

  it('shows an empty state when the selected window has no activity', () => {
    render(
      <RecentActivityTimeline
        summary={makeSummary({
          window: 'today',
          windowLabel: 'Today',
          total: 0,
          items: [],
          counts: {
            completedTasks: 0,
            sessions: 0,
            quickLogs: 0,
            rituals: 0,
          },
        })}
        selectedWindow="today"
        onSelectWindow={vi.fn()}
      />,
    );

    expect(screen.getByText('No activity captured in today yet.')).toBeInTheDocument();
  });
});
