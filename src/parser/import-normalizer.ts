import type { AdvisorState } from '../types/advisor';
import type { HabitItem, TaskItem } from '../types/action-item';
import type {
  HabitPreviewChange,
  NormalizedSessionImport,
  SessionImport,
  TaskPreviewChange,
} from '../types/session';
import { generateId } from '../utils/id';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function resolveTask(
  state: AdvisorState,
  id: string | undefined,
  match: string | undefined,
  task: string | undefined,
): { item: TaskItem; matchedBy: 'id' | 'text' } | null {
  if (id) {
    const byId = state.tasks.find(item => item.id === id);
    if (byId) {
      return { item: byId, matchedBy: 'id' };
    }
  }

  const needle = normalizeText(match ?? task ?? '');
  if (!needle) {
    return null;
  }

  const candidates = state.tasks.filter(item => {
    if (!['open', 'deferred'].includes(item.status)) {
      return false;
    }

    const haystack = normalizeText(item.task);
    return haystack === needle || haystack.includes(needle) || needle.includes(haystack);
  });

  if (candidates.length !== 1) {
    return null;
  }

  return { item: candidates[0], matchedBy: 'text' };
}

function resolveHabit(
  state: AdvisorState,
  id: string | undefined,
  match: string | undefined,
  name: string | undefined,
): { item: HabitItem; matchedBy: 'id' | 'text' } | null {
  if (id) {
    const byId = state.habits.find(item => item.id === id);
    if (byId) {
      return { item: byId, matchedBy: 'id' };
    }
  }

  const needle = normalizeText(match ?? name ?? '');
  if (!needle) {
    return null;
  }

  const candidates = state.habits.filter(item => {
    if (!['active', 'paused'].includes(item.status)) {
      return false;
    }

    const haystack = normalizeText(item.name);
    return haystack === needle || haystack.includes(needle) || needle.includes(haystack);
  });

  if (candidates.length !== 1) {
    return null;
  }

  return { item: candidates[0], matchedBy: 'text' };
}

export function normalizeSessionImport(
  state: AdvisorState,
  sessionImport: SessionImport,
): NormalizedSessionImport {
  const taskPrefix = state.advisorId.slice(0, 3).toUpperCase();
  const habitPrefix = `${taskPrefix}H`;

  const taskCreates: TaskItem[] = sessionImport.task_ops.create.map(entry => ({
    id: entry.id || generateId(taskPrefix),
    task: entry.task,
    dueDate: entry.dueDate,
    due: entry.dueDate,
    priority: entry.priority,
    status: 'open' as const,
    createdDate: sessionImport.date,
    sourceSessionDate: sessionImport.date,
  }));

  const taskUpdates: NormalizedSessionImport['taskUpdates'] = [];
  const taskCompletes: string[] = [];
  const taskDefers: Array<{ id: string; reason: string; newDueDate: string }> = [];
  const taskCloses: string[] = [];
  const taskPreview: TaskPreviewChange[] = taskCreates.map(task => ({
    type: 'create' as const,
    taskId: task.id,
    after: task,
  }));

  for (const entry of sessionImport.task_ops.update) {
    const resolved = resolveTask(state, entry.id, entry.match, entry.task);
    if (!resolved) {
      const syntheticTask = {
        id: entry.id || generateId(taskPrefix),
        task: entry.task ?? entry.match ?? 'Untitled task',
        dueDate: entry.dueDate ?? 'ongoing',
        due: entry.dueDate ?? 'ongoing',
        priority: entry.priority ?? 'medium',
        status: 'open' as const,
        createdDate: sessionImport.date,
        sourceSessionDate: sessionImport.date,
      } satisfies TaskItem;
      taskCreates.push(syntheticTask);
      taskPreview.push({
        type: 'create',
        taskId: syntheticTask.id,
        after: syntheticTask,
        reason: 'No existing task matched update request; created as new task.',
      });
      continue;
    }

    const after: TaskItem = {
      ...resolved.item,
      task: entry.task ?? resolved.item.task,
      dueDate: entry.dueDate ?? resolved.item.dueDate,
      due: entry.dueDate ?? resolved.item.dueDate,
      priority: entry.priority ?? resolved.item.priority,
      status: resolved.item.status === 'deferred' ? 'open' : resolved.item.status,
    };

    taskUpdates.push({
      id: resolved.item.id,
      changes: {
        task: after.task,
        dueDate: after.dueDate,
        priority: after.priority,
        status: after.status,
      },
      matchedBy: resolved.matchedBy,
    });
    taskPreview.push({
      type: resolved.matchedBy === 'id' ? 'update' : 'auto-merge',
      taskId: resolved.item.id,
      before: resolved.item,
      after,
      matchedBy: resolved.matchedBy,
    });
  }

  for (const ref of sessionImport.task_ops.complete) {
    const resolved = resolveTask(state, ref, ref, ref);
    if (!resolved) {
      continue;
    }

    taskCompletes.push(resolved.item.id);
    taskPreview.push({
      type: 'complete',
      taskId: resolved.item.id,
      before: resolved.item,
      after: {
        ...resolved.item,
        status: 'completed',
        completedDate: sessionImport.date,
      },
      matchedBy: resolved.matchedBy,
    });
  }

  for (const entry of sessionImport.task_ops.defer) {
    const resolved = resolveTask(state, entry.id, entry.match, undefined);
    if (!resolved) {
      continue;
    }

    taskDefers.push({
      id: resolved.item.id,
      reason: entry.reason,
      newDueDate: entry.newDueDate,
    });
    taskPreview.push({
      type: 'defer',
      taskId: resolved.item.id,
      before: resolved.item,
      after: {
        ...resolved.item,
        dueDate: entry.newDueDate,
        due: entry.newDueDate,
        status: 'deferred',
        deferredReason: entry.reason,
      },
      reason: entry.reason,
      matchedBy: resolved.matchedBy,
    });
  }

  for (const ref of sessionImport.task_ops.close) {
    const resolved = resolveTask(state, ref, ref, ref);
    if (!resolved) {
      continue;
    }

    taskCloses.push(resolved.item.id);
    taskPreview.push({
      type: 'close',
      taskId: resolved.item.id,
      before: resolved.item,
      after: {
        ...resolved.item,
        status: 'closed',
      },
      matchedBy: resolved.matchedBy,
    });
  }

  const habitCreates: HabitItem[] = sessionImport.habit_ops.create.map(entry => ({
    id: entry.id || generateId(habitPrefix),
    name: entry.name,
    cadence: entry.cadence,
    targetCount: entry.targetCount ?? 1,
    unit: entry.unit,
    status: 'active' as const,
    createdDate: sessionImport.date,
    sourceSessionDate: sessionImport.date,
  }));

  const habitUpdates: NormalizedSessionImport['habitUpdates'] = [];
  const habitArchives: string[] = [];
  const habitPreview: HabitPreviewChange[] = habitCreates.map(habit => ({
    type: 'create' as const,
    habitId: habit.id,
    after: habit,
  }));

  for (const entry of sessionImport.habit_ops.update) {
    const resolved = resolveHabit(state, entry.id, entry.match, entry.name);
    if (!resolved) {
      const syntheticHabit = {
        id: entry.id || generateId(habitPrefix),
        name: entry.name ?? entry.match ?? 'Untitled habit',
        cadence: entry.cadence ?? 'daily',
        targetCount: entry.targetCount ?? 1,
        unit: entry.unit,
        status: entry.status ?? 'active',
        createdDate: sessionImport.date,
        sourceSessionDate: sessionImport.date,
      } satisfies HabitItem;
      habitCreates.push(syntheticHabit);
      habitPreview.push({
        type: 'create',
        habitId: syntheticHabit.id,
        after: syntheticHabit,
      });
      continue;
    }

    const after: HabitItem = {
      ...resolved.item,
      name: entry.name ?? resolved.item.name,
      cadence: entry.cadence ?? resolved.item.cadence,
      targetCount: entry.targetCount ?? resolved.item.targetCount,
      unit: entry.unit ?? resolved.item.unit,
      status: entry.status ?? resolved.item.status,
    };

    habitUpdates.push({
      id: resolved.item.id,
      changes: {
        name: after.name,
        cadence: after.cadence,
        targetCount: after.targetCount,
        unit: after.unit,
        status: after.status,
      },
      matchedBy: resolved.matchedBy,
    });
    habitPreview.push({
      type: 'update',
      habitId: resolved.item.id,
      before: resolved.item,
      after,
      matchedBy: resolved.matchedBy,
    });
  }

  for (const ref of sessionImport.habit_ops.archive) {
    const resolved = resolveHabit(state, ref, ref, ref);
    if (!resolved) {
      continue;
    }

    habitArchives.push(resolved.item.id);
    habitPreview.push({
      type: 'archive',
      habitId: resolved.item.id,
      before: resolved.item,
      after: {
        ...resolved.item,
        status: 'archived',
        archivedDate: sessionImport.date,
      },
      matchedBy: resolved.matchedBy,
    });
  }

  return {
    sessionImport,
    taskCreates,
    taskUpdates,
    taskCompletes,
    taskDefers,
    taskCloses,
    habitCreates,
    habitUpdates,
    habitArchives,
    checkInConfig: sessionImport.check_in_config ?? null,
    preview: {
      tasks: taskPreview,
      habits: habitPreview,
      checkInConfigChanged: !!sessionImport.check_in_config,
    },
  };
}
