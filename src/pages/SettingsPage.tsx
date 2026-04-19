import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../lib/api';

type GoogleCalendarStatus = 'connected' | 'failed' | 'invalid_state' | 'expired_state';

const GOOGLE_CALENDAR_MESSAGES: Record<GoogleCalendarStatus, { tone: 'success' | 'error'; text: string }> = {
  connected: {
    tone: 'success',
    text: 'Google Calendar connected successfully.',
  },
  failed: {
    tone: 'error',
    text: 'Google Calendar connection failed. Please try again.',
  },
  invalid_state: {
    tone: 'error',
    text: 'Google Calendar connection could not be verified. Please try again.',
  },
  expired_state: {
    tone: 'error',
    text: 'Google Calendar connection timed out. Please try again.',
  },
};

export function SettingsPage() {
  const { profile, updateProfile, refreshBootstrap } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [disconnectingCalendar, setDisconnectingCalendar] = useState(false);
  const [resettingData, setResettingData] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [googleCalendarNotice, setGoogleCalendarNotice] = useState<GoogleCalendarStatus | null>(null);
  const calendarStatus = useMemo(() => {
    if (profile?.googleCalendarConnected) {
      return profile.googleCalendarEmail
        ? `Connected as ${profile.googleCalendarEmail}`
        : 'Connected';
    }

    return 'Not connected';
  }, [profile?.googleCalendarConnected, profile?.googleCalendarEmail]);

  useEffect(() => {
    const nextStatus = searchParams.get('google_calendar');

    if (!nextStatus || !(nextStatus in GOOGLE_CALENDAR_MESSAGES)) {
      return;
    }

    setGoogleCalendarNotice(nextStatus as GoogleCalendarStatus);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('google_calendar');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

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
    <div className="lab-page lab-page--narrow space-y-6">
      <div>
        <p className="lab-eyebrow">Preferences</p>
        <h2 className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[color:var(--lab-text)]">
          Settings
        </h2>
      </div>

      <div className="lab-panel rounded-[1.5rem] p-5">
        <h3 className="mb-4 text-lg font-semibold text-[color:var(--lab-text)]">Profile</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-[color:var(--lab-text-muted)]">
              Display Name
            </label>
            <div className="flex gap-3">
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="lab-input flex-1"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || displayName === profile?.displayName}
                className="lab-button lab-button--gold rounded-2xl"
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lab-panel rounded-[1.5rem] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--lab-text)]">Session Scheduling</h3>
            <p className="mt-1 text-sm text-[color:var(--lab-text-muted)]">
              Schedule sessions at specific times. Sessions unlock at the scheduled time and stay open for 1 hour.
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleScheduling}
            data-active={profile?.schedulingEnabled ? 'true' : 'false'}
            className="lab-toggle"
          >
            <span className="lab-toggle__thumb" />
          </button>
        </div>
      </div>

      <div className="lab-panel rounded-[1.5rem] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--lab-text)]">Google Calendar</h3>
            <p className="mt-1 text-sm text-[color:var(--lab-text-muted)]">
              One-way sync for scheduled session events. Connecting backfills upcoming sessions, and disconnecting removes synced events from Google Calendar.
            </p>
            <p className="mt-2 text-xs text-[color:var(--lab-text-dim)]">{calendarStatus}</p>
            {googleCalendarNotice ? (
              <p
                className={`text-sm mt-3 ${
                  GOOGLE_CALENDAR_MESSAGES[googleCalendarNotice].tone === 'success'
                    ? 'text-[#7dd4b0]'
                    : 'text-[#f2b1b1]'
                }`}
              >
                {GOOGLE_CALENDAR_MESSAGES[googleCalendarNotice].text}
              </p>
            ) : null}
          </div>
          {profile?.googleCalendarConnected ? (
            <button
              onClick={handleDisconnectCalendar}
              disabled={disconnectingCalendar}
              className="lab-button lab-button--ghost rounded-2xl"
            >
              {disconnectingCalendar ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <a
              href="/api/google-calendar/connect"
              className="lab-button lab-button--gold rounded-2xl"
            >
              Connect Google Calendar
            </a>
          )}
        </div>
      </div>

      <div className="lab-panel rounded-[1.5rem] border-[rgba(230,123,123,0.3)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[color:var(--lab-text)]">Start Fresh</h3>
            <p className="mt-1 text-sm text-[color:var(--lab-text-muted)]">
              Clear your app data without deleting your account.
            </p>
            <p className="mt-2 text-xs text-[color:var(--lab-text-dim)]">
              This resets advisor state, quick logs, shared metrics, and scheduled sessions. Your profile and sign-in stay the same.
            </p>
            {resetMessage ? <p className="mt-3 text-sm text-[#7dd4b0]">{resetMessage}</p> : null}
            {resetError ? <p className="mt-3 text-sm text-[#f2b1b1]">{resetError}</p> : null}
          </div>
          <button
            onClick={handleResetData}
            disabled={resettingData}
            className="lab-button lab-button--danger rounded-2xl"
          >
            {resettingData ? 'Clearing...' : 'Start Fresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
