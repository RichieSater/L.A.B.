export type ActionItemPriority = 'high' | 'medium' | 'low';
export type ActionItemStatus = 'open' | 'completed' | 'deferred';

export interface ActionItem {
  id: string;
  task: string;
  due: string; // "YYYY-MM-DD" or "ongoing"
  priority: ActionItemPriority;
  status: ActionItemStatus;
  createdDate: string;
  completedDate?: string;
  deferredReason?: string;
  newDue?: string;
  sourceSessionDate?: string;
}
