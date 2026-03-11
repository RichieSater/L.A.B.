import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../state/app-context';
import { useAuth } from '../../auth/auth-context';
import { selectOverallStreak, selectDomainHealth } from '../../state/selectors';
import { ADVISOR_CONFIGS, ACTIVE_ADVISOR_IDS } from '../../advisors/registry';
import { DomainHealthIndicator } from '../dashboard/DomainHealthIndicator';

export function Header() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const { profile, signOut } = useAuth();
  const overallStreak = selectOverallStreak(state);
  const domainHealth = selectDomainHealth(state);
  const [showUserMenu, setShowUserMenu] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-left">
            <h1 className="text-xl font-bold text-gray-100 hover:text-white transition-colors">The L.A.B</h1>
            <p className="text-sm text-gray-500 mt-0.5">Life Advisory Board</p>
          </button>

          <div className="flex items-center gap-6">
            {/* Domain health indicators */}
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

            {/* Streak */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-100">{overallStreak}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Streak</div>
            </div>

            {/* User menu */}
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
                      onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
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
