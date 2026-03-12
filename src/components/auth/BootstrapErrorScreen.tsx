import type { ApiError } from '../../types/api';

function getErrorDetails(error: Error | ApiError) {
  if ('error' in error) {
    return {
      title: 'We could not finish loading your account.',
      message: error.error,
      code: error.code,
      requestId: error.requestId,
    };
  }

  return {
    title: 'We could not finish loading your account.',
    message: error.message || 'Try again or sign out and start over.',
    code: undefined,
    requestId: undefined,
  };
}

interface BootstrapErrorScreenProps {
  error: Error | ApiError;
  onRetry: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function BootstrapErrorScreen({ error, onRetry, onSignOut }: BootstrapErrorScreenProps) {
  const details = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-red-900/70 bg-gray-900/95 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Bootstrap failed</p>
          <h1 className="mt-3 text-2xl font-semibold text-gray-100">{details.title}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-300">{details.message}</p>
          {(details.code || details.requestId) && (
            <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-950/80 px-4 py-3 text-xs text-gray-400">
              {details.code && <p>Code: {details.code}</p>}
              {details.requestId && <p>Request ID: {details.requestId}</p>}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                void onRetry();
              }}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => {
                void onSignOut();
              }}
              className="rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
