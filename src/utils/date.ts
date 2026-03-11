export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function daysAgo(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00');
  const b = new Date(dateB + 'T00:00:00');
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDaysAgo(dateStr: string): string {
  const days = daysAgo(dateStr);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  return `${Math.floor(days / 7)} weeks ago`;
}

export function isOverdue(dateStr: string): boolean {
  return daysAgo(dateStr) > 0;
}

export function getMonthDays(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const days: { date: string; isCurrentMonth: boolean }[] = [];

  for (let i = startPadding - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d.toISOString().split('T')[0], isCurrentMonth: false });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateObj = new Date(year, month, d);
    days.push({ date: dateObj.toISOString().split('T')[0], isCurrentMonth: true });
  }

  const totalCells = days.length <= 35 ? 35 : 42;
  while (days.length < totalCells) {
    const d = new Date(year, month + 1, days.length - startPadding - lastDay.getDate() + 1);
    days.push({ date: d.toISOString().split('T')[0], isCurrentMonth: false });
  }

  return days;
}

export function getMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function isValidDate(str: string): boolean {
  if (str === 'ongoing') return true;
  const match = /^\d{4}-\d{2}-\d{2}$/.test(str);
  if (!match) return false;
  const date = new Date(str + 'T00:00:00');
  return !isNaN(date.getTime());
}
