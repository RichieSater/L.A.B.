/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState } from '../types/app-state';
import type { AppAction } from './actions';
import { appReducer } from './app-reducer';
import { createDefaultAppState } from './init';
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../lib/api';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  saveState: (stateToSave: AppState) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { bootstrapData, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(appReducer, null, createDefaultAppState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initializedRef = useRef(false);
  const dismissSaveError = useCallback(() => setSaveError(null), []);

  const saveState = useCallback(async (stateToSave: AppState) => {
    await apiClient.saveAppState(stateToSave);
  }, []);

  useEffect(() => {
    if (authLoading || !bootstrapData) {
      return;
    }

    dispatch({ type: 'INITIALIZE', payload: bootstrapData.appState });
    initializedRef.current = true;
  }, [authLoading, bootstrapData]);

  const loading = authLoading || !bootstrapData;

  useEffect(() => {
    if (!initializedRef.current || loading) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveError(null);
      apiClient.saveAppState(state).catch(err => {
        console.error('Failed to save app state:', err);
        setSaveError(err instanceof Error ? err.message : 'Failed to save data. Changes may not persist.');
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading your advisory board...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ state, dispatch, saveState }}>
      {saveError && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-900/90 border-b border-red-700 px-4 py-3 text-center">
          <p className="text-red-200 text-sm inline">
            Save failed: {saveError}
          </p>
          <button
            onClick={dismissSaveError}
            className="ml-4 text-red-300 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  );
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return ctx;
}
