import { Dashboard } from '../components/dashboard/Dashboard';

export function AdvisoryBoardPage() {
  return <Dashboard forcedInitialTab="advisors" availableTabs={['advisors']} />;
}
