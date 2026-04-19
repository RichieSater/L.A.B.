import type { ActionItem } from '../../types/action-item';
import type { TaskListPreset } from '../../types/dashboard-navigation';
import type { TaskPlanningBucket } from '../../types/task-planning';
import { daysAgo, isOverdue as checkOverdue, formatDaysAgo } from '../../utils/date';

type AdvisorPlannerRoutePreset = Exclude<TaskListPreset, 'all_open'>;

export interface AdvisorPlannerTaskRoute {
  preset: AdvisorPlannerRoutePreset;
  label: string;
}

export interface AdvisorPlannerTaskItem extends ActionItem {
  planningBucket: TaskPlanningBucket | null;
  isInWeeklyFocus: boolean;
  isCarryOver: boolean;
  weeklyLabRoute: AdvisorPlannerTaskRoute | null;
}

interface ActionItemRowProps {
  item: AdvisorPlannerTaskItem;
  onToggleComplete: (id: string) => void;
  onSetPlanBucket: (taskId: string, bucket: TaskPlanningBucket) => void;
  onClearPlanBucket: (taskId: string) => void;
  onAddWeeklyFocus: (taskId: string) => void;
  onRemoveWeeklyFocus: (taskId: string) => void;
  onScheduleTask?: (taskId: string) => void;
  onOpenWeeklyLabRoute?: (preset: AdvisorPlannerRoutePreset) => void;
  schedulingEnabled?: boolean;
}

export function ActionItemRow({
  item,
  onToggleComplete,
  onSetPlanBucket,
  onClearPlanBucket,
  onAddWeeklyFocus,
  onRemoveWeeklyFocus,
  onScheduleTask,
  onOpenWeeklyLabRoute,
  schedulingEnabled = false,
}: ActionItemRowProps) {
  const isOverdue = item.dueDate !== 'ongoing' && item.status === 'open' && checkOverdue(item.dueDate);
  const isCompleted = item.status === 'completed';
  const weeklyLabRoute = item.weeklyLabRoute;

  return (
    <article
      data-task-id={item.id}
      className={`lab-subpanel ${isCompleted ? 'bg-[rgba(19,28,38,0.6)]' : 'lab-subpanel--soft'} flex items-start gap-3 p-3`}
    >
      <button
        onClick={() => onToggleComplete(item.id)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          isCompleted
            ? 'border-[rgba(117,200,167,0.7)] bg-[rgba(117,200,167,0.2)] text-[color:var(--lab-success)]'
            : 'border-[color:var(--lab-border)] hover:border-[rgba(228,209,174,0.42)]'
        }`}
      >
        {isCompleted && <span className="text-xs">&#10003;</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCompleted ? 'text-[color:var(--lab-text-dim)] line-through' : 'text-[color:var(--lab-text)]'}`}>
          {item.task}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-[11px] text-[color:var(--lab-text-dim)]">{item.id}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${
            item.priority === 'high' ? 'bg-[rgba(230,123,123,0.14)] text-[color:var(--lab-danger)]' :
            item.priority === 'medium' ? 'bg-[rgba(228,209,174,0.14)] text-[color:var(--lab-gold)]' :
            'bg-[rgba(39,50,64,0.9)] text-[color:var(--lab-text-muted)]'
          }`}>
            {item.priority}
          </span>
          {item.planningBucket && (
            <span className="lab-chip lab-chip--neutral">
              {item.planningBucket === 'this_week' ? 'this week' : item.planningBucket}
            </span>
          )}
          {item.isInWeeklyFocus && (
            <span className="lab-chip lab-chip--blue">
              focus
            </span>
          )}
          {item.dueDate !== 'ongoing' ? (
            <span className={`text-xs ${isOverdue ? 'text-[color:var(--lab-danger)]' : 'text-[color:var(--lab-text-dim)]'}`}>
              {isOverdue ? `Overdue ${daysAgo(item.dueDate)}d` : `due ${item.dueDate}`}
            </span>
          ) : (
            <span className="text-xs text-[color:var(--lab-text-dim)]">ongoing</span>
          )}
          {isCompleted && item.completedDate && (
            <span className="text-xs text-[color:var(--lab-success)]">
              completed {formatDaysAgo(item.completedDate)}
            </span>
          )}
        </div>

        {!isCompleted && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <PlanActionButton
              active={item.planningBucket === 'today'}
              label="Today"
              onClick={() => onSetPlanBucket(item.id, 'today')}
            />
            <PlanActionButton
              active={item.planningBucket === 'this_week'}
              label="This Week"
              onClick={() => onSetPlanBucket(item.id, 'this_week')}
            />
            <PlanActionButton
              active={item.planningBucket === 'later'}
              label="Later"
              onClick={() => onSetPlanBucket(item.id, 'later')}
            />
            <button
              onClick={() => item.isInWeeklyFocus ? onRemoveWeeklyFocus(item.id) : onAddWeeklyFocus(item.id)}
              className={`lab-action ${
                item.isInWeeklyFocus
                  ? 'lab-action--blue'
                  : ''
              }`}
              data-active={item.isInWeeklyFocus}
            >
              {item.isInWeeklyFocus ? 'Focused' : 'Focus'}
            </button>
            {item.planningBucket && (
              <button
                onClick={() => onClearPlanBucket(item.id)}
                className="lab-action"
              >
                Clear plan
              </button>
            )}
            {weeklyLabRoute && onOpenWeeklyLabRoute && (
              <button
                onClick={() => onOpenWeeklyLabRoute(weeklyLabRoute.preset)}
                className="lab-action lab-action--blue"
              >
                {`Open ${weeklyLabRoute.label} in Weekly LAB`}
              </button>
            )}
            {schedulingEnabled && onScheduleTask && (
              <button
                onClick={() => onScheduleTask(item.id)}
                className="lab-action lab-action--blue"
              >
                Schedule
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PlanActionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="lab-action"
      data-active={active}
    >
      {label}
    </button>
  );
}
