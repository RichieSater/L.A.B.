import {
  ADMIN_DASHBOARD_PATH,
  ADVISORY_BOARD_PATH,
  GOLDEN_COMPASS_PATH,
  QUANTUM_PLANNER_PATH,
} from '../constants/routes';
import { hasAccountTierAccess } from '../lib/account-tier';
import type { AccountTier } from '../types/api';
import {
  ADMIN_DASHBOARD_MINIMUM_TIER,
  ADVISORY_BOARD_MINIMUM_TIER,
  COMING_SOON_MODULE_MINIMUM_TIER,
  GOLDEN_COMPASS_MINIMUM_TIER,
  QUANTUM_PLANNER_MINIMUM_TIER,
} from './module-entitlements';

export type LabModuleId =
  | 'admin-dashboard'
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
  minimumTier: AccountTier;
  hideWhenLocked?: boolean;
  lockedSummary?: string;
}

export const LAB_MODULES: LabModuleDefinition[] = [
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    summary: 'Review every LAB account, verify their tier, and promote or demote free versus premium access.',
    availability: 'available',
    route: ADMIN_DASHBOARD_PATH,
    tone: 'slate',
    minimumTier: ADMIN_DASHBOARD_MINIMUM_TIER,
    hideWhenLocked: true,
  },
  {
    id: 'golden-compass',
    label: 'Golden Compass',
    summary: 'Reset the year, resume Compass sessions, and feed long-range direction back into LAB.',
    availability: 'available',
    route: GOLDEN_COMPASS_PATH,
    tone: 'gold',
    minimumTier: GOLDEN_COMPASS_MINIMUM_TIER,
  },
  {
    id: 'advisory-board',
    label: 'Advisory Board',
    summary: 'See which domains need attention and move between advisor-specific actions and follow-through.',
    availability: 'available',
    route: ADVISORY_BOARD_PATH,
    tone: 'sky',
    minimumTier: ADVISORY_BOARD_MINIMUM_TIER,
    lockedSummary: 'Premium unlocks advisor attention, live domain routing, and the rest of the LAB operating system.',
  },
  {
    id: 'quantum-planner',
    label: 'Quantum Planner',
    summary: 'Run the weekly LAB, route open work, and keep strategy visible while you execute.',
    availability: 'available',
    route: QUANTUM_PLANNER_PATH,
    tone: 'emerald',
    minimumTier: QUANTUM_PLANNER_MINIMUM_TIER,
    lockedSummary: 'Premium unlocks the weekly LAB, task routing, and the execution surfaces behind the Compass.',
  },
  {
    id: 'bonfire',
    label: 'Bonfire',
    summary: 'Clear mental noise, burn off static, and make room for cleaner decisions before you build.',
    availability: 'coming-soon',
    route: null,
    tone: 'ember',
    minimumTier: COMING_SOON_MODULE_MINIMUM_TIER,
  },
  {
    id: 'morning-ship',
    label: 'Morning Ship',
    summary: 'Launch the day with an intentional start sequence, direction check, and first commitment.',
    availability: 'coming-soon',
    route: null,
    tone: 'rose',
    minimumTier: COMING_SOON_MODULE_MINIMUM_TIER,
  },
  {
    id: 'scorecard',
    label: 'Scorecard',
    summary: 'Review the signals, numbers, and operating truth that keep the rest of the system honest.',
    availability: 'coming-soon',
    route: null,
    tone: 'slate',
    minimumTier: COMING_SOON_MODULE_MINIMUM_TIER,
  },
];

export function getLabModuleById(moduleId: LabModuleId): LabModuleDefinition {
  const module = LAB_MODULES.find(entry => entry.id === moduleId);

  if (!module) {
    throw new Error(`Unknown LAB module: ${moduleId}`);
  }

  return module;
}

export function canAccessLabModule(
  accountTier: AccountTier | null | undefined,
  module: LabModuleDefinition,
): boolean {
  return (
    module.availability === 'available' &&
    hasAccountTierAccess(accountTier, module.minimumTier)
  );
}

export function getVisibleLabModules(
  accountTier: AccountTier | null | undefined,
): LabModuleDefinition[] {
  return LAB_MODULES.filter(module => (
    !module.hideWhenLocked || canAccessLabModule(accountTier, module)
  ));
}
