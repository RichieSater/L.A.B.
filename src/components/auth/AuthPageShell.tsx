import type { ReactNode } from 'react';

export const authComponentAppearance = {
  elements: {
    rootBox: 'mx-auto w-full [&>div]:w-full',
    cardBox: 'mx-auto w-full',
    card: 'w-full rounded-3xl border border-gray-800 bg-gray-900/95 shadow-2xl',
    headerTitle: 'text-gray-100',
    headerSubtitle: 'text-gray-400',
    socialButtonsBlockButton: 'border border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700',
    socialButtonsBlockButtonText: 'text-gray-100',
    formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-none',
    formFieldLabel: 'text-gray-300',
    formFieldInput: 'border border-gray-700 bg-gray-800 text-gray-100',
    footerActionText: 'text-gray-400',
    footerActionLink: 'text-blue-400 hover:text-blue-300',
    identityPreviewText: 'text-gray-300',
    formResendCodeLink: 'text-blue-400 hover:text-blue-300',
    otpCodeFieldInput: 'border border-gray-700 bg-gray-800 text-gray-100',
    alertText: 'text-red-300',
  },
} as const;

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
