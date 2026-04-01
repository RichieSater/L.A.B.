import {
  ADVISORY_BOARD_PATH,
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../constants/routes';

export type LabModuleId =
  | 'golden-compass'
  | 'advisory-board'
  | 'quantum-planner'
  | 'bonfire'
  | 'morning-ship'
  | 'scorecard';

export type LabModuleAvailability = 'available' | 'coming-soon';
export type LabModuleTone = 'gold' | 'sky' | 'emerald' | 'ember' | 'rose' | 'slate';

export interface LabModuleDefinition {
  id: LabModuleId;
  label: string;
  summary: string;
  availability: LabModuleAvailability;
  route: string | null;
  tone: LabModuleTone;
}

export const LAB_MODULES: LabModuleDefinition[] = [
  {
    id: 'golden-compass',
    label: 'Golden Compass',
    summary: 'Reset the year, resume Compass sessions, and feed long-range direction back into LAB.',
    availability: 'available',
    route: GOLDEN_COMPASS_PATH,
    tone: 'gold',
  },
  {
    id: 'advisory-board',
    label: 'Advisory Board',
    summary: 'See which domains need attention and move between advisor-specific actions and follow-through.',
    availability: 'available',
    route: ADVISORY_BOARD_PATH,
    tone: 'sky',
  },
  {
    id: 'quantum-planner',
    label: 'Quantum Planner',
    summary: 'Run the weekly LAB, route open work, and keep strategy visible while you execute.',
    availability: 'available',
    route: QUANTUM_PLANNER_PATH,
    tone: 'emerald',
  },
  {
    id: 'bonfire',
    label: 'Bonfire',
    summary: 'Clear mental noise, burn off static, and make room for cleaner decisions before you build.',
    availability: 'coming-soon',
    route: null,
    tone: 'ember',
  },
  {
    id: 'morning-ship',
    label: 'Morning Ship',
    summary: 'Launch the day with an intentional start sequence, direction check, and first commitment.',
    availability: 'coming-soon',
    route: null,
    tone: 'rose',
  },
  {
    id: 'scorecard',
    label: 'Scorecard',
    summary: 'Review the signals, numbers, and operating truth that keep the rest of the system honest.',
    availability: 'coming-soon',
    route: null,
    tone: 'slate',
  },
];
