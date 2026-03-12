import { SignUp } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { AuthPageShell, authComponentAppearance } from '../components/auth/AuthPageShell';

export function SignupPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthPageShell>
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
        forceRedirectUrl="/"
        fallbackRedirectUrl="/"
        appearance={authComponentAppearance}
      />
    </AuthPageShell>
  );
}
