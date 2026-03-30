import { Outlet } from 'react-router-dom';
import { AppProvider } from '../../state/app-context';
import { SchedulingProvider } from '../../state/scheduling-context';
import { AppShell } from './AppShell';

export function ProtectedLayout() {
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
