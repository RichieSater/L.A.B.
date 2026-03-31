import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AdvisorAttentionPanel } from '../AdvisorAttentionPanel';
import type { AdvisorAttentionSummary } from '../../../state/selectors';

function makeSummary(
  overrides: Partial<AdvisorAttentionSummary> = {},
): AdvisorAttentionSummary {
  return {
    items: [
      {
        advisorId: 'therapist',
        advisorIcon: 'T',
        advisorName: 'Therapist',
        advisorColor: '#38bdf8',
        status: 'urgent',
        primaryAction: 'schedule',
        planningPreset: 'carry_over',
        planningLabel: 'Carry Over',
        planningCount: 1,
        alternatePlanningShortcuts: [
          {
            preset: 'needs_triage',
            label: 'Needs Triage',
            count: 2,
            headline: 'Queue still needs decisions',
            reason: '2 unplanned tasks are still waiting for a real bucket before this advisor is truly back under control.',
          },
          {
            preset: 'overdue',
            label: 'Overdue',
            count: 1,
            headline: 'A commitment is already late',
            reason: '1 overdue task is still sitting open. Replan it before booking more ambitious follow-through.',
          },
        ],
        headline: 'Session cadence slipped',
        reason: '1 overdue task is still open on top of the missed cadence.',
        lastSessionDate: '2026-03-15',
        nextDueDate: '2026-03-20',
        lastQuickLogDate: '2026-03-28',
        openTasks: 3,
        plannedOpen: 1,
        unplannedOpen: 2,
        overdueOpen: 1,
        highPriorityUnplanned: 1,
        completedTasksThisWeek: 0,
        sessionsThisWeek: 0,
        quickLogsThisWeek: 0,
      },
      {
        advisorId: 'prioritization',
        advisorIcon: 'P',
        advisorName: 'Prioritization',
        advisorColor: '#60a5fa',
        status: 'urgent',
        primaryAction: 'plan',
        planningPreset: 'needs_triage',
        planningLabel: 'Needs Triage',
        planningCount: 2,
        alternatePlanningShortcuts: [
          {
            preset: 'carry_over',
            label: 'Carry Over',
            count: 1,
            headline: 'Today work is stalling',
            reason: '1 task is still sitting in Today from an earlier sweep. Rebucket or schedule the real commitment before adding more.',
          },
          {
            preset: 'weekly_focus',
            label: 'Weekly Focus',
            count: 1,
            headline: 'Weekly focus is stuck',
            reason: '1 weekly focus task is still open for this advisor. Move the current commitment before promoting fresh work.',
          },
        ],
        headline: 'Queue needs a decision',
        reason: '1 high-priority unplanned • 2 unplanned total. Move this work into a real bucket.',
        lastSessionDate: '2026-03-28',
        nextDueDate: '2026-04-06',
        lastQuickLogDate: null,
        openTasks: 2,
        plannedOpen: 0,
        unplannedOpen: 2,
        overdueOpen: 0,
        highPriorityUnplanned: 1,
        completedTasksThisWeek: 0,
        sessionsThisWeek: 0,
        quickLogsThisWeek: 0,
      },
      {
        advisorId: 'fitness',
        advisorIcon: 'F',
        advisorName: 'Fitness',
        advisorColor: '#22c55e',
        status: 'steady',
        primaryAction: 'review',
        planningPreset: null,
        planningLabel: null,
        planningCount: 0,
        alternatePlanningShortcuts: [],
        headline: 'Momentum is steady',
        reason: 'This advisor already has recent signal, so you can leave it alone unless priorities change.',
        lastSessionDate: '2026-03-29',
        nextDueDate: '2026-04-06',
        lastQuickLogDate: '2026-03-29',
        openTasks: 0,
        plannedOpen: 0,
        unplannedOpen: 0,
        overdueOpen: 0,
        highPriorityUnplanned: 0,
        completedTasksThisWeek: 1,
        sessionsThisWeek: 1,
        quickLogsThisWeek: 1,
      },
    ],
    needsAttentionCount: 2,
    scheduleCount: 1,
    planCount: 1,
    quickLogCount: 0,
    quietCount: 1,
    ...overrides,
  };
}

describe('AdvisorAttentionPanel', () => {
  it('shows ranked advisor nudges and routes planning actions into the task board', () => {
    const onOpenTasks = vi.fn();

    render(
      <MemoryRouter>
        <AdvisorAttentionPanel
          summary={makeSummary()}
          onOpenTasks={onOpenTasks}
          schedulingEnabled
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Attention Radar')).toBeInTheDocument();
    expect(screen.getByText('Session cadence slipped')).toBeInTheDocument();
    expect(screen.getByText('Queue needs a decision')).toBeInTheDocument();
    expect(screen.getByText('Stable Right Now')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Needs Triage' }));

    expect(onOpenTasks).toHaveBeenCalledWith({
      advisorId: 'prioritization',
      taskListPreset: 'needs_triage',
      attentionContext: {
        advisorName: 'Prioritization',
        headline: 'Queue needs a decision',
        reason: '1 high-priority unplanned • 2 unplanned total. Move this work into a real bucket.',
        planningLabel: 'Needs Triage',
        planningCount: 2,
      },
    });
  });

  it('exposes planner shortcuts on non-planning cards when a scoped lane already exists', () => {
    const onOpenTasks = vi.fn();

    render(
      <MemoryRouter>
        <AdvisorAttentionPanel
          summary={makeSummary()}
          onOpenTasks={onOpenTasks}
          schedulingEnabled
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open Carry Over' }));

    expect(onOpenTasks).toHaveBeenCalledWith({
      advisorId: 'therapist',
      taskListPreset: 'carry_over',
      attentionContext: {
        advisorName: 'Therapist',
        headline: 'Session cadence slipped',
        reason: '1 overdue task is still open on top of the missed cadence.',
        planningLabel: 'Carry Over',
        planningCount: 1,
      },
    });
  });

  it('surfaces alternate planner lanes on non-planning cards without losing lane-specific copy', () => {
    const onOpenTasks = vi.fn();

    render(
      <MemoryRouter>
        <AdvisorAttentionPanel
          summary={makeSummary()}
          onOpenTasks={onOpenTasks}
          schedulingEnabled
        />
      </MemoryRouter>,
    );

    const therapistCard = screen.getByText('Session cadence slipped').closest('article');
    if (!therapistCard) {
      throw new Error('Expected therapist attention card.');
    }

    fireEvent.click(within(therapistCard).getByRole('button', { name: 'Needs Triage (2)' }));

    expect(onOpenTasks).toHaveBeenCalledWith({
      advisorId: 'therapist',
      taskListPreset: 'needs_triage',
      attentionContext: {
        advisorName: 'Therapist',
        headline: 'Queue still needs decisions',
        reason: '2 unplanned tasks are still waiting for a real bucket before this advisor is truly back under control.',
        planningLabel: 'Needs Triage',
        planningCount: 2,
      },
    });
  });

  it('surfaces adjacent planner lanes on planning cards without losing lane-specific copy', () => {
    const onOpenTasks = vi.fn();

    render(
      <MemoryRouter>
        <AdvisorAttentionPanel
          summary={makeSummary()}
          onOpenTasks={onOpenTasks}
          schedulingEnabled
        />
      </MemoryRouter>,
    );

    const prioritizationCard = screen.getByText('Queue needs a decision').closest('article');
    if (!prioritizationCard) {
      throw new Error('Expected prioritization attention card.');
    }

    fireEvent.click(within(prioritizationCard).getByRole('button', { name: 'Carry Over (1)' }));

    expect(onOpenTasks).toHaveBeenCalledWith({
      advisorId: 'prioritization',
      taskListPreset: 'carry_over',
      attentionContext: {
        advisorName: 'Prioritization',
        headline: 'Today work is stalling',
        reason: '1 task is still sitting in Today from an earlier sweep. Rebucket or schedule the real commitment before adding more.',
        planningLabel: 'Carry Over',
        planningCount: 1,
      },
    });
  });
});
