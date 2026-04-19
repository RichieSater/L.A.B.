import { SignUp } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from '../constants/routes';
import { useAuth } from '../auth/auth-context';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { authComponentAppearance } from '../components/auth/auth-component-appearance';

export function SignupPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="lab-panel rounded-[1.5rem] px-6 py-5 text-lg text-[color:var(--lab-text-muted)]">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={HOME_PATH} replace />;
  }

  return (
    <AuthPageShell>
      <SignUp
        path={SIGNUP_PATH}
        routing="path"
        signInUrl={LOGIN_PATH}
        forceRedirectUrl={HOME_PATH}
        fallbackRedirectUrl={HOME_PATH}
        appearance={authComponentAppearance}
      />
    </AuthPageShell>
  );
}
