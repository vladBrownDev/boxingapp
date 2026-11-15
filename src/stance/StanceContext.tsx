import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stance } from '../data/punchNotation';

const STANCE_KEY = '@punchfactory/stance';

/** The saved stance, or null if the user hasn't been asked yet. */
export async function loadStance(): Promise<Stance | null> {
  try {
    const saved = await AsyncStorage.getItem(STANCE_KEY);
    return saved === 'orthodox' || saved === 'southpaw' ? saved : null;
  } catch {
    return null;
  }
}

interface StanceContextValue {
  stance: Stance;
  setStance: (stance: Stance) => Promise<void>;
}

const StanceContext = createContext<StanceContextValue | undefined>(undefined);

export function StanceProvider({ children }: { children: React.ReactNode }) {
  const [stance, setStanceState] = useState<Stance>('orthodox');

  useEffect(() => {
    loadStance().then(saved => {
      if (saved) {
        setStanceState(saved);
      }
    });
  }, []);

  const setStance = useCallback(async (next: Stance) => {
    setStanceState(next);
    await AsyncStorage.setItem(STANCE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(() => ({ stance, setStance }), [stance, setStance]);

  return <StanceContext.Provider value={value}>{children}</StanceContext.Provider>;
}

export function useStance(): StanceContextValue {
  const ctx = useContext(StanceContext);
  if (!ctx) {
    throw new Error('useStance must be used within a StanceProvider');
  }
  return ctx;
}
