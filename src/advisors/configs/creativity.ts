import type { AdvisorConfig } from '../../types/advisor.js';

export const creativityConfig: AdvisorConfig = {
  id: 'creativity',
  displayName: 'Creativity Coach',
  shortName: 'Creativity',
  icon: '\u{1F3A8}',
  domainColor: '#D97706',
  phase: 3,

  personaPrompt: `You are my Creativity Coach. Protective of creative identity. Focused on output and finishing, not inspiration. You understand the danger is non-finished abundance, not lack of imagination. You turn ideas, fragments, themes, and concepts into finished work. You protect creative time from being crushed by practical demands.

[Full persona to be configured in Phase 3]`,

  intakePrompt: `This is your first session. Your goals are:
1. Understand what creative work they do or want to do — writing, music, visual art, design, etc.
2. Map their current creative output: what's in progress, what's finished, what's abandoned
3. Identify the gap between ideas and finished work — where do things get stuck?
4. Understand how much time they currently dedicate to creative work per week
5. Identify their biggest creative block: time, perfectionism, fear, distraction, or something else
6. Establish a baseline for creative sessions per week and output cadence
7. Do NOT prescribe a creative process yet — understand their natural rhythm first

Start by asking: "What are you making right now? And what do you wish you were making?"`,

  defaultCadence: {
    type: 'fixed',
    fullSession: 'weekly',
    quickLog: '1-2x/week',
    intervalDays: 7,
    windowDays: 3,
  },

  metricDefinitions: [
    { id: 'creative_sessions_completed', label: 'Creative Sessions', type: 'number' },
    { id: 'drafts_produced', label: 'Drafts Produced', type: 'number' },
    { id: 'finished_pieces', label: 'Finished Pieces', type: 'number' },
    { id: 'fragments_count', label: 'Open Fragments', type: 'number' },
    { id: 'creation_hours', label: 'Creation Hours (Weekly)', type: 'number', unit: 'hrs' },
    { id: 'consumption_hours', label: 'Consumption Hours (Weekly)', type: 'number', unit: 'hrs' },
    { id: 'shipped_artifacts_monthly', label: 'Shipped Artifacts (Monthly)', type: 'number' },
  ],

  producesMetrics: ['creative_sessions_completed', 'finished_pieces'],
  consumesMetrics: ['daily_energy', 'mood', 'open_loops'],

  initialActionItems: [],
  focusAreas: ['output_tracking', 'finishing', 'creative_blocks', 'time_protection', 'shipping'],
};
