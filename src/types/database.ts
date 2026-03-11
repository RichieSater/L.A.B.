import type { AdvisorState } from './advisor';
import type { SharedMetricsStore } from './metrics';
import type { QuickLogEntry } from './quick-log';
import type { ScheduledSessionStatus } from './scheduled-session';

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          display_name: string | null;
          scheduling_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          scheduling_enabled?: boolean;
        };
        Update: {
          display_name?: string | null;
          scheduling_enabled?: boolean;
          updated_at?: string;
        };
      };
      advisor_states: {
        Row: {
          id: string;
          user_id: string;
          advisor_id: string;
          state: AdvisorState;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          advisor_id: string;
          state: AdvisorState;
          id?: string;
        };
        Update: {
          state?: AdvisorState;
          updated_at?: string;
        };
      };
      shared_metrics: {
        Row: {
          user_id: string;
          metrics: SharedMetricsStore;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          metrics?: SharedMetricsStore;
        };
        Update: {
          metrics?: SharedMetricsStore;
          updated_at?: string;
        };
      };
      quick_logs: {
        Row: {
          user_id: string;
          logs: QuickLogEntry[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          logs?: QuickLogEntry[];
        };
        Update: {
          logs?: QuickLogEntry[];
          updated_at?: string;
        };
      };
      scheduled_sessions: {
        Row: {
          id: string;
          user_id: string;
          advisor_id: string;
          scheduled_at: string;
          window_minutes: number;
          status: ScheduledSessionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          advisor_id: string;
          scheduled_at: string;
          window_minutes?: number;
          status?: ScheduledSessionStatus;
          id?: string;
        };
        Update: {
          scheduled_at?: string;
          window_minutes?: number;
          status?: ScheduledSessionStatus;
          updated_at?: string;
        };
      };
      user_app_meta: {
        Row: {
          user_id: string;
          schema_version: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          schema_version?: number;
        };
        Update: {
          schema_version?: number;
          updated_at?: string;
        };
      };
    };
  };
}
