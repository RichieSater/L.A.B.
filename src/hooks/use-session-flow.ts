import { useState, useCallback } from 'react';
import type { AdvisorId } from '../types/advisor';
import type { SessionExport } from '../types/session';
import type { ValidationError, ValidationWarning } from '../parser/schema-validator';
import { useAppState } from '../state/app-context';
import { ADVISOR_CONFIGS } from '../advisors/registry';
import { buildPrompt } from '../prompt/prompt-builder';
import { parseSessionExport } from '../parser/session-parser';

export type SessionStep = 'generate' | 'awaiting' | 'import' | 'confirm' | 'complete';

export interface SessionFlowState {
  step: SessionStep;
  advisorId: AdvisorId;
  generatedPrompt: string | null;
  parsedExport: SessionExport | null;
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
}

export function useSessionFlow(advisorId: AdvisorId) {
  const { state, dispatch } = useAppState();

  const [flowState, setFlowState] = useState<SessionFlowState>({
    step: 'generate',
    advisorId,
    generatedPrompt: null,
    parsedExport: null,
    validationErrors: [],
    validationWarnings: [],
  });

  const generatePrompt = useCallback(() => {
    const config = ADVISOR_CONFIGS[advisorId];
    const advisorState = state.advisors[advisorId];
    const prompt = buildPrompt(config, advisorState, state.sharedMetrics, state.quickLogs, state);

    setFlowState(prev => ({
      ...prev,
      step: 'generate',
      generatedPrompt: prompt,
    }));
  }, [advisorId, state]);

  const advanceToAwaiting = useCallback(() => {
    setFlowState(prev => ({ ...prev, step: 'awaiting' }));
  }, []);

  const advanceToImport = useCallback(() => {
    setFlowState(prev => ({ ...prev, step: 'import' }));
  }, []);

  const parseJson = useCallback((jsonString: string) => {
    const result = parseSessionExport(jsonString);

    if (result.valid && result.parsed) {
      setFlowState(prev => ({
        ...prev,
        step: 'confirm',
        parsedExport: result.parsed,
        validationErrors: [],
        validationWarnings: result.warnings,
      }));
    } else {
      setFlowState(prev => ({
        ...prev,
        validationErrors: result.errors,
        validationWarnings: result.warnings,
        parsedExport: null,
      }));
    }
  }, []);

  const confirmImport = useCallback(() => {
    if (!flowState.parsedExport) return;

    dispatch({
      type: 'IMPORT_SESSION',
      payload: {
        advisorId,
        sessionExport: flowState.parsedExport,
      },
    });

    setFlowState(prev => ({ ...prev, step: 'complete' }));
  }, [flowState.parsedExport, advisorId, dispatch]);

  const reset = useCallback(() => {
    setFlowState({
      step: 'generate',
      advisorId,
      generatedPrompt: null,
      parsedExport: null,
      validationErrors: [],
      validationWarnings: [],
    });
  }, [advisorId]);

  return {
    flowState,
    generatePrompt,
    advanceToAwaiting,
    advanceToImport,
    parseJson,
    confirmImport,
    reset,
  };
}
