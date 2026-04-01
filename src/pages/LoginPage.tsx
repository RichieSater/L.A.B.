import { SignIn } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from '../constants/routes';
import { useAuth } from '../auth/auth-context';
import { AuthPageShell } from '../components/auth/AuthPageShell';
import { authComponentAppearance } from '../components/auth/auth-component-appearance';

export function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={HOME_PATH} replace />;
  }

  return (
    <AuthPageShell>
      <SignIn
        path={LOGIN_PATH}
        routing="path"
        signUpUrl={SIGNUP_PATH}
        forceRedirectUrl={HOME_PATH}
        fallbackRedirectUrl={HOME_PATH}
        appearance={authComponentAppearance}
      />
    </AuthPageShell>
  );
}
