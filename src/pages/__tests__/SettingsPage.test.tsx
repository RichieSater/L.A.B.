import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAuth } = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

vi.mock('../../auth/auth-context', () => ({
  useAuth,
}));

vi.mock('../../lib/api', () => ({
  apiClient: {
    disconnectGoogleCalendar: vi.fn(),
    resetUserData: vi.fn(),
  },
}));

import { SettingsPage } from '../SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      profile: {
        displayName: 'Ritchie',
        schedulingEnabled: false,
        googleCalendarConnected: false,
        googleCalendarEmail: null,
      },
      updateProfile: vi.fn(),
      refreshBootstrap: vi.fn(),
    });
  });

  it('shows a success banner from the query string and clears the param from the URL', async () => {
    render(
      <MemoryRouter initialEntries={['/settings?google_calendar=connected']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Google Calendar connected successfully.')).toBeInTheDocument();

    await waitFor(() => {
      expect(window.location.search).toBe('');
    });
  });

  it('shows an invalid state error banner from the query string', () => {
    render(
      <MemoryRouter initialEntries={['/settings?google_calendar=invalid_state']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Google Calendar connection could not be verified. Please try again.')).toBeInTheDocument();
  });

  it('shows an expired state error banner from the query string', () => {
    render(
      <MemoryRouter initialEntries={['/settings?google_calendar=expired_state']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Google Calendar connection timed out. Please try again.')).toBeInTheDocument();
  });

  it('shows a generic failure banner from the query string', () => {
    render(
      <MemoryRouter initialEntries={['/settings?google_calendar=failed']}>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Google Calendar connection failed. Please try again.')).toBeInTheDocument();
  });
});
