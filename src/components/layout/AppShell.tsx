import type { ReactNode } from 'react';
import { Header } from './Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen px-3 py-3 text-[color:var(--lab-text)] sm:px-4 sm:py-4">
      <div className="lab-shell mx-auto min-h-[calc(100dvh-1.5rem)] max-w-[1440px]">
        <div className="lab-shell__rim" aria-hidden="true" />
        <Header />
        <main className="lab-main">
          {children}
        </main>
      </div>
    </div>
  );
}
