import type { SessionExport } from '../types/session';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { isValidDate } from '../utils/date';

export interface ValidationError {
  field: string;
  message: string;
  received: unknown;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed: SessionExport | null;
}

export function validateSessionExport(raw: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Expected a JSON object', received: typeof raw }],
      warnings: [],
      parsed: null,
    };
  }

  const obj = raw as Record<string, unknown>;

  // advisor
  if (typeof obj.advisor !== 'string' || !obj.advisor) {
    errors.push({ field: 'advisor', message: 'Required string (advisor ID)', received: obj.advisor });
  } else if (!ADVISOR_CONFIGS[obj.advisor as keyof typeof ADVISOR_CONFIGS]) {
    warnings.push({ field: 'advisor', message: `Unknown advisor ID "${obj.advisor}". Will be accepted but may not match a configured advisor.` });
  }

  // date
  if (typeof obj.date !== 'string' || !isValidDate(obj.date)) {
    errors.push({ field: 'date', message: 'Required date string (YYYY-MM-DD)', received: obj.date });
  }

  // summary
  if (typeof obj.summary !== 'string' || !obj.summary.trim()) {
    errors.push({ field: 'summary', message: 'Required non-empty string', received: obj.summary });
  }

  // action_items
  if (!Array.isArray(obj.action_items)) {
    errors.push({ field: 'action_items', message: 'Required array', received: obj.action_items });
  } else {
    obj.action_items.forEach((item: any, i: number) => {
      if (!item || typeof item !== 'object') {
        errors.push({ field: `action_items[${i}]`, message: 'Expected an object', received: item });
        return;
      }
      if (typeof item.id !== 'string' || !item.id) {
        errors.push({ field: `action_items[${i}].id`, message: 'Required string', received: item.id });
      }
      if (typeof item.task !== 'string' || !item.task) {
        errors.push({ field: `action_items[${i}].task`, message: 'Required string', received: item.task });
      }
      if (typeof item.due !== 'string' || !isValidDate(item.due)) {
        errors.push({ field: `action_items[${i}].due`, message: 'Required date (YYYY-MM-DD) or "ongoing"', received: item.due });
      }
      if (!['high', 'medium', 'low'].includes(item.priority)) {
        errors.push({ field: `action_items[${i}].priority`, message: 'Must be "high", "medium", or "low"', received: item.priority });
      }
    });
  }

  // completed_items
  if (!Array.isArray(obj.completed_items)) {
    if (obj.completed_items === undefined) {
      warnings.push({ field: 'completed_items', message: 'Missing field, defaulting to empty array' });
    } else {
      errors.push({ field: 'completed_items', message: 'Expected array of strings', received: obj.completed_items });
    }
  }

  // deferred_items
  if (!Array.isArray(obj.deferred_items)) {
    if (obj.deferred_items === undefined) {
      warnings.push({ field: 'deferred_items', message: 'Missing field, defaulting to empty array' });
    } else {
      errors.push({ field: 'deferred_items', message: 'Expected array', received: obj.deferred_items });
    }
  } else {
    obj.deferred_items.forEach((item: any, i: number) => {
      if (!item || typeof item !== 'object') {
        errors.push({ field: `deferred_items[${i}]`, message: 'Expected an object', received: item });
        return;
      }
      if (typeof item.id !== 'string') {
        errors.push({ field: `deferred_items[${i}].id`, message: 'Required string', received: item.id });
      }
      if (typeof item.reason !== 'string') {
        errors.push({ field: `deferred_items[${i}].reason`, message: 'Required string', received: item.reason });
      }
      if (typeof item.new_due !== 'string' || !isValidDate(item.new_due)) {
        errors.push({ field: `deferred_items[${i}].new_due`, message: 'Required date (YYYY-MM-DD)', received: item.new_due });
      }
    });
  }

  // metrics — coerce string-numbers to actual numbers
  if (obj.metrics !== undefined && (typeof obj.metrics !== 'object' || obj.metrics === null)) {
    errors.push({ field: 'metrics', message: 'Expected an object', received: obj.metrics });
  } else if (obj.metrics && typeof obj.metrics === 'object') {
    const metrics = obj.metrics as Record<string, unknown>;
    for (const [key, val] of Object.entries(metrics)) {
      if (typeof val === 'string') {
        const num = Number(val);
        if (!isNaN(num)) {
          metrics[key] = num;
        } else {
          warnings.push({ field: `metrics.${key}`, message: `Non-numeric metric value "${val}" — metrics should be numbers` });
        }
      } else if (typeof val === 'boolean') {
        metrics[key] = val ? 1 : 0;
      }
    }
  }

  // card_preview
  if (obj.card_preview !== undefined && typeof obj.card_preview !== 'string') {
    warnings.push({ field: 'card_preview', message: 'Expected string, will be ignored' });
  }

  // context_for_next_session
  if (typeof obj.context_for_next_session !== 'string') {
    if (obj.context_for_next_session === undefined) {
      warnings.push({ field: 'context_for_next_session', message: 'Missing field, defaulting to empty string' });
    } else {
      errors.push({ field: 'context_for_next_session', message: 'Expected string', received: obj.context_for_next_session });
    }
  }

  // mood
  if (typeof obj.mood !== 'string') {
    warnings.push({ field: 'mood', message: 'Missing or invalid, defaulting to "neutral"' });
  }

  // energy
  if (typeof obj.energy !== 'number' || obj.energy < 1 || obj.energy > 10) {
    warnings.push({ field: 'energy', message: 'Expected number 1-10, will use provided value or default to 5' });
  }

  // session_rating
  if (typeof obj.session_rating !== 'number' || obj.session_rating < 1 || obj.session_rating > 10) {
    warnings.push({ field: 'session_rating', message: 'Expected number 1-10, will use provided value or default to 5' });
  }

  // narrative_update
  if (typeof obj.narrative_update !== 'string') {
    warnings.push({ field: 'narrative_update', message: 'Missing or invalid, defaulting to empty string' });
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, parsed: null };
  }

  // Build the validated export with defaults for optional fields
  const parsed: SessionExport = {
    advisor: obj.advisor as string,
    date: obj.date as string,
    summary: obj.summary as string,
    action_items: (obj.action_items as any[]).map(item => ({
      id: item.id,
      task: item.task,
      due: item.due,
      priority: item.priority,
    })),
    completed_items: Array.isArray(obj.completed_items)
      ? obj.completed_items.filter((id: unknown): id is string => typeof id === 'string')
      : [],
    deferred_items: Array.isArray(obj.deferred_items)
      ? obj.deferred_items.map((item: any) => ({
          id: item.id,
          reason: item.reason,
          new_due: item.new_due,
        }))
      : [],
    metrics: (obj.metrics as Record<string, number | string>) ?? {},
    context_for_next_session: typeof obj.context_for_next_session === 'string'
      ? obj.context_for_next_session
      : '',
    mood: typeof obj.mood === 'string' ? obj.mood : 'neutral',
    energy: typeof obj.energy === 'number' ? Math.min(10, Math.max(1, Math.round(obj.energy))) : 5,
    session_rating: typeof obj.session_rating === 'number'
      ? Math.min(10, Math.max(1, Math.round(obj.session_rating)))
      : 5,
    narrative_update: typeof obj.narrative_update === 'string' ? obj.narrative_update : '',
    card_preview: typeof obj.card_preview === 'string' ? obj.card_preview : '',
  };

  return { valid: true, errors: [], warnings, parsed };
}
