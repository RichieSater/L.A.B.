import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ADMIN_DASHBOARD_PATH,
  ADVISORY_BOARD_PATH,
  GOLDEN_COMPASS_PATH,
  HOME_PATH,
  LOGIN_PATH,
  QUANTUM_PLANNER_PATH,
  SETTINGS_PATH,
} from '../../constants/routes';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { useAppState } from '../../state/app-context';
import { useAuth } from '../../auth/auth-context';
import { selectOverallStreak } from '../../state/selectors';

function getInitials(name: string | null | undefined): string {
  if (!name) {
    return 'U';
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'U';
  }

  return parts.map(part => part[0]?.toUpperCase() ?? '').join('');
}

function getHeaderContext(pathname: string): { module: string; accent: 'gold' | 'teal' | 'blue' | 'neutral' } {
  if (pathname === HOME_PATH) {
    return { module: 'Module Hub', accent: 'gold' };
  }

  if (pathname === QUANTUM_PLANNER_PATH) {
    return { module: 'Quantum Planner', accent: 'teal' };
  }

  if (pathname === ADVISORY_BOARD_PATH || pathname.startsWith('/advisor/') || pathname.startsWith('/session/')) {
    return { module: 'Advisory Board', accent: 'blue' };
  }

  if (pathname === GOLDEN_COMPASS_PATH || pathname.startsWith('/golden-compass/') || pathname.startsWith('/compass/')) {
    return { module: 'Golden Compass', accent: 'gold' };
  }

  if (pathname === ADMIN_DASHBOARD_PATH) {
    return { module: 'Admin Dashboard', accent: 'neutral' };
  }

  if (pathname === SETTINGS_PATH) {
    return { module: 'Settings', accent: 'neutral' };
  }

  return { module: 'The L.A.B.', accent: 'neutral' };
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useAppState();
  const { profile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const overallStreak = selectOverallStreak(state);
  const context = useMemo(
    () => getHeaderContext(location.pathname),
    [location.pathname],
  );
  const userInitials = getInitials(profile?.displayName);
  const userShortLabel = profile?.displayName
    ? getInitials(profile.displayName)
    : userInitials;

  async function handleSignOut() {
    await signOut();
    navigate(LOGIN_PATH);
  }

  const chipClassName =
    context.accent === 'gold'
      ? 'lab-chip lab-chip--gold'
      : context.accent === 'teal'
        ? 'lab-chip lab-chip--teal'
        : context.accent === 'blue'
          ? 'lab-chip lab-chip--blue'
          : 'lab-chip lab-chip--neutral';

  return (
    <header className="relative z-10 border-b border-[color:var(--lab-border-muted)] bg-[rgba(5,7,11,0.94)] backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-9">
        <button
          type="button"
          onClick={() => navigate(HOME_PATH)}
          className="text-left transition-opacity hover:opacity-90"
        >
          <p className="text-[1.25rem] font-semibold uppercase leading-5 tracking-[-0.04em] text-[color:var(--lab-text)]">
            The L.A.B
          </p>
          <p className="mt-1 text-[0.7rem] leading-3 text-[color:var(--lab-text-muted)]">
            Life Advisory Board
          </p>
        </button>

        <div className="hidden flex-1 items-center gap-3 md:flex">
          <span className={chipClassName}>{context.module}</span>
          {location.pathname.startsWith('/session/') && (
            <span className="lab-chip lab-chip--neutral">
              {resolveAdvisorSessionLabel(location.pathname)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="lab-panel lab-panel--ink flex min-h-[2.875rem] items-center gap-2 rounded-2xl px-3 py-2 shadow-none">
            <span className="text-[1.1rem] font-bold leading-none text-[color:var(--lab-text)]">
              {overallStreak}
            </span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--lab-text-muted)]">
              Streak
            </span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(current => !current)}
              className="lab-panel lab-panel--ink flex min-h-[2.875rem] items-center gap-2 rounded-full px-3 py-2 shadow-none transition-colors hover:border-[rgba(228,209,174,0.26)]"
            >
              <span className="lab-avatar">{userInitials}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--lab-text)]">
                {userShortLabel}
              </span>
            </button>

            {showUserMenu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 cursor-default"
                  aria-label="Close user menu"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="lab-panel lab-panel--ink absolute right-0 z-30 mt-3 min-w-[13rem] overflow-hidden rounded-2xl p-2 shadow-[0_28px_70px_rgba(0,0,0,0.46)]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate(SETTINGS_PATH);
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-[color:var(--lab-text)] transition-colors hover:bg-[rgba(26,34,45,0.92)]"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      void handleSignOut();
                    }}
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-[#f2b1b1] transition-colors hover:bg-[rgba(230,123,123,0.12)]"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function resolveAdvisorSessionLabel(pathname: string): string {
  const advisorId = pathname.replace('/session/', '').split('/')[0];
  const advisor = ADVISOR_CONFIGS[advisorId as keyof typeof ADVISOR_CONFIGS];

  if (!advisor) {
    return 'Session';
  }

  return `${advisor.shortName} Session`;
}
