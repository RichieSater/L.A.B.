import { useState } from 'react';
import type { AdvisorId } from '../../types/advisor';
import type { MetricDefinition } from '../../types/metrics';
import type { QuickLogEntry } from '../../types/quick-log';
import { ADVISOR_CONFIGS } from '../../advisors/registry';
import { useAppState } from '../../state/app-context';
import { today } from '../../utils/date';

interface QuickLogFormProps {
  advisorId: AdvisorId;
  onSave: (entry: QuickLogEntry) => void;
  onCancel: () => void;
}

export function QuickLogForm({ advisorId, onSave, onCancel }: QuickLogFormProps) {
  const config = ADVISOR_CONFIGS[advisorId];
  const { state } = useAppState();
  const advisorState = state.advisors[advisorId];
  const quickMetrics = advisorState?.customCheckInItems?.length
    ? advisorState.customCheckInItems
    : config.metricDefinitions.filter(m => m.quickLoggable);

  const [date, setDate] = useState(today());
  const [values, setValues] = useState<Record<string, number | string>>({});
  const [saved, setSaved] = useState(false);

  const updateValue = (metricId: string, value: number | string) => {
    setValues(prev => ({ ...prev, [metricId]: value }));
  };

  const handleSubmit = () => {
    const logs: Record<string, number | string> = {};
    for (const [key, val] of Object.entries(values)) {
      if (val !== '' && val !== undefined) {
        logs[key] = val;
      }
    }

    if (Object.keys(logs).length === 0) return;

    const entry: QuickLogEntry = {
      advisorId,
      date,
      timestamp: new Date().toISOString(),
      logs,
    };

    onSave(entry);
    setSaved(true);
    setTimeout(() => onCancel(), 800);
  };

  const hasValues = Object.values(values).some(v => v !== '' && v !== undefined);

  if (saved) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">&#10003;</div>
        <p className="text-green-400 font-medium">Logged!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Quick Log</h3>
          <p className="text-sm text-gray-500">{config.shortName}</p>
        </div>
      </div>

      {/* Date */}
      <div className="mb-4">
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        {quickMetrics.map(metric => (
          <MetricInput
            key={metric.id}
            metric={metric}
            value={values[metric.id]}
            onChange={(val) => updateValue(metric.id, val)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!hasValues}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          Save Log
        </button>
      </div>
    </div>
  );
}

function MetricInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDefinition;
  value: number | string | undefined;
  onChange: (val: number | string) => void;
}) {
  if (metric.type === 'rating' && metric.min !== undefined && metric.max !== undefined) {
    return (
      <RatingInput
        label={metric.label}
        min={metric.min}
        max={metric.max}
        value={typeof value === 'number' ? value : undefined}
        onChange={onChange}
      />
    );
  }

  if (metric.type === 'binary') {
    return (
      <BinaryInput
        label={metric.label}
        value={typeof value === 'number' ? value : undefined}
        onChange={onChange}
      />
    );
  }

  // Default: number input
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
        {metric.label}{metric.unit ? ` (${metric.unit})` : ''}
      </label>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' as any : Number(v));
        }}
        placeholder={`Enter ${metric.label.toLowerCase()}`}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-600"
      />
    </div>
  );
}

function RatingInput({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number | undefined;
  onChange: (val: number) => void;
}) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
        {label} ({min}-{max})
      </label>
      <div className="flex gap-1.5 flex-wrap">
        {numbers.map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              value === n
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function BinaryInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(0)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === 0
              ? 'bg-red-600/30 text-red-300 border border-red-600'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          No
        </button>
        <button
          onClick={() => onChange(1)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            value === 1
              ? 'bg-green-600/30 text-green-300 border border-green-600'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
        >
          Yes
        </button>
      </div>
    </div>
  );
}
