import type { CadenceConfig } from '../types/advisor';
import { daysBetween } from '../utils/date';

export function getEffectiveInterval(config: CadenceConfig, currentDate: string): number {
  if (config.boostedIntervalDays && config.boostedUntil) {
    if (currentDate <= config.boostedUntil) {
      return config.boostedIntervalDays;
    }
  }
  return config.intervalDays;
}

export function isWithinWindow(
  dueDate: string,
  currentDate: string,
  windowDays: number,
): boolean {
  const diff = daysBetween(currentDate, dueDate);
  return diff >= -windowDays;
}

export function isDueToday(
  dueDate: string,
  currentDate: string,
  windowDays: number,
): boolean {
  const diff = daysBetween(currentDate, dueDate);
  return diff <= 0 && diff >= -windowDays;
}

export function isOverdue(
  dueDate: string,
  currentDate: string,
  windowDays: number,
): boolean {
  const diff = daysBetween(currentDate, dueDate);
  return diff < -windowDays;
}
