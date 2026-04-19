import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GOLDEN_COMPASS_PATH } from '../constants/routes';
import { apiClient, isApiClientError } from '../lib/api';
import type { CompassSessionDetail } from '../types/compass';
import { CompassPreviewDocument } from '../components/compass/CompassPreviewDocument';
import { createFullCompassPreviewConfig } from '../lib/compass-preview';

export function CompassSessionViewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<CompassSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previewConfig = useMemo(() => createFullCompassPreviewConfig(), []);

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
          <p className="text-sm text-[color:var(--lab-text-muted)]">Loading your Golden Compass view...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="lab-page lab-page--narrow">
        <div className="lab-panel rounded-[1.75rem] border-[rgba(230,123,123,0.32)] bg-[rgba(230,123,123,0.12)] p-8 text-center">
        <h2 className="text-xl font-semibold text-[color:var(--lab-text)]">Compass view unavailable</h2>
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

  return (
    <div className="lab-page space-y-6">
      <div
        data-compass-print-hidden="true"
        className="lab-panel flex flex-wrap items-center justify-between gap-3 rounded-[1.75rem] p-4"
      >
        <button
          type="button"
          onClick={() => navigate(GOLDEN_COMPASS_PATH)}
          className="lab-button lab-button--ghost rounded-2xl"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="lab-button lab-button--gold rounded-2xl"
        >
          Download PDF
        </button>
      </div>

      <CompassPreviewDocument session={session} config={previewConfig} />
    </div>
  );
}
