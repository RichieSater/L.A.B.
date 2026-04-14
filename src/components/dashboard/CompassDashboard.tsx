import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGoldenCompassSessionPath,
  getGoldenCompassSessionViewPath,
} from '../../constants/routes';
import { apiClient } from '../../lib/api';
import type { CompassSessionSummary } from '../../types/compass';
import { useAuth } from '../../auth/auth-context';

export function CompassDashboard() {
  const navigate = useNavigate();
  const { refreshBootstrap } = useAuth();
  const [sessions, setSessions] = useState<CompassSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const result = await apiClient.listCompassSessions();
    setSessions(result);
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    loadSessions()
      .catch(err => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load Compass sessions.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadSessions]);

  const inProgress = useMemo(
    () => sessions.filter(session => session.status === 'in_progress'),
    [sessions],
  );
  const completed = useMemo(
    () => sessions.filter(session => session.status === 'completed'),
    [sessions],
  );

  async function handleCreateSession() {
    setCreating(true);
    setError(null);

    try {
      const session = await apiClient.createCompassSession({
        planningYear: new Date().getFullYear(),
      });
      navigate(getGoldenCompassSessionPath(session.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Compass session.');
      setCreating(false);
    }
  }

  async function runLifecycleAction(actionKey: string, action: () => Promise<void>) {
    setBusyActionKey(actionKey);
    setError(null);

    try {
      await action();
      await Promise.all([
        refreshBootstrap(),
        loadSessions(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Compass session.');
    } finally {
      setBusyActionKey(null);
    }
  }

  async function handleUseInLab(sessionId: string) {
    await runLifecycleAction(`active:${sessionId}`, async () => {
      await apiClient.updateCompassSession(sessionId, { setActive: true });
    });
  }

  async function handleToggleAchieved(session: CompassSessionSummary) {
    await runLifecycleAction(`achieved:${session.id}`, async () => {
      await apiClient.updateCompassSession(session.id, {
        achieved: session.achievedAt === null,
      });
    });
  }

  async function handleDeleteSession(session: CompassSessionSummary) {
    const confirmed = window.confirm(
      [
        `Delete ${session.title}?`,
        'Existing strategic rows and linked tasks will stay in LAB.',
        session.isActive
          ? 'Because this is the active Compass, LAB will switch to the newest remaining completed Compass.'
          : 'This only removes the Compass session from history.',
      ].join('\n\n'),
    );

    if (!confirmed) {
      return;
    }

    const previousSessions = sessions;
    setBusyActionKey(`delete:${session.id}`);
    setError(null);
    setSessions(currentSessions => currentSessions.filter(entry => entry.id !== session.id));

    try {
      await apiClient.deleteCompassSession(session.id);
      await Promise.all([
        refreshBootstrap(),
        loadSessions(),
      ]);
    } catch (err) {
      setSessions(previousSessions);
      setError(err instanceof Error ? err.message : 'Failed to update Compass session.');
    } finally {
      setBusyActionKey(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,_rgba(245,208,116,0.12),_rgba(17,24,39,0.98)_50%)] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/80">
              Golden Compass
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-100">
              Recalibrate the year before you plan the week
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-300">
              Golden Compass captures your annual goals, daily rituals, and support structure, then LAB carries
              those signals back into strategy and advisor sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateSession}
            disabled={creating}
            className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:border-amber-200 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {creating ? 'Creating...' : 'New Compass'}
          </button>
        </div>
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-gray-800 bg-gray-900/60 p-8 text-center text-sm text-gray-400">
          Loading Compass sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center">
          <h3 className="text-lg font-semibold text-gray-100">No Compass sessions yet</h3>
          <p className="mt-3 text-sm text-gray-400">
            Start one to seed LAB with annual goals, daily rituals, and the people you want in your support system.
          </p>
          <button
            type="button"
            onClick={handleCreateSession}
            disabled={creating}
            className="mt-6 rounded-full border border-amber-300/40 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-500/20 disabled:opacity-70"
          >
            {creating ? 'Creating...' : 'Begin Golden Compass'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {inProgress.length > 0 ? (
            <SessionGroup
              title="In Progress"
              description="Resume the latest reset before starting another one."
              sessions={inProgress}
              busyActionKey={busyActionKey}
              onOpen={id => navigate(getGoldenCompassSessionPath(id))}
              onDelete={handleDeleteSession}
            />
          ) : null}
          {completed.length > 0 ? (
            <SessionGroup
              title="Completed"
              description="Review what you set for the year and reopen the session summary if needed."
              sessions={completed}
              busyActionKey={busyActionKey}
              onOpen={id => navigate(getGoldenCompassSessionViewPath(id))}
              openLabel="View Compass"
              onUseInLab={handleUseInLab}
              onToggleAchieved={handleToggleAchieved}
              onDelete={handleDeleteSession}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

function SessionGroup({
  title,
  description,
  sessions,
  busyActionKey,
  onOpen,
  openLabel = 'Open',
  onUseInLab,
  onToggleAchieved,
  onDelete,
}: {
  title: string;
  description: string;
  sessions: CompassSessionSummary[];
  busyActionKey: string | null;
  onOpen: (id: string) => void;
  openLabel?: string;
  onUseInLab?: (id: string) => Promise<void>;
  onToggleAchieved?: (session: CompassSessionSummary) => Promise<void>;
  onDelete?: (session: CompassSessionSummary) => Promise<void>;
}) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sessions.map(session => (
          <article
            key={session.id}
            data-compass-session-id={session.id}
            className="rounded-3xl border border-gray-800 bg-gray-900/60 p-5 text-left transition hover:border-amber-400/40 hover:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-gray-100">{session.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-500">
                  {session.planningYear} planning year
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <StatusPill
                  tone={session.status === 'completed' ? 'success' : 'warning'}
                  label={session.status === 'completed' ? 'Completed' : 'In Progress'}
                />
                {session.isActive ? <StatusPill tone="neutral" label="Active" /> : null}
                {session.achievedAt ? <StatusPill tone="success" label="Achieved" /> : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <SessionMetric label="Answers" value={String(session.answerCount)} />
              <SessionMetric
                label={session.status === 'completed' ? 'Completed' : 'Updated'}
                value={new Date(session.completedAt ?? session.updatedAt).toLocaleDateString()}
              />
            </div>
            {session.insights ? (
              <p className="mt-4 text-sm text-gray-400">
                {session.insights.annualGoals.length} annual goal{session.insights.annualGoals.length === 1 ? '' : 's'} seeded into LAB.
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onOpen(session.id)}
                className="rounded-full border border-gray-700 bg-gray-950/80 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-amber-300/40 hover:text-amber-100"
              >
                {openLabel}
              </button>
              {session.status === 'completed' && onUseInLab ? (
                <button
                  type="button"
                  onClick={() => void onUseInLab(session.id)}
                  disabled={busyActionKey === `active:${session.id}` || session.isActive}
                  className="rounded-full border border-amber-300/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/60 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {session.isActive
                    ? 'Using in LAB'
                    : busyActionKey === `active:${session.id}`
                      ? 'Updating...'
                      : 'Use in LAB'}
                </button>
              ) : null}
              {session.status === 'completed' && onToggleAchieved ? (
                <button
                  type="button"
                  onClick={() => void onToggleAchieved(session)}
                  disabled={busyActionKey === `achieved:${session.id}`}
                  className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyActionKey === `achieved:${session.id}`
                    ? 'Updating...'
                    : session.achievedAt
                      ? 'Unmark achieved'
                      : 'Mark achieved'}
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => void onDelete(session)}
                  disabled={busyActionKey === `delete:${session.id}`}
                  className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:border-red-300/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyActionKey === `delete:${session.id}` ? 'Deleting...' : 'Delete'}
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function SessionMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-gray-200">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const className =
    tone === 'success'
      ? 'bg-emerald-500/10 text-emerald-200'
      : tone === 'warning'
        ? 'bg-amber-500/10 text-amber-200'
        : 'bg-sky-500/10 text-sky-200';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}
