import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DailyPlanningCard } from '../DailyPlanningCard';
import type { DailyPlanningSummary } from '../../../state/selectors';

function makeSummary(
  overrides: Partial<DailyPlanningSummary> = {},
): DailyPlanningSummary {
  return {
    date: '2026-03-31',
    entry: {
      date: '2026-03-31',
      completedAt: null,
      headline: '',
      guardrail: '',
    },
    previousEntry: {
      date: '2026-03-30',
      completedAt: '2026-03-30T08:30:00.000Z',
      headline: 'Protect the therapist follow-up block.',
      guardrail: 'Do not spend the morning reorganizing the queue.',
    },
    completedToday: false,
    completedAt: null,
    counts: {
      today: 2,
      carryOver: 1,
      focusOutsideToday: 1,
      overdueOpen: 1,
      pullInCandidates: 1,
    },
    carryOverToday: [],
    focusOutsideToday: [],
    pullInCandidates: [],
    actionGroups: [
      {
        id: 'carry_over',
        title: 'Carry Over Cleanup',
        description: 'These tasks are still sitting in Today from an earlier sweep.',
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
            planningUpdatedAt: '2026-03-30T12:00:00.000Z',
          },
        ],
        remainingCount: 0,
      },
    ],
    ...overrides,
  };
}

describe('DailyPlanningCard', () => {
  it('shows daily planning signals and routes actions back into the queue', () => {
    const onCompleteDailyPlan = vi.fn();
    const onSetDailyPlanningField = vi.fn();
    const onSetPlanBucket = vi.fn();

    render(
      <DailyPlanningCard
        summary={makeSummary()}
        focusTaskKeys={new Set()}
        onCompleteDailyPlan={onCompleteDailyPlan}
        onSetDailyPlanningField={onSetDailyPlanningField}
        onSetPlanBucket={onSetPlanBucket}
        onClearPlanBucket={vi.fn()}
        onScheduleTask={vi.fn()}
        schedulingEnabled={false}
      />,
    );

    expect(screen.getByText('Daily Plan')).toBeInTheDocument();
    expect(screen.getByText('Carry Over Cleanup')).toBeInTheDocument();
    expect(screen.getByText('Previous Daily Plan')).toBeInTheDocument();
    expect(screen.getByText('Rebook therapist session')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Headline'), {
      target: { value: 'Keep the therapist follow-up moving today.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mark daily plan done' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Today' })[0]);

    expect(onSetDailyPlanningField).toHaveBeenCalledWith(
      '2026-03-31',
      'headline',
      'Keep the therapist follow-up moving today.',
    );
    expect(onCompleteDailyPlan).toHaveBeenCalledWith('2026-03-31');
    expect(onSetPlanBucket).toHaveBeenCalledWith('therapist', 'task-1', 'today');
  });
});
