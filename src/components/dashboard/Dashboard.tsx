import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QUANTUM_PLANNER_PATH } from '../../constants/routes';
import { useAuth } from '../../auth/auth-context';
import { useAppState } from '../../state/app-context';
import {
  selectAdvisorAttentionSummary,
  selectAdvisorsWithPinnedOrder,
  selectAllOpenTasks,
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

const TAB_DESCRIPTIONS: Record<DashboardTab, string> = {
  week: 'Weekly LAB',
  advisors: 'Advisor attention and domain routing',
  compass: 'Golden Compass',
  calendar: 'Session calendar',
};

const TAB_SUBTITLES: Record<DashboardTab, string> = {
  week: 'Plan the week, route work, and keep strategy visible',
  advisors: 'See which advisors need the next meaningful action',
  compass: 'Run a yearly reset, resume in-progress sessions, and review past compasses',
  calendar: 'Review scheduled advisory sessions across the week',
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
  const allOpenItems = selectAllOpenTasks(state);
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
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">{TAB_DESCRIPTIONS[activeTab]}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeTab === 'week'
              ? `${allOpenItems.length} open tasks across all domains`
              : TAB_SUBTITLES[activeTab]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== 'compass' && <DailyLogButton />}
          {availableTabs.length > 1 && (
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
              {availableTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-gray-700 text-gray-200'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab content */}
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
            <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-8 text-center mb-8">
              <p className="text-gray-400 text-sm">
                No advisors activated yet. Choose from the available advisors below to get started.
              </p>
            </div>
          )}

          {inactiveAdvisors.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
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
      className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-5 opacity-60 hover:opacity-80 transition-opacity"
      style={{ borderLeftColor: config.domainColor + '60', borderLeftWidth: '4px' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h3 className="font-semibold text-gray-300">{config.shortName}</h3>
          <p className="text-xs text-gray-600">{config.displayName}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4 line-clamp-2">
        {config.focusAreas.slice(0, 3).map(a => a.replace(/_/g, ' ')).join(' \u00b7 ')}
      </p>
      <button
        onClick={onActivate}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          backgroundColor: config.domainColor + '15',
          color: config.domainColor,
          border: `1px solid ${config.domainColor}30`,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.backgroundColor = config.domainColor + '25';
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.backgroundColor = config.domainColor + '15';
        }}
      >
        Activate
      </button>
    </div>
  );
}
