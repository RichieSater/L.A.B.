import { supabase } from '../lib/supabase';
import type { AdvisorId, AdvisorState } from '../types/advisor';
import type { SharedMetricsStore } from '../types/metrics';
import type { QuickLogEntry } from '../types/quick-log';

export class SupabaseStorageService {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

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

  async saveAdvisorState(id: AdvisorId, state: AdvisorState): Promise<void> {
    const { error } = await supabase
      .from('advisor_states')
      .upsert(
        {
          user_id: this.userId,
          advisor_id: id,
          state: state as unknown,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,advisor_id' },
      );

    if (error) {
      throw new Error(`Failed to save advisor state for ${id}: ${error.message}`);
    }
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

  async saveSharedMetrics(metrics: SharedMetricsStore): Promise<void> {
    const { error } = await supabase
      .from('shared_metrics')
      .upsert(
        {
          user_id: this.userId,
          metrics: metrics as unknown,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      throw new Error(`Failed to save shared metrics: ${error.message}`);
    }
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

  async saveQuickLogs(logs: QuickLogEntry[]): Promise<void> {
    const { error } = await supabase
      .from('quick_logs')
      .upsert(
        {
          user_id: this.userId,
          logs: logs as unknown,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      throw new Error(`Failed to save quick logs: ${error.message}`);
    }
  }
}
