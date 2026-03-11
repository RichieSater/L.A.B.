import type { ScheduledSession } from '../types/scheduled-session';

export type LockStatus =
  | { locked: false }
  | { locked: true; reason: 'not-yet'; unlocksAt: string }
  | { locked: true; reason: 'expired'; expiredAt: string };

export function getSessionLockStatus(
  scheduledSession: ScheduledSession | null,
  schedulingEnabled: boolean,
): LockStatus {
  if (!schedulingEnabled || !scheduledSession) {
    return { locked: false };
  }

  // Only lock for scheduled (upcoming) sessions
  if (scheduledSession.status !== 'scheduled') {
    return { locked: false };
  }

  const now = new Date();
  const scheduledTime = new Date(scheduledSession.scheduledAt);
  const windowEnd = new Date(
    scheduledTime.getTime() + scheduledSession.windowMinutes * 60 * 1000,
  );

  if (now < scheduledTime) {
    return { locked: true, reason: 'not-yet', unlocksAt: scheduledSession.scheduledAt };
  }

  if (now > windowEnd) {
    return { locked: true, reason: 'expired', expiredAt: windowEnd.toISOString() };
  }

  // Within the window — unlocked
  return { locked: false };
}

/** Format a countdown like "2h 15m" or "3d 4h" */
export function formatCountdown(targetIso: string): string {
  const now = new Date();
  const target = new Date(targetIso);
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'now';

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
