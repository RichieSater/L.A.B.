import { createContext, useContext, useReducer, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AppState } from '../types/app-state';
import type { AppAction } from './actions';
import { appReducer } from './app-reducer';
import { createDefaultAppState, loadAppStateFromSupabase, saveAppStateToSupabase } from './init';
import { SupabaseStorageService } from '../storage/supabase-storage';
import { useAuth } from '../auth/auth-context';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, null, createDefaultAppState);
  const [loading, setLoading] = useState(true);
  const storageRef = useRef<SupabaseStorageService | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const initializedRef = useRef(false);

  // Load state from Supabase when user is available
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const supabaseStorage = new SupabaseStorageService(user.id);
    storageRef.current = supabaseStorage;

    async function init() {
      const loadedState = await loadAppStateFromSupabase(supabaseStorage);
      if (!cancelled) {
        dispatch({ type: 'INITIALIZE', payload: loadedState });
        initializedRef.current = true;
        setLoading(false);
      }
    }

    init().catch(() => {
      // Fallback: if Supabase fails, the default state is already in the reducer
      if (!cancelled) {
        initializedRef.current = true;
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user]);

  // Debounced persistence to Supabase
  useEffect(() => {
    if (!initializedRef.current || loading) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (storageRef.current) {
        saveAppStateToSupabase(storageRef.current, state).catch(err => {
          console.error('Failed to save to Supabase:', err);
        });
      }
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
    <AppContext.Provider value={{ state, dispatch }}>
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
