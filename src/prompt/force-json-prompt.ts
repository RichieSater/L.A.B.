import type { AdvisorId } from '../types/advisor';

export function buildForceJsonPrompt(advisorId: AdvisorId): string {
  const prefix = advisorId.slice(0, 3).toUpperCase();

  return `Produce the final session import JSON now. Output only one valid JSON block inside \`\`\`json fences.

\`\`\`json
{
  "advisor": "${advisorId}",
  "date": "YYYY-MM-DD",
  "summary": "2-4 sentence recap",
  "task_ops": {
    "create": [],
    "update": [],
    "complete": [],
    "defer": [],
    "close": []
  },
  "habit_ops": {
    "create": [],
    "update": [],
    "archive": []
  },
  "metrics": {
    "metric_name": 7
  },
  "context_for_next_session": "Key context to carry forward",
  "mood": "focused",
  "energy": 7,
  "session_rating": 8,
  "narrative_update": "2-3 sentence relationship update",
  "card_preview": "1-2 sentence dashboard status",
  "check_in_config": [
    {
      "id": "${prefix}_metric",
      "label": "Custom check-in field",
      "type": "rating",
      "min": 1,
      "max": 10,
      "source": "metric"
    }
  ]
}
\`\`\`

Use ASCII only. Use task_ops.update instead of duplicating an existing task. Use habit_ops for recurring habits.`;
}
