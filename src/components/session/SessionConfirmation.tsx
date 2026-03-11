import type { SessionExport } from '../../types/session';
import type { ValidationWarning } from '../../parser/schema-validator';

interface SessionConfirmationProps {
  sessionExport: SessionExport;
  warnings: ValidationWarning[];
  onConfirm: () => void;
  onBack: () => void;
  isSaving: boolean;
  saveError: string | null;
}

export function SessionConfirmation({ sessionExport, warnings, onConfirm, onBack, isSaving, saveError }: SessionConfirmationProps) {
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
          <p className="text-sm text-gray-300">{sessionExport.summary}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            <span>Date: {sessionExport.date}</span>
            <span>Mood: {sessionExport.mood}</span>
            <span>Energy: {sessionExport.energy}/10</span>
            <span>Rating: {sessionExport.session_rating}/10</span>
          </div>
        </div>

        {/* New action items */}
        {sessionExport.action_items.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              New Action Items ({sessionExport.action_items.length})
            </h4>
            <ul className="space-y-2">
              {sessionExport.action_items.map((item, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    item.priority === 'high' ? 'bg-red-900/50 text-red-400' :
                    item.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {item.priority}
                  </span>
                  <span>{item.task}</span>
                  <span className="text-gray-500 text-xs ml-auto whitespace-nowrap">due {item.due}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Completed items */}
        {sessionExport.completed_items.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2">
              Completed Items ({sessionExport.completed_items.length})
            </h4>
            <ul className="space-y-1">
              {sessionExport.completed_items.map((id, i) => (
                <li key={i} className="text-sm text-green-300">{id}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Deferred items */}
        {sessionExport.deferred_items.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-2">
              Deferred Items ({sessionExport.deferred_items.length})
            </h4>
            <ul className="space-y-2">
              {sessionExport.deferred_items.map((item, i) => (
                <li key={i} className="text-sm text-gray-300">
                  <span className="text-yellow-300">{item.id}</span> &rarr; {item.new_due}
                  <span className="text-gray-500 block text-xs">{item.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Metrics */}
        {Object.keys(sessionExport.metrics).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Metrics Update
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(sessionExport.metrics).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-500">{key}:</span>{' '}
                  <span className="text-gray-300">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Narrative update */}
        {sessionExport.narrative_update && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Narrative Update
            </h4>
            <p className="text-sm text-gray-300 italic">{sessionExport.narrative_update}</p>
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
