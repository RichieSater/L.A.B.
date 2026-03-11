import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './auth/auth-context';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppProvider } from './state/app-context';
import { SchedulingProvider } from './state/scheduling-context';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { SessionPage } from './pages/SessionPage';
import { AdvisorPage } from './pages/AdvisorPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { NotFoundPage } from './pages/NotFoundPage';

function ProtectedLayout() {
  return (
    <AppProvider>
      <SchedulingProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </SchedulingProvider>
    </AppProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
