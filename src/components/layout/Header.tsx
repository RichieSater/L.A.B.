import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HOME_PATH, LOGIN_PATH, SETTINGS_PATH } from '../../constants/routes';
import { useAppState } from '../../state/app-context';
import { useAuth } from '../../auth/auth-context';
import { selectOverallStreak, selectDomainHealth } from '../../state/selectors';
import { ADVISOR_CONFIGS, ACTIVE_ADVISOR_IDS } from '../../advisors/registry';
import { DomainHealthIndicator } from '../dashboard/DomainHealthIndicator';

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useAppState();
  const { profile, signOut } = useAuth();
  const overallStreak = selectOverallStreak(state);
  const domainHealth = selectDomainHealth(state);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isModuleHub = location.pathname === HOME_PATH;

  async function handleSignOut() {
    await signOut();
    navigate(LOGIN_PATH);
  }

  return (
    <header className={`sticky top-0 z-10 border-b backdrop-blur-sm ${
      isModuleHub ? 'border-stone-800/80 bg-gray-950/75' : 'border-gray-800 bg-gray-950/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(HOME_PATH)} className="text-left">
            <h1 className="text-xl font-bold text-gray-100 hover:text-white transition-colors">The L.A.B</h1>
            <p className="text-sm text-gray-500 mt-0.5">Life Advisory Board</p>
          </button>

          <div className="flex items-center gap-6">
            {isModuleHub ? (
              <div className="hidden md:flex items-center rounded-full border border-stone-700/80 bg-stone-950/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300">
                Module Hub
              </div>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  {ACTIVE_ADVISOR_IDS.map(id => (
                    <DomainHealthIndicator
                      key={id}
                      advisorId={id}
                      health={domainHealth[id]}
                      label={ADVISOR_CONFIGS[id].shortName}
                    />
                  ))}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-100">{overallStreak}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Streak</div>
                </div>
              </>
            )}

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
                  {(profile?.displayName?.[0] ?? '?').toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-gray-300">
                  {profile?.displayName ?? 'User'}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-30">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate(SETTINGS_PATH); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 rounded-t-lg transition-colors"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => { setShowUserMenu(false); handleSignOut(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-gray-800 rounded-b-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
