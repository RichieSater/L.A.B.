import { useState } from 'react';

interface MultiInputRow {
  id: string;
  value: string;
}

let nextMultiInputRowId = 0;

function createMultiInputRow(value = ''): MultiInputRow {
  const id = `compass-multi-input-${nextMultiInputRowId}`;
  nextMultiInputRowId += 1;

  return {
    id,
    value,
  };
}

function normalizePersistedItems(items: string[]): string[] {
  const normalized = items
    .map(item => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : [''];
}

export function MultiInputEditor({
  items,
  placeholder,
  onChange,
}: {
  items: string[];
  placeholder: string;
  onChange: (items: string[]) => void;
}) {
  const [rows, setRows] = useState<MultiInputRow[]>(() =>
    normalizePersistedItems(items).map(item => createMultiInputRow(item)),
  );

  function commitRows(nextRows: MultiInputRow[]) {
    setRows(nextRows);
    onChange(nextRows.map(row => row.value));
  }

  function updateItem(id: string, value: string) {
    commitRows(rows.map(row => (row.id === id ? { ...row, value } : row)));
  }

  function addItem() {
    commitRows([...rows, createMultiInputRow('')]);
  }

  function removeItem(id: string) {
    if (rows.length === 1) {
      commitRows([{ ...rows[0], value: '' }]);
      return;
    }

    commitRows(rows.filter(row => row.id !== id));
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.id} className="flex items-center gap-3">
          <input
            type="text"
            value={row.value}
            onChange={event => updateItem(row.id, event.target.value)}
            placeholder={placeholder}
            aria-label={`Compass item ${index + 1}`}
            className="flex-1 rounded-full border border-gray-800 bg-gray-950/70 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
          />
          <button
            type="button"
            onClick={() => removeItem(row.id)}
            aria-label={`Remove item ${index + 1}`}
            className="rounded-full border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300 transition hover:border-gray-500 hover:text-white"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="rounded-full border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/50 hover:bg-amber-500/20"
      >
        Add item
      </button>
    </div>
  );
}
