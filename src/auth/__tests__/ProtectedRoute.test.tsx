import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../auth-context', () => ({
  useAuth,
}));

import { ProtectedRoute } from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  it('renders the recovery screen instead of redirecting on bootstrap failure', () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const retryBootstrap = vi.fn().mockResolvedValue(undefined);

    useAuth.mockReturnValue({
      user: { id: 'user_123', primaryEmailAddress: 'user@example.com' },
      profile: null,
      bootstrapData: null,
      bootstrapError: {
        error: 'A server error has occurred',
        code: 'BOOTSTRAP_FAILED',
        requestId: 'iad1::request-2',
      },
      loading: false,
      signOut,
      updateProfile: vi.fn(),
      refreshBootstrap: vi.fn(),
      retryBootstrap,
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={(
              <ProtectedRoute>
                <div>Protected content</div>
              </ProtectedRoute>
            )}
          />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Bootstrap failed')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
