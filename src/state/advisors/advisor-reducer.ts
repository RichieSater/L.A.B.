import type { AdvisorState } from '../../types/advisor';
import type { SessionExport } from '../../types/session';
import type { ActionItem, ActionItemStatus } from '../../types/action-item';
import { generateId } from '../../utils/id';
import { today, addDays } from '../../utils/date';
import { ADVISOR_CONFIGS } from '../../advisors/registry';

export function applySessionImport(
  state: AdvisorState,
  sessionExport: SessionExport,
): AdvisorState {
  const config = ADVISOR_CONFIGS[state.advisorId];
  const sessionDate = sessionExport.date || today();

  // 1. Process completed items
  const updatedItems = state.actionItems.map(item => {
    if (sessionExport.completed_items.includes(item.id)) {
      return { ...item, status: 'completed' as const, completedDate: sessionDate };
    }
    // Check for deferred items
    const deferred = sessionExport.deferred_items.find(d => d.id === item.id);
    if (deferred) {
      return {
        ...item,
        status: 'deferred' as const,
        deferredReason: deferred.reason,
        newDue: deferred.new_due,
        due: deferred.new_due,
      };
    }
    return item;
  });

  // 2. Split action_items into updates (matching existing IDs) vs truly new items
  const existingIds = new Set(updatedItems.map(i => i.id));
  const itemUpdates = sessionExport.action_items.filter(
    item => item.id && existingIds.has(item.id),
  );
  const brandNewItems = sessionExport.action_items.filter(
    item => !item.id || !existingIds.has(item.id),
  );

  // Apply in-place updates to existing open items (task text, due date, priority)
  const finalItems = updatedItems.map(item => {
    const update = itemUpdates.find(u => u.id === item.id);
    if (update && item.status === 'open') {
      return { ...item, task: update.task, due: update.due, priority: update.priority };
    }
    return item;
  });

  // Create only genuinely new items
  const prefix = state.advisorId.slice(0, 3).toUpperCase();
  const newItems: ActionItem[] = brandNewItems.map(item => ({
    id: item.id || generateId(prefix),
    task: item.task,
    due: item.due,
    priority: item.priority,
    status: 'open' as const,
    createdDate: sessionDate,
    sourceSessionDate: sessionDate,
  }));

  // 3. Update metrics
  const newMetricsLatest = { ...state.metricsLatest, ...sessionExport.metrics };
  const newHistoryEntry = {
    date: sessionDate,
    values: { ...sessionExport.metrics },
  };

  // 4. Create session record
  const sessionRecord = {
    id: generateId('sess'),
    advisorId: state.advisorId,
    date: sessionDate,
    summary: sessionExport.summary,
    mood: sessionExport.mood,
    energy: sessionExport.energy,
    sessionRating: sessionExport.session_rating,
    actionItemsCreated: newItems.length,
    actionItemsCompleted: sessionExport.completed_items.length,
    narrativeUpdate: sessionExport.narrative_update,
    rawExport: sessionExport,
  };

  // 5. Update narrative
  const narrativeAddition = sessionExport.narrative_update
    ? `\n\n[Session ${sessionDate}] ${sessionExport.narrative_update}`
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
    actionItems: [...finalItems, ...newItems],
    metricsLatest: newMetricsLatest,
    metricsHistory: [...state.metricsHistory, newHistoryEntry],
    sessions: [...state.sessions, sessionRecord],
    narrative: state.narrative + narrativeAddition,
    lastSessionDate: sessionDate,
    lastSessionSummary: sessionExport.summary,
    contextForNextSession: sessionExport.context_for_next_session,
    cardPreview: sessionExport.card_preview || state.cardPreview,
    streak: newStreak,
    nextDueDate: nextDue,
    customCheckInItems: sessionExport.check_in_items?.map(item => ({
      ...item,
      quickLoggable: true,
    })) ?? state.customCheckInItems,
  };
}

export function updateActionItemStatus(
  state: AdvisorState,
  itemId: string,
  status: ActionItemStatus,
): AdvisorState {
  return {
    ...state,
    actionItems: state.actionItems.map(item =>
      item.id === itemId
        ? {
            ...item,
            status,
            completedDate: status === 'completed' ? today() : item.completedDate,
          }
        : item,
    ),
  };
}
