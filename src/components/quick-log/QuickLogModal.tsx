import { useEffect, useCallback } from 'react';
import type { AdvisorId } from '../../types/advisor';
import type { QuickLogEntry } from '../../types/quick-log';
import { useAppState } from '../../state/app-context';
import { QuickLogForm } from './QuickLogForm';

interface QuickLogModalProps {
  advisorId: AdvisorId;
  onClose: () => void;
}

export function QuickLogModal({ advisorId, onClose }: QuickLogModalProps) {
  const { dispatch } = useAppState();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  const handleSave = (entry: QuickLogEntry) => {
    dispatch({ type: 'ADD_QUICK_LOG', payload: entry });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <QuickLogForm
          advisorId={advisorId}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
