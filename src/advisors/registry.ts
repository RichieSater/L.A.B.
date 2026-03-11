import type { AdvisorConfig, AdvisorId } from '../types/advisor';
import { prioritizationConfig } from './configs/prioritization';
import { careerConfig } from './configs/career';
import { financialConfig } from './configs/financial';
import { performanceConfig } from './configs/performance';
import { fitnessConfig } from './configs/fitness';
import { creativityConfig } from './configs/creativity';
import { therapistConfig } from './configs/therapist';

export const ADVISOR_CONFIGS: Record<AdvisorId, AdvisorConfig> = {
  prioritization: prioritizationConfig,
  career: careerConfig,
  financial: financialConfig,
  performance: performanceConfig,
  fitness: fitnessConfig,
  creativity: creativityConfig,
  therapist: therapistConfig,
};

export const ALL_ADVISOR_IDS: AdvisorId[] = Object.keys(ADVISOR_CONFIGS) as AdvisorId[];

export const ACTIVE_ADVISOR_IDS: AdvisorId[] = ALL_ADVISOR_IDS.filter(
  id => ADVISOR_CONFIGS[id].phase <= 2,
);

export function getAdvisorConfig(id: AdvisorId): AdvisorConfig {
  return ADVISOR_CONFIGS[id];
}
