import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBufferedCommit } from '../use-buffered-commit';

function BufferedCommitHarness({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => string | void | Promise<string | void>;
}) {
  const {
    draftValue,
    setDraftValue,
    flush,
    dirty,
    resetToExternalValue,
  } = useBufferedCommit<string>({
    value,
    onCommit,
  });

  return (
    <div>
      <input
        aria-label="Draft"
        value={draftValue}
        onChange={event => setDraftValue(event.target.value)}
        onBlur={() => {
          void flush();
        }}
      />
      <button
        type="button"
        onClick={() => {
          void flush();
        }}
      >
        Flush
      </button>
      <button type="button" onClick={resetToExternalValue}>Reset</button>
      <output data-testid="dirty">{String(dirty)}</output>
    </div>
  );
}

describe('useBufferedCommit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('commits the current draft after the idle timeout', async () => {
    const onCommit = vi.fn((value: string) => value);

    render(<BufferedCommitHarness value="alpha" onCommit={onCommit} />);

    fireEvent.change(screen.getByLabelText('Draft'), {
      target: { value: 'beta' },
    });

    expect(screen.getByLabelText('Draft')).toHaveValue('beta');
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('beta');
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
  });

  it('flushes the dirty draft on blur without waiting for idle', async () => {
    const onCommit = vi.fn((value: string) => value);

    render(<BufferedCommitHarness value="alpha" onCommit={onCommit} />);

    const input = screen.getByLabelText('Draft');
    fireEvent.change(input, { target: { value: 'gamma' } });

    await act(async () => {
      fireEvent.blur(input);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('gamma');
  });

  it('dedupes blur after an idle commit has already persisted the same draft', async () => {
    const onCommit = vi.fn((value: string) => value);

    render(<BufferedCommitHarness value="alpha" onCommit={onCommit} />);

    const input = screen.getByLabelText('Draft');
    fireEvent.change(input, { target: { value: 'delta' } });

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.blur(input);
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('tracks external value changes and can reset a dirty draft to the latest external value', async () => {
    const onCommit = vi.fn((value: string) => value);
    const { rerender } = render(<BufferedCommitHarness value="alpha" onCommit={onCommit} />);
    const input = screen.getByLabelText('Draft');

    fireEvent.change(input, { target: { value: 'local draft' } });
    expect(screen.getByLabelText('Draft')).toHaveValue('local draft');

    rerender(<BufferedCommitHarness value="server value" onCommit={onCommit} />);
    expect(screen.getByLabelText('Draft')).toHaveValue('local draft');
    expect(screen.getByTestId('dirty')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByLabelText('Draft')).toHaveValue('server value');
    expect(screen.getByTestId('dirty')).toHaveTextContent('false');
  });

  it('supports explicit flush-on-demand', async () => {
    const onCommit = vi.fn((value: string) => value);

    render(<BufferedCommitHarness value="alpha" onCommit={onCommit} />);

    fireEvent.change(screen.getByLabelText('Draft'), {
      target: { value: 'epsilon' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Flush' }));
    });

    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('epsilon');
  });
});
