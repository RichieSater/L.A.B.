import type { ReactNode } from 'react';

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-950 px-4 py-10 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-100">The L.A.B</h1>
            <p className="mt-1 text-gray-500">Life Advisory Board</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
