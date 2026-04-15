import { useEffect, useMemo, useRef, useState } from 'react';
import { useBufferedCommit } from '../../hooks/use-buffered-commit';

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

function normalizeCommittedItems(items: string[]): string[] {
  return items
    .map(item => item.trim())
    .filter(Boolean);
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function syncRowsWithItems(rows: MultiInputRow[], items: string[]): MultiInputRow[] {
  const normalizedItems = normalizePersistedItems(items);
  const syncedRows = normalizedItems.map((item, index) => {
    const existingRow = rows[index];
    if (!existingRow) {
      return createMultiInputRow(item);
    }

    if (existingRow.value === item) {
      return existingRow;
    }

    return {
      ...existingRow,
      value: item,
    };
  });

  const trailingRows = rows.slice(normalizedItems.length);
  const canPreserveTrailingBlankRows =
    trailingRows.length > 0
    && normalizedItems.every((item, index) => rows[index]?.value === item)
    && trailingRows.every(row => row.value.trim().length === 0);

  return canPreserveTrailingBlankRows
    ? [...syncedRows, ...trailingRows]
    : syncedRows;
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
  committedItems,
  placeholder,
  inputLabelPrefix = 'Compass item',
  addItemLabel = 'Add item',
  minItems,
  maxItems,
  idleMs = null,
  flushOnBlur = true,
  flushOnStructuralChange = true,
  onChange,
  onDraftChange,
  onAdvanceRequest,
  onCommitRequest,
}: {
  items: string[];
  committedItems?: string[];
  placeholder: string;
  inputLabelPrefix?: string;
  addItemLabel?: string;
  minItems?: number;
  maxItems?: number;
  idleMs?: number | null;
  flushOnBlur?: boolean;
  flushOnStructuralChange?: boolean;
  onChange: (items: string[]) => void;
  onDraftChange?: (items: string[]) => void;
  onAdvanceRequest?: () => void;
  onCommitRequest?: () => void | Promise<void>;
}) {
  const [rows, setRows] = useState<MultiInputRow[]>(() =>
    normalizePersistedItems(items).map(item => createMultiInputRow(item)),
  );
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pendingFocusRowIdRef = useRef<string | null>(null);
  const externalCommittedItems = committedItems ?? items;
  const [committedBaseline, setCommittedBaseline] = useState<string[]>(externalCommittedItems);
  const committedBaselineRef = useRef(committedBaseline);
  const {
    setDraftValue,
    flush,
    dirty,
  } = useBufferedCommit<string[]>({
    value: committedBaseline,
    idleMs,
    onCommit: nextItems => {
      const nextCommittedItems = normalizeCommittedItems(nextItems);
      if (!areStringArraysEqual(nextCommittedItems, committedBaselineRef.current)) {
        onChange(nextCommittedItems);
        committedBaselineRef.current = nextCommittedItems;
        setCommittedBaseline(nextCommittedItems);
      }

      return nextCommittedItems;
    },
    isEqual: areStringArraysEqual,
  });

  useEffect(() => {
    if (!pendingFocusRowIdRef.current) {
      return;
    }

    const rowId = pendingFocusRowIdRef.current;
    pendingFocusRowIdRef.current = null;
    inputRefs.current[rowId]?.focus();
  }, [rows]);

  useEffect(() => {
    if (areStringArraysEqual(externalCommittedItems, committedBaselineRef.current)) {
      return;
    }

    committedBaselineRef.current = externalCommittedItems;
    setCommittedBaseline(externalCommittedItems);
  }, [externalCommittedItems]);

  useEffect(() => {
    if (dirty) {
      return;
    }

    setRows(currentRows => syncRowsWithItems(currentRows, items));
  }, [dirty, items]);

  const filledCount = useMemo(
    () => rows.filter(row => row.value.trim().length > 0).length,
    [rows],
  );
  const canAddMore = maxItems === undefined || rows.length < maxItems;
  const requirementCopy = buildRequirementCopy(minItems, maxItems, filledCount);

  async function requestBufferedCommit() {
    await flush();
    await onCommitRequest?.();
  }

  function commitRows(nextRows: MultiInputRow[], options: { flush?: boolean } = {}) {
    const nextDraftItems = normalizeCommittedItems(nextRows.map(row => row.value));
    setRows(nextRows);
    onDraftChange?.(nextDraftItems);
    setDraftValue(nextDraftItems);

    if (options.flush) {
      void requestBufferedCommit();
    }
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
    commitRows(nextRows, { flush: flushOnStructuralChange });
  }

  function removeItem(id: string) {
    if (rows.length === 1) {
      commitRows([{ ...rows[0], value: '' }], { flush: flushOnStructuralChange });
      return;
    }

    commitRows(rows.filter(row => row.id !== id), { flush: flushOnStructuralChange });
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
              onBlur={() => {
                if (!flushOnBlur) {
                  return;
                }

                void requestBufferedCommit();
              }}
              onKeyDown={event => handleKeyDown(event, row, index)}
              placeholder={placeholder}
              aria-label={`${inputLabelPrefix} ${index + 1}`}
              className="flex-1 rounded-full border border-gray-800 bg-gray-900/80 px-4 py-3 text-sm text-gray-100 placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none focus:ring-1 focus:ring-amber-300/20"
            />
            <button
              type="button"
              onMouseDown={event => {
                event.preventDefault();
              }}
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
        onMouseDown={event => {
          event.preventDefault();
        }}
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
