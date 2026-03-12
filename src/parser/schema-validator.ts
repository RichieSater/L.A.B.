import type { MetricDefinition, MetricType } from '../types/metrics';
import type {
  HabitCreateOperation,
  HabitUpdateOperation,
  SessionImport,
  TaskCreateOperation,
  TaskDeferOperation,
  TaskUpdateOperation,
} from '../types/session';
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
  parsed: SessionImport | null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toNumberLike(value: unknown): unknown {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return value;
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  return value;
}

function coerceMetricDefinition(
  raw: unknown,
  field: string,
  errors: ValidationError[],
): MetricDefinition | null {
  if (!isObject(raw)) {
    errors.push({ field, message: 'Expected an object', received: raw });
    return null;
  }

  const type = raw.type;
  if (
    typeof raw.id !== 'string' ||
    !raw.id ||
    typeof raw.label !== 'string' ||
    !raw.label ||
    typeof type !== 'string' ||
    !['number', 'rating', 'currency', 'percentage', 'binary'].includes(type)
  ) {
    errors.push({ field, message: 'Invalid check-in item definition', received: raw });
    return null;
  }

  return {
    id: raw.id,
    label: raw.label,
    type: type as MetricType,
    unit: typeof raw.unit === 'string' ? raw.unit : undefined,
    min: typeof raw.min === 'number' ? raw.min : undefined,
    max: typeof raw.max === 'number' ? raw.max : undefined,
    quickLoggable: true,
    source: raw.source === 'habit' ? 'habit' : 'metric',
    linkedHabitId: typeof raw.linkedHabitId === 'string'
      ? raw.linkedHabitId
      : typeof raw.habitId === 'string'
        ? raw.habitId
        : undefined,
  };
}

function coerceTaskCreate(
  raw: unknown,
  field: string,
  errors: ValidationError[],
): TaskCreateOperation | null {
  if (!isObject(raw)) {
    errors.push({ field, message: 'Expected an object', received: raw });
    return null;
  }

  const dueDate = typeof raw.dueDate === 'string'
    ? raw.dueDate
    : typeof raw.due === 'string'
      ? raw.due
      : undefined;

  if (
    typeof raw.task !== 'string' ||
    !raw.task ||
    typeof dueDate !== 'string' ||
    !(dueDate === 'ongoing' || isValidDate(dueDate)) ||
    !['high', 'medium', 'low'].includes(String(raw.priority))
  ) {
    errors.push({ field, message: 'Invalid task create operation', received: raw });
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    task: raw.task,
    dueDate,
    priority: raw.priority as TaskCreateOperation['priority'],
  };
}

function coerceTaskUpdate(
  raw: unknown,
  field: string,
  errors: ValidationError[],
): TaskUpdateOperation | null {
  if (!isObject(raw)) {
    errors.push({ field, message: 'Expected an object', received: raw });
    return null;
  }

  const dueDate = typeof raw.dueDate === 'string'
    ? raw.dueDate
    : typeof raw.due === 'string'
      ? raw.due
      : undefined;

  if (
    (raw.id !== undefined && typeof raw.id !== 'string') ||
    (raw.match !== undefined && typeof raw.match !== 'string') ||
    (raw.task !== undefined && typeof raw.task !== 'string') ||
    (dueDate !== undefined && !(dueDate === 'ongoing' || isValidDate(dueDate))) ||
    (raw.priority !== undefined && !['high', 'medium', 'low'].includes(String(raw.priority)))
  ) {
    errors.push({ field, message: 'Invalid task update operation', received: raw });
    return null;
  }

  if (!raw.id && !raw.match && !raw.task) {
    errors.push({ field, message: 'Task update needs an id, match, or task', received: raw });
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    match: typeof raw.match === 'string' && raw.match ? raw.match : undefined,
    task: typeof raw.task === 'string' && raw.task ? raw.task : undefined,
    dueDate,
    priority: raw.priority as TaskUpdateOperation['priority'] | undefined,
  };
}

function coerceTaskDefer(
  raw: unknown,
  field: string,
  errors: ValidationError[],
): TaskDeferOperation | null {
  if (!isObject(raw)) {
    errors.push({ field, message: 'Expected an object', received: raw });
    return null;
  }

  const newDueDate = typeof raw.newDueDate === 'string'
    ? raw.newDueDate
    : typeof raw.new_due === 'string'
      ? raw.new_due
      : undefined;

  if (
    (raw.id !== undefined && typeof raw.id !== 'string') ||
    (raw.match !== undefined && typeof raw.match !== 'string') ||
    typeof raw.reason !== 'string' ||
    !raw.reason ||
    typeof newDueDate !== 'string' ||
    !isValidDate(newDueDate)
  ) {
    errors.push({ field, message: 'Invalid task defer operation', received: raw });
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    match: typeof raw.match === 'string' && raw.match ? raw.match : undefined,
    reason: raw.reason,
    newDueDate,
  };
}

function coerceHabitCreate(
  raw: unknown,
  field: string,
  errors: ValidationError[],
): HabitCreateOperation | null {
  if (!isObject(raw)) {
    errors.push({ field, message: 'Expected an object', received: raw });
    return null;
  }

  if (
    typeof raw.name !== 'string' ||
    !raw.name ||
    !['daily', 'weekly'].includes(String(raw.cadence)) ||
    (raw.targetCount !== undefined && typeof raw.targetCount !== 'number') ||
    (raw.unit !== undefined && typeof raw.unit !== 'string')
  ) {
    errors.push({ field, message: 'Invalid habit create operation', received: raw });
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    name: raw.name,
    cadence: raw.cadence as HabitCreateOperation['cadence'],
    targetCount: typeof raw.targetCount === 'number' ? raw.targetCount : undefined,
    unit: typeof raw.unit === 'string' ? raw.unit : undefined,
  };
}

function coerceHabitUpdate(
  raw: unknown,
  field: string,
  errors: ValidationError[],
): HabitUpdateOperation | null {
  if (!isObject(raw)) {
    errors.push({ field, message: 'Expected an object', received: raw });
    return null;
  }

  if (
    (raw.id !== undefined && typeof raw.id !== 'string') ||
    (raw.match !== undefined && typeof raw.match !== 'string') ||
    (raw.name !== undefined && typeof raw.name !== 'string') ||
    (raw.cadence !== undefined && !['daily', 'weekly'].includes(String(raw.cadence))) ||
    (raw.targetCount !== undefined && typeof raw.targetCount !== 'number') ||
    (raw.unit !== undefined && typeof raw.unit !== 'string') ||
    (raw.status !== undefined && !['active', 'paused'].includes(String(raw.status)))
  ) {
    errors.push({ field, message: 'Invalid habit update operation', received: raw });
    return null;
  }

  if (!raw.id && !raw.match && !raw.name) {
    errors.push({ field, message: 'Habit update needs an id, match, or name', received: raw });
    return null;
  }

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : undefined,
    match: typeof raw.match === 'string' && raw.match ? raw.match : undefined,
    name: typeof raw.name === 'string' && raw.name ? raw.name : undefined,
    cadence: raw.cadence as HabitUpdateOperation['cadence'] | undefined,
    targetCount: typeof raw.targetCount === 'number' ? raw.targetCount : undefined,
    unit: typeof raw.unit === 'string' ? raw.unit : undefined,
    status: raw.status as HabitUpdateOperation['status'] | undefined,
  };
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
}

export function validateSessionImport(raw: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isObject(raw)) {
    return {
      valid: false,
      errors: [{ field: 'root', message: 'Expected a JSON object', received: raw }],
      warnings,
      parsed: null,
    };
  }

  const advisor = raw.advisor;
  if (typeof advisor !== 'string' || !advisor) {
    errors.push({ field: 'advisor', message: 'Required string (advisor ID)', received: advisor });
  } else if (!ADVISOR_CONFIGS[advisor as keyof typeof ADVISOR_CONFIGS]) {
    warnings.push({ field: 'advisor', message: `Unknown advisor ID "${advisor}"` });
  }

  if (typeof raw.date !== 'string' || !isValidDate(raw.date)) {
    errors.push({ field: 'date', message: 'Required date string (YYYY-MM-DD)', received: raw.date });
  }

  if (typeof raw.summary !== 'string' || !raw.summary.trim()) {
    errors.push({ field: 'summary', message: 'Required non-empty string', received: raw.summary });
  }

  const legacyActionItems = Array.isArray(raw.action_items) ? raw.action_items : [];
  const legacyCompletedItems = Array.isArray(raw.completed_items) ? raw.completed_items : [];
  const legacyDeferredItems = Array.isArray(raw.deferred_items) ? raw.deferred_items : [];

  const taskOpsRaw = isObject(raw.task_ops) ? raw.task_ops : {};
  const habitOpsRaw = isObject(raw.habit_ops) ? raw.habit_ops : {};

  const taskCreateEntries = [
    ...legacyActionItems,
    ...(Array.isArray(taskOpsRaw.create) ? taskOpsRaw.create : []),
  ];
  const taskUpdateEntries = Array.isArray(taskOpsRaw.update) ? taskOpsRaw.update : [];
  const taskCompleteEntries = [
    ...legacyCompletedItems,
    ...stringArray(taskOpsRaw.complete),
  ];
  const taskDeferEntries = [
    ...legacyDeferredItems,
    ...(Array.isArray(taskOpsRaw.defer) ? taskOpsRaw.defer : []),
  ];
  const taskCloseEntries = stringArray(taskOpsRaw.close);

  const habitCreateEntries = Array.isArray(habitOpsRaw.create) ? habitOpsRaw.create : [];
  const habitUpdateEntries = Array.isArray(habitOpsRaw.update) ? habitOpsRaw.update : [];
  const habitArchiveEntries = stringArray(habitOpsRaw.archive);

  const taskCreates = taskCreateEntries
    .map((entry, index) => coerceTaskCreate(entry, `task_ops.create[${index}]`, errors))
    .filter((entry): entry is TaskCreateOperation => !!entry);

  const taskUpdates = taskUpdateEntries
    .map((entry, index) => coerceTaskUpdate(entry, `task_ops.update[${index}]`, errors))
    .filter((entry): entry is TaskUpdateOperation => !!entry);

  const taskDefers = taskDeferEntries
    .map((entry, index) => coerceTaskDefer(entry, `task_ops.defer[${index}]`, errors))
    .filter((entry): entry is TaskDeferOperation => !!entry);

  const habitCreates = habitCreateEntries
    .map((entry, index) => coerceHabitCreate(entry, `habit_ops.create[${index}]`, errors))
    .filter((entry): entry is HabitCreateOperation => !!entry);

  const habitUpdates = habitUpdateEntries
    .map((entry, index) => coerceHabitUpdate(entry, `habit_ops.update[${index}]`, errors))
    .filter((entry): entry is HabitUpdateOperation => !!entry);

  const metrics: Record<string, number | string> = {};
  if (raw.metrics !== undefined && !isObject(raw.metrics)) {
    errors.push({ field: 'metrics', message: 'Expected an object', received: raw.metrics });
  } else if (isObject(raw.metrics)) {
    for (const [key, value] of Object.entries(raw.metrics)) {
      const coerced = toNumberLike(value);
      if (typeof coerced === 'number' || typeof coerced === 'string') {
        metrics[key] = coerced;
      } else {
        warnings.push({ field: `metrics.${key}`, message: 'Dropped unsupported metric value' });
      }
    }
  }

  const checkInSource = Array.isArray(raw.check_in_config)
    ? raw.check_in_config
    : Array.isArray(raw.check_in_items)
      ? raw.check_in_items
      : undefined;

  const checkInConfig = checkInSource
    ?.map((entry, index) => coerceMetricDefinition(entry, `check_in_config[${index}]`, errors))
    .filter((entry): entry is MetricDefinition => !!entry);

  if (typeof raw.context_for_next_session !== 'string' && raw.context_for_next_session !== undefined) {
    errors.push({
      field: 'context_for_next_session',
      message: 'Expected string',
      received: raw.context_for_next_session,
    });
  }

  if (raw.mood !== undefined && typeof raw.mood !== 'string') {
    warnings.push({ field: 'mood', message: 'Invalid mood, defaulting to neutral' });
  }

  const energy = toNumberLike(raw.energy);
  const sessionRating = toNumberLike(raw.session_rating);
  if (energy !== undefined && typeof energy !== 'number') {
    warnings.push({ field: 'energy', message: 'Invalid energy, defaulting to 5' });
  }
  if (sessionRating !== undefined && typeof sessionRating !== 'number') {
    warnings.push({ field: 'session_rating', message: 'Invalid session rating, defaulting to 5' });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      parsed: null,
    };
  }

  return {
    valid: true,
    errors: [],
    warnings,
    parsed: {
      advisor: advisor as string,
      date: raw.date as string,
      summary: raw.summary as string,
      task_ops: {
        create: taskCreates,
        update: taskUpdates,
        complete: taskCompleteEntries,
        defer: taskDefers,
        close: taskCloseEntries,
      },
      habit_ops: {
        create: habitCreates,
        update: habitUpdates,
        archive: habitArchiveEntries,
      },
      metrics,
      context_for_next_session: typeof raw.context_for_next_session === 'string'
        ? raw.context_for_next_session
        : '',
      mood: typeof raw.mood === 'string' ? raw.mood : 'neutral',
      energy: typeof energy === 'number' ? Math.min(10, Math.max(1, Math.round(energy))) : 5,
      session_rating: typeof sessionRating === 'number'
        ? Math.min(10, Math.max(1, Math.round(sessionRating)))
        : 5,
      narrative_update: typeof raw.narrative_update === 'string' ? raw.narrative_update : '',
      card_preview: typeof raw.card_preview === 'string' ? raw.card_preview : '',
      check_in_config: checkInConfig,
    },
  };
}
