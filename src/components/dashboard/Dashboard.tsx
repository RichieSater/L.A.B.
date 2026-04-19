import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QUANTUM_PLANNER_PATH } from '../../constants/routes';
import { useAuth } from '../../auth/auth-context';
import { useAppState } from '../../state/app-context';
import {
  selectAdvisorAttentionSummary,
  selectAdvisorsWithPinnedOrder,
  selectInactiveAdvisorIds,
} from '../../state/selectors';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import type { AdvisorId } from '../../types/advisor';
import type {
  DashboardAvailableTabs,
  DashboardNavigationState,
  DashboardTab,
  TaskDashboardNavigationRequest,
} from '../../types/dashboard-navigation';
import { AdvisorCardGrid } from './AdvisorCardGrid';
import { AdvisorAttentionPanel } from './AdvisorAttentionPanel';
import { TaskDashboard } from './TaskDashboard';
import { CalendarView } from './CalendarView';
import { CompassDashboard } from './CompassDashboard';
import { DailyLogButton } from './DailyLogButton';
import { StrategicPlannerPanel } from './StrategicPlannerPanel';

const TAB_LABELS: Record<DashboardTab, string> = {
  week: 'Week',
  advisors: 'Advisors',
  compass: 'Compass',
  calendar: 'Calendar',
};

const DEFAULT_AVAILABLE_TABS: DashboardAvailableTabs = ['week', 'advisors', 'compass', 'calendar'];

export function Dashboard({
  forcedInitialTab,
  availableTabs = DEFAULT_AVAILABLE_TABS,
}: {
  forcedInitialTab?: DashboardTab;
  availableTabs?: DashboardAvailableTabs;
} = {}) {
  const location = useLocation();
  const navigationState = location.state as DashboardNavigationState | null;
  const dashboard = navigationState?.dashboard;
  const requestedInitialTab = dashboard?.tab ?? forcedInitialTab;

  return (
    <DashboardView
      key={location.key}
      availableTabs={availableTabs}
      initialActiveTab={resolveInitialTab(requestedInitialTab, availableTabs)}
      initialTaskNavigationRequest={
        dashboard?.taskList
          ? {
              ...dashboard.taskList,
              requestKey: location.key,
            }
          : null
      }
    />
  );
}

function DashboardView({
  availableTabs,
  initialActiveTab,
  initialTaskNavigationRequest,
}: {
  availableTabs: DashboardAvailableTabs;
  initialActiveTab: DashboardTab;
  initialTaskNavigationRequest: TaskDashboardNavigationRequest | null;
}) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { state, dispatch } = useAppState();
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialActiveTab);
  const [taskNavigationRequest, setTaskNavigationRequest] =
    useState<TaskDashboardNavigationRequest | null>(initialTaskNavigationRequest);
  const requestCounterRef = useRef(0);
  const sortedAdvisors = selectAdvisorsWithPinnedOrder(state);
  const inactiveAdvisors = selectInactiveAdvisorIds(state);
  const attention = selectAdvisorAttentionSummary(state);
  const schedulingEnabled = profile?.schedulingEnabled ?? false;
  const canOpenWeekLocally = availableTabs.includes('week');

  const handleOpenTasks = (
    request?: Omit<TaskDashboardNavigationRequest, 'requestKey'>,
  ) => {
    if (!canOpenWeekLocally) {
      navigate(QUANTUM_PLANNER_PATH, {
        state: {
          dashboard: {
            tab: 'week',
            ...(request ? { taskList: request } : {}),
          },
        },
      });
      return;
    }

    setActiveTab('week');

    if (!request) {
      setTaskNavigationRequest(null);
      return;
    }

    requestCounterRef.current += 1;
    setTaskNavigationRequest({
      ...request,
      requestKey: `dashboard-${requestCounterRef.current}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {availableTabs.length > 1 ? (
          <div className="lab-tab-rail">
            {availableTabs.map(tab => (
              <button
                key={tab}
                type="button"
                data-active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className="lab-tab"
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        ) : (
          <span className="lab-chip lab-chip--gold">{TAB_LABELS[activeTab]}</span>
        )}

        {activeTab !== 'compass' && <DailyLogButton />}
      </div>

      {activeTab === 'week' && (
        <div className="space-y-6">
          <StrategicPlannerPanel />
          <TaskDashboard
            key={taskNavigationRequest?.requestKey ?? 'task-dashboard'}
            navigationRequest={taskNavigationRequest}
          />
        </div>
      )}
      {activeTab === 'advisors' && (
        <>
          <AdvisorAttentionPanel
            summary={attention}
            onOpenTasks={handleOpenTasks}
            schedulingEnabled={schedulingEnabled}
          />

          {sortedAdvisors.length > 0 ? (
            <AdvisorCardGrid advisorIds={sortedAdvisors} />
          ) : (
            <div className="lab-panel lab-panel--soft mb-8 rounded-[1.5rem] p-8 text-center">
              <p className="text-sm text-[color:var(--lab-text-muted)]">
                No advisors activated yet. Choose from the available advisors below to get started.
              </p>
            </div>
          )}

          {inactiveAdvisors.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lab-text-muted)]">
                Available Advisors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveAdvisors.map(id => (
                  <InactiveAdvisorCard
                    key={id}
                    advisorId={id}
                    onActivate={() => dispatch({
                      type: 'TOGGLE_ADVISOR_ACTIVATION',
                      payload: { advisorId: id },
                    })}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {activeTab === 'compass' && <CompassDashboard />}
      {activeTab === 'calendar' && <CalendarView />}
    </div>
  );
}

function resolveInitialTab(
  requestedTab: DashboardTab | undefined,
  availableTabs: DashboardAvailableTabs,
): DashboardTab {
  if (requestedTab && availableTabs.includes(requestedTab)) {
    return requestedTab;
  }

  return availableTabs[0] ?? 'week';
}

function InactiveAdvisorCard({
  advisorId,
  onActivate,
}: {
  advisorId: AdvisorId;
  onActivate: () => void;
}) {
  const config = ADVISOR_CONFIGS[advisorId];

  return (
    <div
      className="lab-panel lab-panel--soft rounded-[1.35rem] p-5 opacity-75 transition-all hover:border-[rgba(245,243,238,0.24)] hover:opacity-95"
      style={{ borderLeftColor: config.domainColor + '60', borderLeftWidth: '4px' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h3 className="font-semibold text-[color:var(--lab-text)]">{config.shortName}</h3>
          <p className="text-xs text-[color:var(--lab-text-dim)]">{config.displayName}</p>
        </div>
      </div>
      <p className="mb-4 text-xs text-[color:var(--lab-text-muted)] line-clamp-2">
        {config.focusAreas.slice(0, 3).map(a => a.replace(/_/g, ' ')).join(' \u00b7 ')}
      </p>
      <button
        onClick={onActivate}
        className="lab-button lab-button--ghost w-full rounded-2xl"
        style={{
          color: config.domainColor,
          borderColor: `${config.domainColor}36`,
        }}
      >
        Activate
      </button>
    </div>
  );
}
