export function generateId(prefix?: string): string {
  const uuid = crypto.randomUUID().split('-')[0];
  return prefix ? `${prefix}-${uuid}` : uuid;
}
