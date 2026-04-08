import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HOME_PATH, QUANTUM_PLANNER_PATH } from '../../constants/routes';

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../auth-context', () => ({
  useAuth,
}));

import { EntitledRoute } from '../EntitledRoute';

describe('EntitledRoute', () => {
  it('redirects free users away from premium routes', () => {
    useAuth.mockReturnValue({
      profile: {
        accountTier: 'free',
      },
    });

    render(
      <MemoryRouter initialEntries={[QUANTUM_PLANNER_PATH]}>
        <Routes>
          <Route path={HOME_PATH} element={<div>module hub</div>} />
          <Route
            path={QUANTUM_PLANNER_PATH}
            element={(
              <EntitledRoute requiredTier="premium">
                <div>premium content</div>
              </EntitledRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('module hub')).toBeInTheDocument();
    expect(screen.queryByText('premium content')).not.toBeInTheDocument();
  });

  it('allows admins through admin-only routes', () => {
    useAuth.mockReturnValue({
      profile: {
        accountTier: 'admin',
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={(
              <EntitledRoute requiredTier="admin">
                <div>admin content</div>
              </EntitledRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
