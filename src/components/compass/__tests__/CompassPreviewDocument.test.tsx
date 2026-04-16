import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createCompassTestSession } from '../../../testing/compass-test-data';
import { CompassPreviewDocument } from '../CompassPreviewDocument';

function renderPastPreview() {
  const session = createCompassTestSession({
    answers: {
      'past-months': {
        includeCurrentMonth: 'false',
      },
      'past-monthly-events': {
        month1: JSON.stringify(['Started the quarter with less noise.']),
        month2: JSON.stringify(['Made the first clean strategic cut.']),
        month3: JSON.stringify(['Protected a stronger baseline.']),
        month4: JSON.stringify(['Simplified a relationship that mattered.']),
      },
    },
  });

  render(
    <CompassPreviewDocument
      session={session}
      config={{
        title: 'Past-Year Preview',
        sectionKeys: ['past'],
        emphasisSectionKey: 'past',
        availability: 'checkpoint',
      }}
      showDocumentIntro={false}
    />,
  );
}

describe('CompassPreviewDocument', () => {
  it('renders a single-entry preview section at full width', () => {
    renderPastPreview();

    const entryTitle = screen.getByRole('heading', { level: 3, name: 'Month-By-Month Review' });
    const entryGrid = entryTitle.closest('article')?.parentElement;

    expect(entryGrid).toHaveClass('mt-6', 'grid', 'gap-4');
    expect(entryGrid).not.toHaveClass('xl:grid-cols-2');
  });

  it('uses the denser grouped month grid without changing month order', () => {
    renderPastPreview();

    const groupedListGrid = screen.getByText('Month-by-month review').nextElementSibling;

    expect(groupedListGrid).toHaveClass('grid', 'gap-3', 'md:grid-cols-2', 'xl:grid-cols-3');
    expect(
      within(groupedListGrid as HTMLElement)
        .getAllByText(/^(April|May|June|July)$/)
        .map(node => node.textContent),
    ).toEqual(['April', 'May', 'June', 'July']);
  });
});
