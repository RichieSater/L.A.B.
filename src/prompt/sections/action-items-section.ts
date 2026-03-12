import type { AdvisorState } from '../../types/advisor';
import type { SessionRecord } from '../../types/session';
import type { ActionItem } from '../../types/action-item';
import { daysAgo, daysBetween, isOverdue } from '../../utils/date';

const MAX_RECENT_COMPLETED = 5;

function getSessionLabel(
  sourceSessionDate: string | undefined,
  sessions: SessionRecord[],
): string {
  if (!sourceSessionDate) return 'Initial';
  const sessionIndex = sessions.findIndex(s => s.date === sourceSessionDate);
  if (sessionIndex === -1) return `Assigned: ${sourceSessionDate}`;
  return `Session ${sessionIndex + 1} — ${sourceSessionDate}`;
}

function getCompletionTiming(item: ActionItem): string {
  if (item.dueDate === 'ongoing' || !item.completedDate) return '';
  const diff = daysBetween(item.dueDate, item.completedDate);
  if (diff === 0) return ' - on time';
  if (diff > 0) return ` - completed ${diff} day${diff !== 1 ? 's' : ''} late`;
  const absDiff = Math.abs(diff);
  return ` - completed ${absDiff} day${absDiff !== 1 ? 's' : ''} early`;
}

export function buildActionItemsSection(state: AdvisorState): string {
  const openItems = state.tasks.filter(item => item.status === 'open');
  const deferredItems = state.tasks.filter(item => item.status === 'deferred');
  const completedItems = state.tasks
    .filter(item => item.status === 'completed')
    .sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? ''));

  const totalOverdue = openItems.filter(
    item => item.dueDate !== 'ongoing' && isOverdue(item.dueDate),
  ).length;

  const completedSinceLastSession = state.lastSessionDate
    ? completedItems.filter(item => item.completedDate && item.completedDate > state.lastSessionDate!).length
    : 0;

  const total = state.tasks.length;
  const completionRate = total > 0 ? Math.round((completedItems.length / total) * 100) : 0;

  // Accountability summary
  let section = '[TASK ACCOUNTABILITY SUMMARY]\n';
  section += `Total assigned: ${total} | Completed: ${completedItems.length} (${completionRate}%) | Open: ${openItems.length} | Deferred: ${deferredItems.length} | Overdue: ${totalOverdue}\n`;
  section += `Completed since last session: ${completedSinceLastSession}\n`;

  // Open items
  section += '\n[OPEN ACTION ITEMS]\n';
  if (openItems.length === 0) {
    section += 'No open action items.\n';
  } else {
    for (const item of openItems) {
      const overdue = item.dueDate !== 'ongoing' && isOverdue(item.dueDate);
      const overdueTag = overdue ? ` ** OVERDUE (${daysAgo(item.dueDate)} days) **` : '';
      const sessionLabel = getSessionLabel(item.sourceSessionDate, state.sessions);
      section += `- [${item.id}] ${item.task} (due: ${item.dueDate}, priority: ${item.priority}, assigned: ${sessionLabel})${overdueTag}\n`;
    }
  }

  // Deferred items
  if (deferredItems.length > 0) {
    section += '\n[DEFERRED ACTION ITEMS]\n';
    for (const item of deferredItems) {
      const sessionLabel = getSessionLabel(item.sourceSessionDate, state.sessions);
      const reason = item.deferredReason ? `, reason: "${item.deferredReason}"` : '';
      section += `- [${item.id}] ${item.task} (new due: ${item.dueDate}${reason}, assigned: ${sessionLabel})\n`;
    }
  }

  // Recently completed
  section += '\n[RECENTLY COMPLETED]\n';
  if (completedItems.length === 0) {
    section += 'None.\n';
  } else {
    const recentCompleted = completedItems.slice(0, MAX_RECENT_COMPLETED);
    for (const item of recentCompleted) {
      const sessionLabel = getSessionLabel(item.sourceSessionDate, state.sessions);
      const timing = getCompletionTiming(item);
      section += `- [${item.id}] ${item.task} (completed: ${item.completedDate}, assigned: ${sessionLabel})${timing}\n`;
    }
    if (completedItems.length > MAX_RECENT_COMPLETED) {
      section += `(Showing ${MAX_RECENT_COMPLETED} most recent of ${completedItems.length} total completed)\n`;
    }
  }

  return section;
}
