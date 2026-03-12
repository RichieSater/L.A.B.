import type { AdvisorId } from './advisor';
import type { HabitCadence, HabitItem, TaskItem, TaskPriority } from './action-item';
import type { MetricDefinition } from './metrics';

export interface TaskCreateOperation {
  id?: string;
  task: string;
  dueDate: string | 'ongoing';
  priority: TaskPriority;
}

export interface TaskUpdateOperation {
  id?: string;
  match?: string;
  task?: string;
  dueDate?: string | 'ongoing';
  priority?: TaskPriority;
}

export interface TaskDeferOperation {
  id?: string;
  match?: string;
  reason: string;
  newDueDate: string;
}

export interface HabitCreateOperation {
  id?: string;
  name: string;
  cadence: HabitCadence;
  targetCount?: number;
  unit?: string;
}

export interface HabitUpdateOperation {
  id?: string;
  match?: string;
  name?: string;
  cadence?: HabitCadence;
  targetCount?: number;
  unit?: string;
  status?: 'active' | 'paused';
}

/** The JSON schema the AI must produce at the end of every session */
export interface SessionImport {
  advisor: string;
  date: string;
  summary: string;
  task_ops: {
    create: TaskCreateOperation[];
    update: TaskUpdateOperation[];
    complete: string[];
    defer: TaskDeferOperation[];
    close: string[];
  };
  habit_ops: {
    create: HabitCreateOperation[];
    update: HabitUpdateOperation[];
    archive: string[];
  };
  metrics: Record<string, number | string>;
  context_for_next_session: string;
  mood: string;
  energy: number;
  session_rating: number;
  narrative_update: string;
  card_preview: string;
  check_in_config?: MetricDefinition[];
}

export interface SessionRecord {
  id: string;
  advisorId: AdvisorId;
  date: string;
  summary: string;
  mood: string;
  energy: number;
  sessionRating: number;
  tasksCreated: number;
  tasksCompleted: number;
  habitsCreated: number;
  narrativeUpdate: string;
  rawImport: SessionImport;
}

export interface TaskPreviewChange {
  type: 'create' | 'update' | 'auto-merge' | 'complete' | 'defer' | 'close';
  taskId: string;
  before?: TaskItem;
  after?: TaskItem;
  reason?: string;
  matchedBy?: 'id' | 'text';
}

export interface HabitPreviewChange {
  type: 'create' | 'update' | 'archive';
  habitId: string;
  before?: HabitItem;
  after?: HabitItem;
  matchedBy?: 'id' | 'text';
}

export interface NormalizedSessionImport {
  sessionImport: SessionImport;
  taskCreates: TaskItem[];
  taskUpdates: Array<{ id: string; changes: Partial<TaskItem>; matchedBy: 'id' | 'text' }>;
  taskCompletes: string[];
  taskDefers: Array<{ id: string; reason: string; newDueDate: string }>;
  taskCloses: string[];
  habitCreates: HabitItem[];
  habitUpdates: Array<{ id: string; changes: Partial<HabitItem>; matchedBy: 'id' | 'text' }>;
  habitArchives: string[];
  checkInConfig: MetricDefinition[] | null;
  preview: {
    tasks: TaskPreviewChange[];
    habits: HabitPreviewChange[];
    checkInConfigChanged: boolean;
  };
}
