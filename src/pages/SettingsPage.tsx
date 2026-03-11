import { useState } from 'react';
import { useAuth } from '../auth/auth-context';

export function SettingsPage() {
  const { profile, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveName() {
    setSaving(true);
    await updateProfile({ displayName });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleToggleScheduling() {
    await updateProfile({ schedulingEnabled: !profile?.schedulingEnabled });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-100">Settings</h2>

      {/* Profile section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Profile</h3>

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-1">
              Display Name
            </label>
            <div className="flex gap-3">
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || displayName === profile?.displayName}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Session Scheduling</h3>
            <p className="text-sm text-gray-400 mt-1">
              Schedule sessions at specific times. Sessions unlock at the scheduled time and stay open for 1 hour.
            </p>
          </div>
          <button
            onClick={handleToggleScheduling}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              profile?.schedulingEnabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                profile?.schedulingEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
