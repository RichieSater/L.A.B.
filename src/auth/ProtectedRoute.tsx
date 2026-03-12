import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { BootstrapErrorScreen } from '../components/auth/BootstrapErrorScreen';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, bootstrapError, retryBootstrap, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (bootstrapError) {
    return (
      <BootstrapErrorScreen
        error={bootstrapError}
        onRetry={retryBootstrap}
        onSignOut={signOut}
      />
    );
  }

  return <>{children}</>;
}
