import { useEffect, useMemo, useRef, useState } from 'react';

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

function buildRequirementCopy(minItems?: number, maxItems?: number, filledCount?: number): string | null {
  if (minItems && maxItems && minItems === maxItems) {
    return `${filledCount ?? 0} of ${minItems} items added`;
  }

  if (minItems && maxItems) {
    return `${minItems}-${maxItems} items required`;
  }

  if (minItems) {
    return `At least ${minItems} item${minItems === 1 ? '' : 's'} required`;
  }

  if (maxItems) {
    return `Up to ${maxItems} items`;
  }

  return null;
}

export function MultiInputEditor({
  items,
  placeholder,
  inputLabelPrefix = 'Compass item',
  addItemLabel = 'Add item',
  minItems,
  maxItems,
  onChange,
  onAdvanceRequest,
}: {
  items: string[];
  placeholder: string;
  inputLabelPrefix?: string;
  addItemLabel?: string;
  minItems?: number;
  maxItems?: number;
  onChange: (items: string[]) => void;
  onAdvanceRequest?: () => void;
}) {
  const [rows, setRows] = useState<MultiInputRow[]>(() =>
    normalizePersistedItems(items).map(item => createMultiInputRow(item)),
  );
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocusRowIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingFocusRowIdRef.current) {
      return;
    }

    const rowId = pendingFocusRowIdRef.current;
    pendingFocusRowIdRef.current = null;
    inputRefs.current[rowId]?.focus();
  }, [rows]);

  const filledCount = useMemo(
    () => rows.filter(row => row.value.trim().length > 0).length,
    [rows],
  );
  const canAddMore = maxItems === undefined || rows.length < maxItems;
  const requirementCopy = buildRequirementCopy(minItems, maxItems, filledCount);

  function commitRows(nextRows: MultiInputRow[]) {
    setRows(nextRows);
    onChange(nextRows.map(row => row.value));
  }

  function updateItem(id: string, value: string) {
    commitRows(rows.map(row => (row.id === id ? { ...row, value } : row)));
  }

  function addItem(afterIndex = rows.length - 1) {
    if (!canAddMore) {
      return;
    }

    const newRow = createMultiInputRow('');
    const nextRows = [...rows];
    nextRows.splice(afterIndex + 1, 0, newRow);
    pendingFocusRowIdRef.current = newRow.id;
    commitRows(nextRows);
  }

  function removeItem(id: string) {
    if (rows.length === 1) {
      commitRows([{ ...rows[0], value: '' }]);
      return;
    }

    commitRows(rows.filter(row => row.id !== id));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, row: MultiInputRow, index: number) {
    if (event.key !== 'Enter') {
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      onAdvanceRequest?.();
      return;
    }

    if (!row.value.trim() || !canAddMore) {
      return;
    }

    event.preventDefault();
    addItem(index);
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-amber-300/15 bg-amber-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-800/80 bg-gray-950/70 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            List builder
          </p>
          {requirementCopy ? (
            <p className="mt-2 text-sm font-medium text-gray-100">{requirementCopy}</p>
          ) : (
            <p className="mt-2 text-sm font-medium text-gray-100">Add items one by one</p>
          )}
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-gray-400">
          Press `Enter` to add another item. Press `Cmd/Ctrl+Enter` to continue.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-800 bg-gray-950/75 px-3 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300/30 bg-amber-500/10 text-sm font-semibold text-amber-100">
              {index + 1}
            </div>
            <input
              ref={node => {
                inputRefs.current[row.id] = node;
              }}
              type="text"
              value={row.value}
              onChange={event => updateItem(row.id, event.target.value)}
              onKeyDown={event => handleKeyDown(event, row, index)}
              placeholder={placeholder}
              aria-label={`${inputLabelPrefix} ${index + 1}`}
              className="flex-1 rounded-full border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
            />
            <button
              type="button"
              onClick={() => removeItem(row.id)}
              aria-label={`Remove item ${index + 1}`}
              className="rounded-full border border-gray-700 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300 transition hover:border-red-300/40 hover:text-red-100"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addItem()}
        aria-label={addItemLabel}
        disabled={!canAddMore}
        className="rounded-full border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-amber-200/50 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {canAddMore ? 'Add item' : 'Item limit reached'}
      </button>
    </div>
  );
}
