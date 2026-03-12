import { describe, expect, it } from 'vitest';
import { parseSessionImport } from '../session-parser';
import { normalizeSessionImport } from '../import-normalizer';
import { createDefaultAdvisorState } from '../../state/init';

describe('parseSessionImport', () => {
  it('accepts ongoing due dates and check-in config', () => {
    const raw = `
\`\`\`json
{
  "advisor": "prioritization",
  "date": "2025-06-15",
  "summary": "Planning session",
  "task_ops": {
    "create": [
      { "task": "Review roadmap", "dueDate": "ongoing", "priority": "high" }
    ],
    "update": [],
    "complete": [],
    "defer": [],
    "close": []
  },
  "habit_ops": { "create": [], "update": [], "archive": [] },
  "metrics": { "clarity": "8", "did_ship": true },
  "context_for_next_session": "Check progress",
  "mood": "focused",
  "energy": "7",
  "session_rating": 8,
  "narrative_update": "Momentum improved",
  "card_preview": "Clearer week",
  "check_in_config": [
    { "id": "focus_quality", "label": "Focus quality", "type": "rating", "min": 1, "max": 10, "source": "metric" }
  ]
}
\`\`\`
`;

    const result = parseSessionImport(raw);

    expect(result.valid).toBe(true);
    expect(result.parsed?.task_ops.create[0]?.dueDate).toBe('ongoing');
    expect(result.parsed?.metrics.clarity).toBe(8);
    expect(result.parsed?.metrics.did_ship).toBe(1);
    expect(result.parsed?.check_in_config?.[0]?.id).toBe('focus_quality');
  });

  it('repairs legacy task fields into the new import shape', () => {
    const raw = JSON.stringify({
      advisor: 'prioritization',
      date: '2025-06-15',
      summary: 'Legacy import',
      action_items: [
        { id: 'PRI-123', task: 'Legacy task', due: '2025-06-20', priority: 'high' },
      ],
      completed_items: ['PRI-001'],
      deferred_items: [{ id: 'PRI-002', reason: 'Blocked', new_due: '2025-06-21' }],
      metrics: {},
      context_for_next_session: '',
      mood: 'focused',
      energy: 7,
      session_rating: 8,
      narrative_update: '',
      card_preview: '',
    });

    const result = parseSessionImport(raw);

    expect(result.valid).toBe(true);
    expect(result.parsed?.task_ops.create).toHaveLength(1);
    expect(result.parsed?.task_ops.complete).toEqual(['PRI-001']);
    expect(result.parsed?.task_ops.defer[0]?.newDueDate).toBe('2025-06-21');
  });
});

describe('normalizeSessionImport', () => {
  it('auto-merges a likely text match instead of duplicating the task', () => {
    const state = createDefaultAdvisorState('prioritization');
    const importResult = parseSessionImport(JSON.stringify({
      advisor: 'prioritization',
      date: '2025-06-15',
      summary: 'Merge update',
      task_ops: {
        create: [],
        update: [
          {
            match: state.tasks[0].task,
            task: `${state.tasks[0].task} with owner`,
            dueDate: '2025-06-20',
            priority: 'high',
          },
        ],
        complete: [],
        defer: [],
        close: [],
      },
      habit_ops: { create: [], update: [], archive: [] },
      metrics: {},
      context_for_next_session: '',
      mood: 'focused',
      energy: 7,
      session_rating: 8,
      narrative_update: '',
      card_preview: '',
    }));

    expect(importResult.valid).toBe(true);
    const normalized = normalizeSessionImport(state, importResult.parsed!);

    expect(normalized.taskCreates).toHaveLength(0);
    expect(normalized.taskUpdates).toHaveLength(1);
    expect(normalized.preview.tasks[0]?.type).toBe('auto-merge');
  });
});
