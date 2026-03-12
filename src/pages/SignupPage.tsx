import { SignUp } from '@clerk/react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-100">The L.A.B</h1>
          <p className="text-gray-500 mt-1">Life Advisory Board</p>
        </div>

        <SignUp path="/signup" routing="path" signInUrl="/login" />
      </div>
    </div>
  );
}
