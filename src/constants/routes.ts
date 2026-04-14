export const HOME_PATH = '/';
export const LOGIN_PATH = '/login';
export const SIGNUP_PATH = '/signup';
export const SETTINGS_PATH = '/settings';
export const ADMIN_DASHBOARD_PATH = '/admin';

export const QUANTUM_PLANNER_PATH = '/quantum-planner';
export const ADVISORY_BOARD_PATH = '/advisory-board';
export const GOLDEN_COMPASS_PATH = '/golden-compass';
export const GOLDEN_COMPASS_SESSION_ROUTE = '/golden-compass/:sessionId';

export const LEGACY_GOLDEN_COMPASS_PATH = '/compass';
export const LEGACY_GOLDEN_COMPASS_SESSION_ROUTE = '/compass/:sessionId';

export const ADVISOR_ROUTE = '/advisor/:advisorId';
export const SESSION_ROUTE = '/session/:advisorId';

export function getAdvisorPath(advisorId: string): string {
  return `/advisor/${advisorId}`;
}

export function getAdvisorSessionPath(advisorId: string): string {
  return `/session/${advisorId}`;
}

export function getGoldenCompassSessionPath(sessionId: string): string {
  return `${GOLDEN_COMPASS_PATH}/${sessionId}`;
}

export function getGoldenCompassSessionViewPath(sessionId: string): string {
  return `${GOLDEN_COMPASS_PATH}/${sessionId}/view`;
}
