import type { NormalizedSessionImport, SessionImport } from '../../types/session';
import type { ValidationWarning } from '../../parser/schema-validator';

interface SessionConfirmationProps {
  sessionImport: SessionImport;
  normalizedImport: NormalizedSessionImport;
  warnings: ValidationWarning[];
  onConfirm: () => void;
  onBack: () => void;
  isSaving: boolean;
  saveError: string | null;
}

export function SessionConfirmation({
  sessionImport,
  normalizedImport,
  warnings,
  onConfirm,
  onBack,
  isSaving,
  saveError,
}: SessionConfirmationProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-100">Confirm Session Import</h3>
        <p className="text-sm text-gray-400 mt-1">
          Review what will be updated, then confirm.
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Session Summary</h4>
          <p className="text-sm text-gray-300">{sessionImport.summary}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            <span>Date: {sessionImport.date}</span>
            <span>Mood: {sessionImport.mood}</span>
            <span>Energy: {sessionImport.energy}/10</span>
            <span>Rating: {sessionImport.session_rating}/10</span>
          </div>
        </div>

        {normalizedImport.preview.tasks.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Task Changes ({normalizedImport.preview.tasks.length})
            </h4>
            <ul className="space-y-2">
              {normalizedImport.preview.tasks.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    item.type === 'create' ? 'bg-green-900/50 text-green-300' :
                    item.type === 'auto-merge' ? 'bg-blue-900/50 text-blue-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {item.type}
                  </span>
                  <span>{item.after?.task ?? item.before?.task ?? item.taskId}</span>
                  {item.after?.dueDate && (
                    <span className="text-gray-500 text-xs ml-auto whitespace-nowrap">
                      due {item.after.dueDate}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {normalizedImport.preview.habits.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2">
              Habit Changes ({normalizedImport.preview.habits.length})
            </h4>
            <ul className="space-y-1">
              {normalizedImport.preview.habits.map((item, i) => (
                <li key={i} className="text-sm text-green-300">
                  {item.type}: {item.after?.name ?? item.before?.name ?? item.habitId}
                </li>
              ))}
            </ul>
          </div>
        )}

        {normalizedImport.preview.checkInConfigChanged && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-2">
              Daily Check-in Update
            </h4>
            <p className="text-sm text-yellow-200">
              This import replaces the advisor check-in with {sessionImport.check_in_config?.length ?? 0} item(s).
            </p>
          </div>
        )}

        {/* Metrics */}
        {Object.keys(sessionImport.metrics).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Metrics Update
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sessionImport.metrics).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span className="text-gray-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Narrative update */}
        {sessionImport.narrative_update && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Narrative Update
            </h4>
            <p className="text-sm text-gray-300 italic">{sessionImport.narrative_update}</p>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="bg-yellow-950/50 border border-yellow-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings (non-blocking)</h4>
            <ul className="space-y-1">
              {warnings.map((warn, i) => (
                <li key={i} className="text-sm text-yellow-300">{warn.field}: {warn.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Save error */}
      {saveError && (
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mt-4">
          <p className="text-sm text-red-300">{saveError}</p>
          <p className="text-xs text-red-400 mt-1">Please try again. If the problem persists, check your connection.</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          disabled={isSaving}
          className="px-4 py-2.5 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          &larr; Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
            isSaving
              ? 'bg-green-800 text-green-300 cursor-wait'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isSaving ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}
