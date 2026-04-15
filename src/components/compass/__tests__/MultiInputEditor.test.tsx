import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MultiInputEditor } from '../MultiInputEditor';

function MultiInputHarness({ initialItems = [] }: { initialItems?: string[] }) {
  const [persistedItems, setPersistedItems] = useState(initialItems);

  return (
    <div>
      <MultiInputEditor
        items={persistedItems}
        placeholder="Add a worry, loose end, or stressor..."
        onChange={items => setPersistedItems(items.filter(item => item.trim().length > 0))}
      />
      <output data-testid="persisted-items">{JSON.stringify(persistedItems)}</output>
    </div>
  );
}

describe('MultiInputEditor', () => {
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
