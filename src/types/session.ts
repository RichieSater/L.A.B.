import type { AdvisorId } from './advisor';

/** The JSON schema the AI must produce at the end of every session */
export interface SessionExport {
  advisor: string;
  date: string;
  summary: string;
  action_items: Array<{
    id: string;
    task: string;
    due: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  completed_items: string[];
  deferred_items: Array<{
    id: string;
    reason: string;
    new_due: string;
  }>;
  metrics: Record<string, number | string>;
  context_for_next_session: string;
  mood: string;
  energy: number;
  session_rating: number;
  narrative_update: string;
  card_preview: string;
  check_in_items?: Array<{
    id: string;
    label: string;
    type: 'number' | 'rating' | 'currency' | 'percentage' | 'binary';
    unit?: string;
    min?: number;
    max?: number;
  }>;
}

export interface SessionRecord {
  id: string;
  advisorId: AdvisorId;
  date: string;
  summary: string;
  mood: string;
  energy: number;
  sessionRating: number;
  actionItemsCreated: number;
  actionItemsCompleted: number;
  narrativeUpdate: string;
  rawExport: SessionExport;
}
