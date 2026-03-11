import { useState, useEffect, useCallback } from 'react';
import type { AdvisorId } from '../../types/advisor';
import type { QuickLogEntry } from '../../types/quick-log';
import { useAppState } from '../../state/app-context';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { selectActivatedAdvisorIds } from '../../state/selectors';
import { today } from '../../utils/date';

export function DailyLogButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Daily Check-in
      </button>

      {showModal && (
        <DailyLogModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

function DailyLogModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useAppState();
  const [date, setDate] = useState(today());
  const [values, setValues] = useState<Record<string, Record<string, number | string>>>({});
  const [saved, setSaved] = useState(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  // Get activated advisors that have quick-loggable metrics
  const activatedIds = selectActivatedAdvisorIds(state);
  const loggableAdvisors = activatedIds.filter(id => {
    const config = ADVISOR_CONFIGS[id];
    return config.metricDefinitions.some(m => m.quickLoggable);
  });

  const updateValue = (advisorId: AdvisorId, metricId: string, value: number | string) => {
    setValues(prev => ({
      ...prev,
      [advisorId]: {
        ...prev[advisorId],
        [metricId]: value,
      },
    }));
  };

  const handleSave = () => {
    for (const advisorId of loggableAdvisors) {
      const advisorValues = values[advisorId];
      if (!advisorValues) continue;

      const logs: Record<string, number | string> = {};
      for (const [key, val] of Object.entries(advisorValues)) {
        if (val !== '' && val !== undefined) {
          logs[key] = val;
        }
      }

      if (Object.keys(logs).length === 0) continue;

      const entry: QuickLogEntry = {
        advisorId,
        date,
        timestamp: new Date().toISOString(),
        logs,
      };

      dispatch({ type: 'ADD_QUICK_LOG', payload: entry });
    }

    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  const hasAnyValues = Object.values(values).some(
    advisorVals => Object.values(advisorVals).some(v => v !== '' && v !== undefined),
  );

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md">
          <div className="text-center py-8">
            <div className="text-4xl mb-2">&#10003;</div>
            <p className="text-green-400 font-medium">All logged!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-1">Daily Check-in</h3>
        <p className="text-sm text-gray-500 mb-4">Log your daily metrics across all advisors</p>

        {/* Date */}
        <div className="mb-5">
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grouped by advisor */}
        <div className="space-y-6">
          {loggableAdvisors.map(advisorId => {
            const config = ADVISOR_CONFIGS[advisorId];
            const quickMetrics = config.metricDefinitions.filter(m => m.quickLoggable);

            return (
              <div key={advisorId}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium" style={{ color: config.domainColor }}>
                    {config.shortName}
                  </span>
                </div>
                <div className="space-y-3 pl-7">
                  {quickMetrics.map(metric => (
                    <CompactMetricInput
                      key={metric.id}
                      metric={metric}
                      value={values[advisorId]?.[metric.id]}
                      onChange={(val) => updateValue(advisorId, metric.id, val)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasAnyValues}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
}

import type { MetricDefinition } from '../../types/metrics';

function CompactMetricInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDefinition;
  value: number | string | undefined;
  onChange: (val: number | string) => void;
}) {
  if (metric.type === 'rating' && metric.min !== undefined && metric.max !== undefined) {
    const numbers = Array.from({ length: metric.max - metric.min + 1 }, (_, i) => i + metric.min!);
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">
          {metric.label} ({metric.min}-{metric.max})
        </label>
        <div className="flex gap-1 flex-wrap">
          {numbers.map(n => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                value === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (metric.type === 'binary') {
    return (
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">{metric.label}</label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange(0)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              value === 0
                ? 'bg-red-600/30 text-red-300 border border-red-600'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            No
          </button>
          <button
            onClick={() => onChange(1)}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              value === 1
                ? 'bg-green-600/30 text-green-300 border border-green-600'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Yes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {metric.label}{metric.unit ? ` (${metric.unit})` : ''}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' as any : Number(v));
        }}
        placeholder={metric.label.toLowerCase()}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
      />
    </div>
  );
}
