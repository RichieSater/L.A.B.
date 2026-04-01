import { Dashboard } from '../components/dashboard/Dashboard';

export function CompassPage() {
  return <Dashboard forcedInitialTab="compass" availableTabs={['compass']} />;
}
