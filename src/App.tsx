import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })),
);
const ProtectedRoute = lazy(() =>
  import('./auth/ProtectedRoute').then(module => ({ default: module.ProtectedRoute })),
);
const ProtectedLayout = lazy(() =>
  import('./components/layout/ProtectedLayout').then(module => ({ default: module.ProtectedLayout })),
);
const SessionPage = lazy(() =>
  import('./pages/SessionPage').then(module => ({ default: module.SessionPage })),
);
const AdvisorPage = lazy(() =>
  import('./pages/AdvisorPage').then(module => ({ default: module.AdvisorPage })),
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(module => ({ default: module.LoginPage })),
);
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then(module => ({ default: module.SignupPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-950 px-4 text-sm text-gray-400">
      Loading...
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/session/:advisorId" element={<SessionPage />} />
                <Route path="/advisor/:advisorId" element={<AdvisorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
