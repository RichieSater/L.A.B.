import { useState } from 'react';
import type { ValidationError, ValidationWarning } from '../../parser/schema-validator';

interface JsonImportProps {
  onParse: (json: string) => void;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export function JsonImport({ onParse, errors, warnings }: JsonImportProps) {
  const [jsonText, setJsonText] = useState('');

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Import Session Export</h3>
        <p className="text-sm text-gray-400 mt-1">
          Paste the JSON block from the end of your AI conversation below.
        </p>
      </div>

      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder={'Paste the JSON export here...\n\nIt should start with { and end with }\nThe AI was instructed to wrap it in ```json code fences — that\'s fine, paste the whole thing.'}
        className="w-full h-64 bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
      />

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 bg-red-950/50 border border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-400 mb-2">Validation Errors</h4>
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-sm text-red-300">
                <span className="font-mono text-red-400">{err.field}</span>: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && errors.length === 0 && (
        <div className="mt-4 bg-yellow-950/50 border border-yellow-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Warnings</h4>
          <ul className="space-y-1">
            {warnings.map((warn, i) => (
              <li key={i} className="text-sm text-yellow-300">
                <span className="font-mono text-yellow-400">{warn.field}</span>: {warn.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onParse(jsonText)}
          disabled={!jsonText.trim()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors"
        >
          Parse & Validate
        </button>
      </div>
    </div>
  );
}
