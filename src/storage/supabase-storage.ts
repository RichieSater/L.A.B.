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
    await supabase
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
    await supabase
      .from('shared_metrics')
      .update({
        metrics: metrics as unknown,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', this.userId);
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
    await supabase
      .from('quick_logs')
      .update({
        logs: logs as unknown,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', this.userId);
  }
}
