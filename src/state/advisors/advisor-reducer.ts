import type { AdvisorState } from '../../types/advisor';
import type { NormalizedSessionImport } from '../../types/session';
import type { HabitItem, TaskItem, TaskStatus } from '../../types/action-item';
import { generateId } from '../../utils/id';
import { today, addDays } from '../../utils/date';
import { ADVISOR_CONFIGS } from '../../advisors/registry';

export function applySessionImport(
  state: AdvisorState,
  normalizedImport: NormalizedSessionImport,
): AdvisorState {
  const config = ADVISOR_CONFIGS[state.advisorId];
  const sessionImport = normalizedImport.sessionImport;
  const sessionDate = sessionImport.date || today();

  let tasks = [...state.tasks];

  tasks = tasks.map(item => {
    const update = normalizedImport.taskUpdates.find(entry => entry.id === item.id);
    if (!update) {
      return item;
    }

    const nextItem = { ...item, ...update.changes };
    return {
      ...nextItem,
      due: nextItem.dueDate,
    };
  });

  tasks = tasks.map(item => {
    if (normalizedImport.taskCompletes.includes(item.id)) {
      return { ...item, status: 'completed' as const, completedDate: sessionDate };
    }

    const deferred = normalizedImport.taskDefers.find(entry => entry.id === item.id);
    if (deferred) {
      return {
        ...item,
        dueDate: deferred.newDueDate,
        due: deferred.newDueDate,
        status: 'deferred' as const,
        deferredReason: deferred.reason,
      };
    }

    if (normalizedImport.taskCloses.includes(item.id)) {
      return { ...item, status: 'closed' as const };
    }

    return item;
  });

  const newTasks: TaskItem[] = normalizedImport.taskCreates.map(item => ({
    ...item,
    id: item.id || generateId(state.advisorId.slice(0, 3).toUpperCase()),
    due: item.dueDate,
  }));

  let habits = [...state.habits];
  habits = habits.map(item => {
    const update = normalizedImport.habitUpdates.find(entry => entry.id === item.id);
    if (!update) {
      return item;
    }

    return { ...item, ...update.changes };
  });
  habits = habits.map(item => {
    if (normalizedImport.habitArchives.includes(item.id)) {
      return {
        ...item,
        status: 'archived' as const,
        archivedDate: sessionDate,
      };
    }

    return item;
  });

  const newHabits: HabitItem[] = normalizedImport.habitCreates;

  // 3. Update metrics
  const newMetricsLatest = { ...state.metricsLatest, ...sessionImport.metrics };
  const newHistoryEntry = {
    date: sessionDate,
    values: { ...sessionImport.metrics },
  };

  // 4. Create session record
  const sessionRecord = {
    id: generateId('sess'),
    advisorId: state.advisorId,
    date: sessionDate,
    summary: sessionImport.summary,
    mood: sessionImport.mood,
    energy: sessionImport.energy,
    sessionRating: sessionImport.session_rating,
    tasksCreated: newTasks.length,
    tasksCompleted: normalizedImport.taskCompletes.length,
    habitsCreated: newHabits.length,
    narrativeUpdate: sessionImport.narrative_update,
    rawImport: sessionImport,
  };

  // 5. Update narrative
  const narrativeAddition = sessionImport.narrative_update
    ? `\n\n[Session ${sessionDate}] ${sessionImport.narrative_update}`
    : '';

  // 6. Calculate streak
  let newStreak = state.streak;
  if (state.nextDueDate) {
    const dueDate = new Date(state.nextDueDate + 'T00:00:00');
    const sessionDateObj = new Date(sessionDate + 'T00:00:00');
    const windowMs = config.defaultCadence.windowDays * 24 * 60 * 60 * 1000;
    if (sessionDateObj.getTime() <= dueDate.getTime() + windowMs) {
      newStreak = state.streak + 1;
    } else {
      newStreak = 1; // Reset streak if overdue beyond window
    }
  } else {
    newStreak = 1; // First session
  }

  // 7. Calculate next due date
  const interval = config.defaultCadence.boostedIntervalDays && config.defaultCadence.boostedUntil
    ? (sessionDate <= config.defaultCadence.boostedUntil
      ? config.defaultCadence.boostedIntervalDays
      : config.defaultCadence.intervalDays)
    : config.defaultCadence.intervalDays;
  const nextDue = addDays(sessionDate, Math.ceil(interval));

    return {
    ...state,
    tasks: [...tasks, ...newTasks],
    habits: [...habits, ...newHabits],
    metricsLatest: newMetricsLatest,
    metricsHistory: [...state.metricsHistory, newHistoryEntry],
    sessions: [...state.sessions, sessionRecord],
    narrative: state.narrative + narrativeAddition,
    lastSessionDate: sessionDate,
    lastSessionSummary: sessionImport.summary,
    contextForNextSession: sessionImport.context_for_next_session,
    cardPreview: sessionImport.card_preview || state.cardPreview,
    streak: newStreak,
    nextDueDate: nextDue,
    checkInConfig: normalizedImport.checkInConfig?.map(item => ({
      ...item,
      quickLoggable: true,
    })) ?? state.checkInConfig,
  };
}

export function updateTaskStatus(
  state: AdvisorState,
  taskId: string,
  status: TaskStatus,
): AdvisorState {
  return {
    ...state,
    tasks: state.tasks.map(item =>
      item.id === taskId
        ? {
            ...item,
            status,
            completedDate: status === 'completed' ? today() : undefined,
          }
        : item,
    ),
  };
}
