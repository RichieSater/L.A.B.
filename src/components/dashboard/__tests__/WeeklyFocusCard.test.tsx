import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WeeklyFocusCard } from '../WeeklyFocusCard';
import type { WeeklyFocusSummary } from '../../../state/selectors';

function makeSummary(overrides: Partial<WeeklyFocusSummary> = {}): WeeklyFocusSummary {
  return {
    weekStart: '2026-03-29',
    items: [
      {
        id: 'task-1',
        task: 'Book the key therapist session',
        dueDate: '2026-04-01',
        priority: 'high',
        status: 'open',
        createdDate: '2026-03-28',
        advisorId: 'therapist',
        advisorIcon: 'T',
        advisorName: 'Therapist',
        advisorColor: '#38bdf8',
        planningBucket: 'this_week',
        planningUpdatedAt: '2026-03-29T12:00:00.000Z',
        focusAddedAt: '2026-03-29T12:00:00.000Z',
        carriedForwardFromWeekStart: null,
      },
    ],
    completedCount: 0,
    openCount: 1,
    remainingSlots: 2,
    previousWeekStart: '2026-03-22',
    carryForwardCandidates: [
      {
        id: 'task-2',
        task: 'Rework budget assumptions',
        dueDate: '2026-03-30',
        priority: 'medium',
        status: 'open',
        createdDate: '2026-03-22',
        advisorId: 'prioritization',
        advisorIcon: 'P',
        advisorName: 'Prioritization',
        advisorColor: '#60a5fa',
        planningBucket: 'later',
        planningUpdatedAt: '2026-03-22T12:00:00.000Z',
        focusAddedAt: '2026-03-22T12:00:00.000Z',
        carriedForwardFromWeekStart: null,
      },
    ],
    suggestedTasks: [
      {
        id: 'task-3',
        task: 'Clarify open family decision',
        dueDate: 'ongoing',
        priority: 'high',
        status: 'open',
        createdDate: '2026-03-30',
        advisorId: 'career',
        advisorIcon: 'C',
        advisorName: 'Career',
        advisorColor: '#f97316',
        planningBucket: null,
        planningUpdatedAt: null,
      },
    ],
    ...overrides,
  };
}

describe('WeeklyFocusCard', () => {
  it('shows current focus and allows carry-forward and suggestion actions', () => {
    const onAddFocusTask = vi.fn();
    const onRemoveFocusTask = vi.fn();
    const onOpenAdvisorLane = vi.fn();
    const currentDate = '2026-03-31';

    render(
      <WeeklyFocusCard
        summary={makeSummary()}
        onAddFocusTask={onAddFocusTask}
        onRemoveFocusTask={onRemoveFocusTask}
        onSetPlanBucket={vi.fn()}
        onScheduleTask={vi.fn()}
        onOpenAdvisorLane={onOpenAdvisorLane}
        currentDate={currentDate}
        schedulingEnabled={false}
      />,
    );

    expect(screen.getByText('Weekly Focus')).toBeInTheDocument();
    expect(screen.getByText('Book the key therapist session')).toBeInTheDocument();
    expect(screen.getByText('Carry Forward')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove focus' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Weekly Focus in Weekly LAB' }));
    fireEvent.click(screen.getByRole('button', { name: 'Carry into week' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add to focus' }));

    expect(onRemoveFocusTask).toHaveBeenCalledWith('therapist', 'task-1');
    expect(onOpenAdvisorLane).toHaveBeenCalledWith('therapist', 'weekly_focus');
    expect(onAddFocusTask).toHaveBeenNthCalledWith(1, 'prioritization', 'task-2', '2026-03-22');
    expect(onAddFocusTask).toHaveBeenNthCalledWith(2, 'career', 'task-3');
  });
});
