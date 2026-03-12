import type { AdvisorId } from '../../types/advisor';

export function buildSchemaSection(advisorId: AdvisorId): string {
  const prefix = advisorId.slice(0, 3).toUpperCase();

  return `[SESSION INSTRUCTIONS]
Conduct a focused advisory session. At the end of our conversation, output ONLY a valid JSON block wrapped in \`\`\`json code fences using this structure:

\`\`\`json
{
  "advisor": "${advisorId}",
  "date": "YYYY-MM-DD",
  "summary": "2-4 sentence recap of what was discussed and decided",
  "task_ops": {
    "create": [
      {
        "id": "${prefix}-XXX",
        "task": "Specific one-time task",
        "dueDate": "YYYY-MM-DD or ongoing",
        "priority": "high | medium | low"
      }
    ],
    "update": [
      {
        "id": "${prefix}-EXISTING",
        "task": "Updated task text if needed",
        "dueDate": "YYYY-MM-DD or ongoing",
        "priority": "high | medium | low"
      }
    ],
    "complete": ["${prefix}-EXISTING"],
    "defer": [
      {
        "id": "${prefix}-EXISTING",
        "reason": "Why this is being deferred",
        "newDueDate": "YYYY-MM-DD"
      }
    ],
    "close": ["${prefix}-EXISTING"]
  },
  "habit_ops": {
    "create": [
      {
        "id": "${prefix}H-XXX",
        "name": "Recurring habit",
        "cadence": "daily | weekly",
        "targetCount": 1,
        "unit": "times"
      }
    ],
    "update": [
      {
        "id": "${prefix}H-EXISTING",
        "name": "Updated habit name",
        "cadence": "daily | weekly",
        "targetCount": 1,
        "unit": "times",
        "status": "active | paused"
      }
    ],
    "archive": ["${prefix}H-EXISTING"]
  },
  "metrics": {
    "metric_name": 7
  },
  "context_for_next_session": "Key threads, unresolved questions, or important context to carry forward",
  "mood": "one-word emotional state",
  "energy": 7,
  "session_rating": 8,
  "narrative_update": "2-3 sentences updating the advisory relationship story",
  "card_preview": "1-2 sentence dashboard status update",
  "check_in_config": [
    {
      "id": "focus_quality",
      "label": "Focus quality",
      "type": "rating",
      "min": 1,
      "max": 10,
      "source": "metric"
    },
    {
      "id": "habit_consistency",
      "label": "Did the habit happen?",
      "type": "binary",
      "source": "habit",
      "linkedHabitId": "${prefix}H-EXISTING"
    }
  ]
}
\`\`\`

IMPORTANT RULES:
- Use ASCII characters only in the JSON output
- Use task_ops.update to change an existing task instead of creating duplicates
- Use habit_ops for recurring behaviors and task_ops for one-time work
- All metric values must be numeric; for yes/no values use 1 or 0
- If you do not want to change the daily check-in, omit check_in_config entirely
- Energy and session_rating must be integers from 1-10

Begin the session now.`;
}
