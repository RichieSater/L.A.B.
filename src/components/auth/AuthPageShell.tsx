import type { ReactNode } from 'react';

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="lab-panel relative w-full max-w-6xl overflow-hidden rounded-[2rem] p-5 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="max-w-[32rem]">
            <p className="lab-eyebrow">The LAB Operating System</p>
            <h1 className="lab-display mt-5">Enter the system.</h1>
            <p className="lab-copy mt-5 max-w-[28rem]">
              Golden Compass, Quantum Planner, and Advisory Board all live inside one private LAB surface.
              Sign in to reopen the week, resume Compass work, and route the next meaningful move.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="lab-chip lab-chip--gold">Private workspace</span>
              <span className="lab-chip lab-chip--neutral">Strategy + execution</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-[color:var(--lab-text)]">
                The L.A.B
              </h2>
              <p className="mt-1 text-sm text-[color:var(--lab-text-muted)]">Life Advisory Board</p>
            </div>

            <div className="lab-panel lab-panel--ink rounded-[1.75rem] p-1.5 shadow-[0_32px_80px_rgba(0,0,0,0.42)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
