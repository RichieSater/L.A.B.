import { useMemo, useState } from 'react';
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../lib/api';

export function SettingsPage() {
  const { profile, updateProfile, refreshBootstrap } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const calendarStatus = useMemo(() => {
    if (profile?.googleCalendarConnected) {
      return profile.googleCalendarEmail
        ? `Connected as ${profile.googleCalendarEmail}`
        : 'Connected';
    }

    return 'Not connected';
  }, [profile?.googleCalendarConnected, profile?.googleCalendarEmail]);

  async function handleSaveName() {
    setSaving(true);
    await updateProfile({ displayName });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleToggleScheduling() {
    await updateProfile({ schedulingEnabled: !profile?.schedulingEnabled });
  }

  async function handleDisconnectCalendar() {
    setDisconnectingCalendar(true);
    await apiClient.disconnectGoogleCalendar();
    await refreshBootstrap();
    setDisconnectingCalendar(false);
  }

  async function handleResetData() {
    const confirmed = window.confirm(
      'Start fresh? This clears your advisor state, quick logs, shared metrics, and scheduled sessions. Your account and settings stay intact.',
    );

    if (!confirmed) {
      return;
    }

    setResettingData(true);
    setResetMessage(null);
    setResetError(null);

    try {
      await apiClient.resetUserData();
      await refreshBootstrap();
      setResetMessage('Your app data has been cleared.');
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Failed to reset your data.');
    } finally {
      setResettingData(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">Settings</h2>

      {/* Profile section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Profile</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
              Display Name
            </label>
            <div className="flex gap-3">
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || displayName === profile?.displayName}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Session Scheduling</h3>
            <p className="text-sm text-gray-400 mt-1">
              Schedule sessions at specific times. Sessions unlock at the scheduled time and stay open for 1 hour.
            </p>
          </div>
          <button
            onClick={handleToggleScheduling}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              profile?.schedulingEnabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                profile?.schedulingEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Google Calendar</h3>
            <p className="text-sm text-gray-400 mt-1">
              One-way sync for scheduled session events.
            </p>
            <p className="text-xs text-gray-500 mt-2">{calendarStatus}</p>
          </div>
          {profile?.googleCalendarConnected ? (
            <button
              onClick={handleDisconnectCalendar}
              disabled={disconnectingCalendar}
              className="px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {disconnectingCalendar ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <a
              href="/api/google-calendar/connect"
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Connect Google Calendar
            </a>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-red-950 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Start Fresh</h3>
            <p className="text-sm text-gray-400 mt-1">
              Clear your app data without deleting your account.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              This resets advisor state, quick logs, shared metrics, and scheduled sessions. Your profile and sign-in stay the same.
            </p>
            {resetMessage ? <p className="text-sm text-green-400 mt-3">{resetMessage}</p> : null}
            {resetError ? <p className="text-sm text-red-400 mt-3">{resetError}</p> : null}
          </div>
          <button
            onClick={handleResetData}
            disabled={resettingData}
            className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {resettingData ? 'Clearing...' : 'Start Fresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
