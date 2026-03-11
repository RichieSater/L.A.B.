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
    const now = new Date().toISOString();

    // Try UPDATE first
    const { data, error: updateError } = await supabase
      .from('advisor_states')
      .update({ state: state as unknown, updated_at: now })
      .eq('user_id', this.userId)
      .eq('advisor_id', id)
      .select('id');

    if (updateError) {
      throw new Error(`Failed to update advisor state for ${id}: ${updateError.message}`);
    }

    // If no row existed, INSERT
    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from('advisor_states')
        .insert({
          user_id: this.userId,
          advisor_id: id,
          state: state as unknown,
          updated_at: now,
        });

      if (insertError) {
        throw new Error(`Failed to insert advisor state for ${id}: ${insertError.message}`);
      }
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
      .update({
        metrics: metrics as unknown,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', this.userId);

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
      .update({
        logs: logs as unknown,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', this.userId);

    if (error) {
      throw new Error(`Failed to save quick logs: ${error.message}`);
    }
  }
}
