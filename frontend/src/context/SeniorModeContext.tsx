import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface SeniorModeContextType {
  seniorMode: boolean;
  setSeniorMode: (on: boolean) => void;
}

const STORAGE_KEY = 'satark_senior_mode';
const SeniorModeContext = createContext<SeniorModeContextType | undefined>(undefined);

function readInitial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const SeniorModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [seniorMode, setSeniorModeState] = useState<boolean>(readInitial);

  useEffect(() => {
    document.documentElement.classList.toggle('senior-mode', seniorMode);
    try {
      localStorage.setItem(STORAGE_KEY, seniorMode ? '1' : '0');
    } catch {
      // Storage may be unavailable (private mode); the class still applies for this session.
    }
  }, [seniorMode]);

  return (
    <SeniorModeContext.Provider value={{ seniorMode, setSeniorMode: setSeniorModeState }}>
      {children}
    </SeniorModeContext.Provider>
  );
};

export const useSeniorMode = (): SeniorModeContextType => {
  // Falls back to "off" outside the provider (e.g. isolated component tests).
  return useContext(SeniorModeContext) ?? { seniorMode: false, setSeniorMode: () => {} };
};
