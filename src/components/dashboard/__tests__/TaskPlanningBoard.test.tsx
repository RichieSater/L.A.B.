import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskPlanningBoard } from '../TaskPlanningBoard';
import type { EnrichedTaskItem, TaskPlanningLane } from '../../../state/selectors';

function makeItem(
  overrides: Partial<EnrichedTaskItem> = {},
): EnrichedTaskItem {
  return {
    id: 'task-1',
    task: 'Review this week priorities',
    dueDate: '2026-03-31',
    priority: 'high',
    status: 'open',
    createdDate: '2026-03-30',
    advisorId: 'prioritization',
    advisorIcon: '🧠',
    advisorName: 'Prioritization',
    advisorColor: '#60a5fa',
    planningBucket: null,
    planningUpdatedAt: null,
    ...overrides,
  };
}

function makeLanes(): TaskPlanningLane[] {
  return [
    {
      bucket: 'today',
      label: 'Today',
      description: 'Needs attention in the current workday.',
      items: [],
    },
    {
      bucket: 'this_week',
      label: 'This Week',
      description: 'Important soon, but not committed to a specific slot yet.',
      items: [],
    },
    {
      bucket: 'later',
      label: 'Later',
      description: 'Keep visible without crowding the near-term queue.',
      items: [],
    },
  ];
}

describe('TaskPlanningBoard', () => {
  it('surfaces unplanned tasks in a triage lane and lets the user bucket them', () => {
    const onSetPlanBucket = vi.fn();

    render(
      <TaskPlanningBoard
        lanes={makeLanes()}
        unplanned={[makeItem()]}
        focusTaskKeys={new Set()}
        onAddFocusTask={vi.fn()}
        onRemoveFocusTask={vi.fn()}
        onSetPlanBucket={onSetPlanBucket}
        onClearPlanBucket={vi.fn()}
        onScheduleTask={vi.fn()}
        schedulingEnabled={false}
      />,
    );

    expect(screen.getByText('Needs Triage')).toBeInTheDocument();
    expect(screen.getByText('Review this week priorities')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Today' })[0]);

    expect(onSetPlanBucket).toHaveBeenCalledWith('prioritization', 'task-1', 'today');
  });
});
