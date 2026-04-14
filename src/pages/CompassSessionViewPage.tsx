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
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-800 bg-gray-900/70 p-8 text-center">
        <p className="text-sm text-gray-400">Loading your Golden Compass view...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-red-900/50 bg-red-950/20 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-100">Compass view unavailable</h2>
        <p className="mt-3 text-sm text-gray-400">{error ?? 'This Compass session could not be loaded.'}</p>
        <button
          type="button"
          onClick={() => navigate(GOLDEN_COMPASS_PATH)}
          className="mt-6 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-300/60 hover:bg-amber-500/20"
        >
          Back to Compass
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div
        data-compass-print-hidden="true"
        className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gray-800 bg-gray-900/70 p-4"
      >
        <button
          type="button"
          onClick={() => navigate(GOLDEN_COMPASS_PATH)}
          className="rounded-full border border-gray-700 bg-gray-950/80 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-gray-500 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-950 transition hover:border-amber-200 hover:bg-amber-100"
        >
          Download PDF
        </button>
      </div>

      <CompassPreviewDocument session={session} config={previewConfig} />
    </div>
  );
}
