import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from '../../constants/routes';
import { LoginPage } from '../LoginPage';
import { SignupPage } from '../SignupPage';

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../../auth/auth-context', () => ({
  useAuth,
}));

vi.mock('@clerk/react', () => ({
  SignIn: () => <div>sign in form</div>,
  SignUp: () => <div>sign up form</div>,
}));

vi.mock('../../components/auth/AuthPageShell', () => ({
  AuthPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/auth/auth-component-appearance', () => ({
  authComponentAppearance: {},
}));

describe('auth entry pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects signed-in users from login to the module hub', () => {
    useAuth.mockReturnValue({
      user: { id: 'user_123', primaryEmailAddress: 'user@example.com' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={[LOGIN_PATH]}>
        <Routes>
          <Route path={LOGIN_PATH} element={<LoginPage />} />
          <Route path={HOME_PATH} element={<div>module hub</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('module hub')).toBeInTheDocument();
  });

  it('redirects signed-in users from signup to the module hub', () => {
    useAuth.mockReturnValue({
      user: { id: 'user_123', primaryEmailAddress: 'user@example.com' },
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={[SIGNUP_PATH]}>
        <Routes>
          <Route path={SIGNUP_PATH} element={<SignupPage />} />
          <Route path={HOME_PATH} element={<div>module hub</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('module hub')).toBeInTheDocument();
  });
});
