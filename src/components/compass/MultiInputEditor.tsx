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
    <div className="space-y-4 rounded-[1.75rem] border border-[rgba(228,209,174,0.16)] bg-[rgba(228,209,174,0.05)] p-4">
      <div className="lab-subpanel lab-subpanel--soft flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            List builder
          </p>
          {requirementCopy ? (
            <p className="mt-2 text-sm font-medium text-[color:var(--lab-text)]">{requirementCopy}</p>
          ) : (
            <p className="mt-2 text-sm font-medium text-[color:var(--lab-text)]">Add items one by one</p>
          )}
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-[color:var(--lab-text-muted)]">
          Press `Enter` to add another item. Press `Cmd/Ctrl+Enter` to continue.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="lab-subpanel flex items-center gap-3 px-3 py-3"
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
              className="lab-input flex-1 rounded-full !py-3"
            />
            <button
              type="button"
              onMouseDown={event => {
                event.preventDefault();
              }}
              onClick={() => removeItem(row.id)}
              aria-label={`Remove item ${index + 1}`}
              className="lab-action lab-action--danger"
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
        className="lab-button lab-button--ink"
      >
        {canAddMore ? 'Add item' : 'Item limit reached'}
      </button>
    </div>
  );
}
