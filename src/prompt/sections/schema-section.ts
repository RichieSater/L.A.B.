import type { AdvisorId } from '../../types/advisor';

export function buildSchemaSection(advisorId: AdvisorId): string {
  return `[SESSION INSTRUCTIONS]
Conduct a focused advisory session. At the end of our conversation, you MUST produce a JSON export block wrapped in \`\`\`json code fences in EXACTLY this format:

\`\`\`json
{
  "advisor": "${advisorId}",
  "date": "YYYY-MM-DD",
  "summary": "2-4 sentence recap of what was discussed and decided",
  "action_items": [
    {
      "id": "${advisorId.slice(0, 3).toUpperCase()}-XXX",
      "task": "Specific actionable task description",
      "due": "YYYY-MM-DD or ongoing",
      "priority": "high | medium | low"
    }
  ],
  "completed_items": ["ID-of-previously-open-item-now-done"],
  "deferred_items": [
    {
      "id": "ID-of-item-being-deferred",
      "reason": "Why this is being deferred",
      "new_due": "YYYY-MM-DD"
    }
  ],
  "metrics": {
    "metric_name": 7
  },
  "context_for_next_session": "Key threads, unresolved questions, or important context to carry forward to next session",
  "mood": "one-word emotional state tag (e.g. focused, anxious, motivated, drained)",
  "energy": 7,
  "session_rating": 8,
  "narrative_update": "2-3 sentences updating the ongoing story of our advisory relationship. What changed, what was learned, what shifted.",
  "card_preview": "1-2 sentence status update for the dashboard card reflecting current focus and progress",
  "check_in_items": [
    {
      "id": "custom_metric_id",
      "label": "Display Label",
      "type": "rating | number | binary",
      "min": 1,
      "max": 10
    }
  ]
}
\`\`\`

IMPORTANT RULES FOR THE JSON EXPORT:
- The JSON must be valid and parseable
- action_items: To UPDATE an existing task (change its due date, priority, or description), include it with the SAME ID it already has. To create a genuinely NEW task, use a new unique ID with the format ${advisorId.slice(0, 3).toUpperCase()}-XXX. NEVER create a duplicate of an existing task — if you want to modify a task, reuse its existing ID.
- completed_items: Reference IDs of previously open items that are now done
- deferred_items: Reference IDs of items being pushed back, with a reason and new date
- metrics: ALL metric values MUST be numbers (integers or decimals). For yes/no metrics use 1 or 0. No strings allowed in metric values.
- energy and session_rating: integers from 1-10
- narrative_update: This becomes part of the permanent record of our relationship
- card_preview: A short 1-2 sentence status shown on your dashboard card. Reflect current focus, progress, or next milestone.
- check_in_items (OPTIONAL): Customize what the user tracks in their daily check-in. Include an array of metric definitions tailored to this specific user's situation and goals. Each needs: id (string), label (string), type ("rating"|"number"|"binary"), and optionally min/max/unit. Only include this when you want to change what the user logs daily. If omitted, previous custom items (or defaults) are preserved. Make these specific and relevant to the user — e.g. "Relationship anxiety" instead of generic "Mood".

Begin the session now.`;
}
