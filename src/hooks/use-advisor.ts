import type { AdvisorId, AdvisorConfig, AdvisorState } from '../types/advisor';
import { useAppState } from '../state/app-context';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { selectAdvisorStatus, type DomainHealth, selectDomainHealth } from '../state/selectors';

export function useAdvisor(advisorId: AdvisorId) {
  const { state, dispatch } = useAppState();

  const config: AdvisorConfig = ADVISOR_CONFIGS[advisorId];
  const advisorState: AdvisorState = state.advisors[advisorId];
  const status = selectAdvisorStatus(state, advisorId);
  const domainHealth = selectDomainHealth(state);

  return {
    config,
    state: advisorState,
    status,
    health: domainHealth[advisorId] as DomainHealth | undefined,
    dispatch,
    appState: state,
  };
}
