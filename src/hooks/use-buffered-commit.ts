import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

type CommitResult<T> = T | void | Promise<T | void>;

interface UseBufferedCommitOptions<T> {
  value: T;
  onCommit: (value: T) => CommitResult<T>;
  idleMs?: number;
  isEqual?: (left: T, right: T) => boolean;
}

interface UseBufferedCommitResult<T> {
  draftValue: T;
  setDraftValue: Dispatch<SetStateAction<T>>;
  flush: () => Promise<void>;
  dirty: boolean;
  resetToExternalValue: () => void;
}

function resolveSetStateAction<T>(
  nextValue: SetStateAction<T>,
  previousValue: T,
): T {
  return typeof nextValue === 'function'
    ? (nextValue as (value: T) => T)(previousValue)
    : nextValue;
}

export function useBufferedCommit<T>({
  value,
  onCommit,
  idleMs = 4000,
  isEqual = Object.is,
}: UseBufferedCommitOptions<T>): UseBufferedCommitResult<T> {
  const [draftValue, setDraftValueState] = useState(value);
  const [dirty, setDirty] = useState(false);
  const draftValueRef = useRef(value);
  const committedValueRef = useRef(value);
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitPromiseRef = useRef<Promise<void> | null>(null);
  const onCommitRef = useRef(onCommit);
  const isEqualRef = useRef(isEqual);
  const commitOnceRef = useRef<(rescheduleIfDirty: boolean) => Promise<boolean>>(async () => false);

  const clearScheduledCommit = useCallback(() => {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const scheduleCommit = useCallback(() => {
    clearScheduledCommit();
    timerRef.current = setTimeout(() => {
      void commitOnceRef.current(true);
    }, idleMs);
  }, [clearScheduledCommit, idleMs]);

  const commitOnce = useCallback(async (rescheduleIfDirty: boolean): Promise<boolean> => {
    clearScheduledCommit();

    if (commitPromiseRef.current) {
      await commitPromiseRef.current;

      if (dirtyRef.current && rescheduleIfDirty) {
        scheduleCommit();
      }

      return false;
    }

    if (!dirtyRef.current) {
      return false;
    }

    const draftSnapshot = draftValueRef.current;
    const commitPromise = Promise.resolve(onCommitRef.current(draftSnapshot))
      .then(result => {
        const committedValue = result === undefined ? draftSnapshot : result;
        committedValueRef.current = committedValue;

        const draftChangedDuringCommit = !isEqualRef.current(draftValueRef.current, draftSnapshot);
        if (!draftChangedDuringCommit) {
          draftValueRef.current = committedValue;
          setDraftValueState(committedValue);
        }

        const stillDirty = !isEqualRef.current(draftValueRef.current, committedValueRef.current);
        dirtyRef.current = stillDirty;
        setDirty(stillDirty);

        if (stillDirty && rescheduleIfDirty) {
          scheduleCommit();
        }
      })
      .finally(() => {
        if (commitPromiseRef.current === commitPromise) {
          commitPromiseRef.current = null;
        }
      });

    commitPromiseRef.current = commitPromise;
    await commitPromise;
    return true;
  }, [clearScheduledCommit, scheduleCommit]);

  const setDraftValue = useCallback<Dispatch<SetStateAction<T>>>((nextValue) => {
    const resolvedValue = resolveSetStateAction(nextValue, draftValueRef.current);
    if (isEqualRef.current(resolvedValue, draftValueRef.current)) {
      return;
    }

    draftValueRef.current = resolvedValue;
    setDraftValueState(resolvedValue);

    const nextDirty = !isEqualRef.current(resolvedValue, committedValueRef.current);
    dirtyRef.current = nextDirty;
    setDirty(nextDirty);

    if (nextDirty) {
      scheduleCommit();
      return;
    }

    clearScheduledCommit();
  }, [clearScheduledCommit, scheduleCommit]);

  const flush = useCallback(async () => {
    clearScheduledCommit();

    while (commitPromiseRef.current || dirtyRef.current) {
      if (commitPromiseRef.current) {
        await commitPromiseRef.current;
        continue;
      }

      const committed = await commitOnce(false);
      if (!committed) {
        break;
      }
    }
  }, [clearScheduledCommit, commitOnce]);

  const resetToExternalValue = useCallback(() => {
    clearScheduledCommit();
    draftValueRef.current = committedValueRef.current;
    dirtyRef.current = false;
    setDraftValueState(committedValueRef.current);
    setDirty(false);
  }, [clearScheduledCommit]);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    isEqualRef.current = isEqual;
  }, [isEqual]);

  useEffect(() => {
    commitOnceRef.current = commitOnce;
  }, [commitOnce]);

  useEffect(() => {
    if (isEqualRef.current(value, committedValueRef.current)) {
      return;
    }

    committedValueRef.current = value;
    const nextDirty = !isEqualRef.current(draftValueRef.current, committedValueRef.current);
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (!nextDirty) {
        draftValueRef.current = value;
        dirtyRef.current = false;
        setDraftValueState(value);
        setDirty(false);
        clearScheduledCommit();
        return;
      }

      dirtyRef.current = true;
      setDirty(true);
    });

    return () => {
      cancelled = true;
    };
  }, [clearScheduledCommit, value]);

  useEffect(() => () => {
    clearScheduledCommit();
  }, [clearScheduledCommit]);

  return {
    draftValue,
    setDraftValue,
    flush,
    dirty,
    resetToExternalValue,
  };
}
