import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GOLDEN_COMPASS_PATH } from '../constants/routes';
import { apiClient, isApiClientError } from '../lib/api';
import type { CompassSessionDetail } from '../types/compass';
import { CompassSessionRunner } from '../components/compass/CompassSessionRunner';

export function CompassSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<CompassSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate(GOLDEN_COMPASS_PATH, { replace: true });
      return;
    }

    let active = true;

    apiClient.getCompassSession(sessionId)
      .then(result => {
        if (active) {
          setSession(result);
          setError(null);
        }
      })
      .catch(err => {
        if (!active) {
          return;
        }

        if (isApiClientError(err) && err.status === 404) {
          navigate(GOLDEN_COMPASS_PATH, { replace: true });
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load this Compass session.');
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [navigate, sessionId]);

  if (loading) {
    return (
      <div className="lab-page lab-page--narrow">
        <div className="lab-panel rounded-[1.75rem] p-8 text-center">
          <p className="text-sm text-[color:var(--lab-text-muted)]">Loading your Golden Compass session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="lab-page lab-page--narrow">
        <div className="lab-panel rounded-[1.75rem] border-[rgba(230,123,123,0.32)] bg-[rgba(230,123,123,0.12)] p-8 text-center">
        <h2 className="text-xl font-semibold text-[color:var(--lab-text)]">Compass unavailable</h2>
        <p className="mt-3 text-sm text-[color:var(--lab-text-muted)]">{error ?? 'This Compass session could not be loaded.'}</p>
        <button
          type="button"
          onClick={() => navigate(GOLDEN_COMPASS_PATH)}
          className="lab-button lab-button--ghost mt-6 rounded-2xl"
        >
          Back to Compass
        </button>
        </div>
      </div>
    );
  }

  return <CompassSessionRunner initialSession={session} />;
}
