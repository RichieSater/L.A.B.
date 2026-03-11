import { supabase } from '../lib/supabase';
import type { AdvisorId, AdvisorState } from '../types/advisor';
import type { SharedMetricsStore } from '../types/metrics';
import type { QuickLogEntry } from '../types/quick-log';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Build headers for direct REST calls.
 * Bypasses the supabase-js query builder which hangs on mutations
 * with React 19 + Vite 7 (https://github.com/supabase/supabase-js/issues/1620).
 */
async function restHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
}

async function restPatch(
  table: string,
  body: Record<string, unknown>,
  query: string,
): Promise<void> {
  const headers = await restHeaders();
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PATCH ${table} failed (${res.status}): ${text}`);
  }
}

async function restPost(
  table: string,
  body: Record<string, unknown>,
): Promise<void> {
  const headers = await restHeaders();
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${table} failed (${res.status}): ${text}`);
  }
}

async function restGet(
  table: string,
  query: string,
): Promise<Record<string, unknown> | null> {
  const headers = await restHeaders();
  // Override Prefer for GET to get JSON back
  headers['Prefer'] = '';
  // Request single row
  headers['Accept'] = 'application/vnd.pgrst.object+json';
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { method: 'GET', headers });
  if (res.status === 406 || res.status === 404) return null; // no rows
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${table} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export class SupabaseStorageService {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // --- Reads use the Supabase client (SELECT works fine) ---

  async loadAdvisorState(id: AdvisorId): Promise<AdvisorState | null> {
    const { data, error } = await supabase
      .from('advisor_states')
      .select('state')
      .eq('user_id', this.userId)
      .eq('advisor_id', id)
      .single();

    if (error || !data) return null;
    return (data as Record<string, unknown>).state as AdvisorState;
  }

  async loadSharedMetrics(): Promise<SharedMetricsStore> {
    const { data } = await supabase
      .from('shared_metrics')
      .select('metrics')
      .eq('user_id', this.userId)
      .single();

    if (!data) return {};
    return (data as Record<string, unknown>).metrics as SharedMetricsStore;
  }

  async loadQuickLogs(): Promise<QuickLogEntry[]> {
    const { data } = await supabase
      .from('quick_logs')
      .select('logs')
      .eq('user_id', this.userId)
      .single();

    if (!data) return [];
    return (data as Record<string, unknown>).logs as QuickLogEntry[];
  }

  // --- Writes use direct fetch() to bypass the hanging query builder ---

  async saveAdvisorState(id: AdvisorId, state: AdvisorState): Promise<void> {
    const now = new Date().toISOString();
    const query = `user_id=eq.${encodeURIComponent(this.userId)}&advisor_id=eq.${encodeURIComponent(id)}`;

    // Check if row exists via a quick read
    const existing = await restGet('advisor_states', `select=id&${query}`);

    if (existing) {
      await restPatch(
        'advisor_states',
        { state, updated_at: now },
        query,
      );
    } else {
      await restPost('advisor_states', {
        user_id: this.userId,
        advisor_id: id,
        state,
        updated_at: now,
      });
    }
  }

  async saveSharedMetrics(metrics: SharedMetricsStore): Promise<void> {
    const query = `user_id=eq.${encodeURIComponent(this.userId)}`;
    await restPatch(
      'shared_metrics',
      { metrics, updated_at: new Date().toISOString() },
      query,
    );
  }

  async saveQuickLogs(logs: QuickLogEntry[]): Promise<void> {
    const query = `user_id=eq.${encodeURIComponent(this.userId)}`;
    await restPatch(
      'quick_logs',
      { logs, updated_at: new Date().toISOString() },
      query,
    );
  }
}
