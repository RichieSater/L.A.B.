import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EntitledRoute } from './auth/EntitledRoute';
import { AuthProvider } from './auth/auth-context';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import {
  ADMIN_DASHBOARD_PATH,
  ADVISOR_ROUTE,
  ADVISORY_BOARD_PATH,
  GOLDEN_COMPASS_PATH,
  GOLDEN_COMPASS_SESSION_ROUTE,
  HOME_PATH,
  LEGACY_GOLDEN_COMPASS_PATH,
  LEGACY_GOLDEN_COMPASS_SESSION_ROUTE,
  LOGIN_PATH,
  QUANTUM_PLANNER_PATH,
  SESSION_ROUTE,
  SETTINGS_PATH,
  SIGNUP_PATH,
} from './constants/routes';
import {
  ADMIN_DASHBOARD_MINIMUM_TIER,
  ADVISORY_BOARD_MINIMUM_TIER,
  GOLDEN_COMPASS_MINIMUM_TIER,
  QUANTUM_PLANNER_MINIMUM_TIER,
} from './modules/module-entitlements';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })),
);
const ModuleHubPage = lazy(() =>
  import('./pages/ModuleHubPage').then(module => ({ default: module.ModuleHubPage })),
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
const AdvisoryBoardPage = lazy(() =>
  import('./pages/AdvisoryBoardPage').then(module => ({ default: module.AdvisoryBoardPage })),
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })),
);
const CompassPage = lazy(() =>
  import('./pages/CompassPage').then(module => ({ default: module.CompassPage })),
);
const CompassSessionPage = lazy(() =>
  import('./pages/CompassSessionPage').then(module => ({ default: module.CompassSessionPage })),
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
              <Route path={LOGIN_PATH} element={<LoginPage />} />
              <Route path={SIGNUP_PATH} element={<SignupPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
                <Route path={HOME_PATH} element={<ModuleHubPage />} />
                <Route path={QUANTUM_PLANNER_PATH} element={<EntitledRoute requiredTier={QUANTUM_PLANNER_MINIMUM_TIER}><DashboardPage /></EntitledRoute>} />
                <Route path={ADVISORY_BOARD_PATH} element={<EntitledRoute requiredTier={ADVISORY_BOARD_MINIMUM_TIER}><AdvisoryBoardPage /></EntitledRoute>} />
                <Route path={GOLDEN_COMPASS_PATH} element={<EntitledRoute requiredTier={GOLDEN_COMPASS_MINIMUM_TIER}><CompassPage /></EntitledRoute>} />
                <Route path={LEGACY_GOLDEN_COMPASS_PATH} element={<EntitledRoute requiredTier={GOLDEN_COMPASS_MINIMUM_TIER}><CompassPage /></EntitledRoute>} />
                <Route path={GOLDEN_COMPASS_SESSION_ROUTE} element={<EntitledRoute requiredTier={GOLDEN_COMPASS_MINIMUM_TIER}><CompassSessionPage /></EntitledRoute>} />
                <Route path={LEGACY_GOLDEN_COMPASS_SESSION_ROUTE} element={<EntitledRoute requiredTier={GOLDEN_COMPASS_MINIMUM_TIER}><CompassSessionPage /></EntitledRoute>} />
                <Route path={SESSION_ROUTE} element={<EntitledRoute requiredTier={ADVISORY_BOARD_MINIMUM_TIER}><SessionPage /></EntitledRoute>} />
                <Route path={ADVISOR_ROUTE} element={<EntitledRoute requiredTier={ADVISORY_BOARD_MINIMUM_TIER}><AdvisorPage /></EntitledRoute>} />
                <Route path={ADMIN_DASHBOARD_PATH} element={<EntitledRoute requiredTier={ADMIN_DASHBOARD_MINIMUM_TIER}><AdminDashboardPage /></EntitledRoute>} />
                <Route path={SETTINGS_PATH} element={<SettingsPage />} />
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
