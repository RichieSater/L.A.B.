import { useState, type ComponentProps } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultiInputEditor } from '../MultiInputEditor';

function MultiInputHarness({
  initialItems = [],
  editorProps,
}: {
  initialItems?: string[];
  editorProps?: Partial<ComponentProps<typeof MultiInputEditor>>;
}) {
  const [persistedItems, setPersistedItems] = useState(initialItems);

  return (
    <div>
      <MultiInputEditor
        items={persistedItems}
        placeholder="Add a worry, loose end, or stressor..."
        onChange={items => setPersistedItems(items.filter(item => item.trim().length > 0))}
        {...editorProps}
      />
      <output data-testid="persisted-items">{JSON.stringify(persistedItems)}</output>
    </div>
  );
}

describe('MultiInputEditor', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps focus and uninterrupted typing while deferring parent commits until blur', async () => {
    const user = userEvent.setup();

    render(<MultiInputHarness />);

    const firstInput = screen.getByRole('textbox', { name: 'Compass item 1' });
    await user.click(firstInput);
    await user.type(firstInput, 'Need to simplify my week before it simplifies me');

    expect(firstInput).toHaveValue('Need to simplify my week before it simplifies me');
    expect(firstInput).toHaveFocus();
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('[]');

    await user.tab();

    expect(screen.getByTestId('persisted-items')).toHaveTextContent(
      '["Need to simplify my week before it simplifies me"]',
    );
  });

  it('does not idle-commit list typing before the field blurs', async () => {
    vi.useFakeTimers();

    render(<MultiInputHarness />);

    const firstInput = screen.getByRole('textbox', { name: 'Compass item 1' });
    fireEvent.change(firstInput, {
      target: { value: 'A slower, more deliberate entry' },
    });

    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    expect(firstInput).toHaveValue('A slower, more deliberate entry');
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('[]');

    await act(async () => {
      fireEvent.blur(firstInput);
    });

    expect(screen.getByTestId('persisted-items')).toHaveTextContent(
      '["A slower, more deliberate entry"]',
    );
  });

  it('can keep blur and add-item actions local until a later explicit commit', async () => {
    const user = userEvent.setup();

    render(
      <MultiInputHarness
        editorProps={{
          flushOnBlur: false,
          flushOnStructuralChange: false,
        }}
      />,
    );

    const firstInput = screen.getByRole('textbox', { name: 'Compass item 1' });
    await user.click(firstInput);
    await user.type(firstInput, 'A month note that should stay local');
    await user.tab();

    expect(screen.getByTestId('persisted-items')).toHaveTextContent('[]');

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('[]');
    expect(await screen.findByRole('textbox', { name: 'Compass item 2' })).toHaveValue('');
  });

  it('keeps blank draft rows visible until they are filled', async () => {
    const user = userEvent.setup();

    render(<MultiInputHarness initialItems={['Need more white space on the calendar']} />);

    await user.click(screen.getByRole('button', { name: 'Add item' }));

    const textboxes = await screen.findAllByRole('textbox');
    expect(textboxes).toHaveLength(2);
    expect(textboxes[1]).toHaveValue('');
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('["Need more white space on the calendar"]');

    await user.type(textboxes[1], 'Protect deeper focus blocks');

    expect(textboxes[0]).toHaveValue('Need more white space on the calendar');
    expect(textboxes[1]).toHaveValue('Protect deeper focus blocks');
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('["Need more white space on the calendar"]');

    await user.tab();

    expect(screen.getByTestId('persisted-items')).toHaveTextContent(
      '["Need more white space on the calendar","Protect deeper focus blocks"]',
    );
  });

  it('removes rows without corrupting the remaining values', async () => {
    const user = userEvent.setup();

    render(
      <MultiInputHarness
        initialItems={[
          'Need more white space on the calendar',
          'Protect deeper focus blocks',
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove item 1' }));

    const remainingInput = screen.getByRole('textbox', { name: 'Compass item 1' });
    expect(remainingInput).toHaveValue('Protect deeper focus blocks');
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('["Protect deeper focus blocks"]');

    await user.click(screen.getByRole('button', { name: 'Remove item 1' }));

    expect(screen.getByRole('textbox', { name: 'Compass item 1' })).toHaveValue('');
    expect(screen.getByTestId('persisted-items')).toHaveTextContent('[]');
  });
});
