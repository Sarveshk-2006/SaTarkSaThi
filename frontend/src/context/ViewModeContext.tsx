import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ViewMode = 'web' | 'app';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const STORAGE_KEY = 'satark_view_mode';
const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'app' ? 'app' : 'web';
    } catch {
      return 'web';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, viewMode);
    } catch {
      // Storage unavailable: the mode still applies for this session.
    }
  }, [viewMode]);

  return <ViewModeContext.Provider value={{ viewMode, setViewMode }}>{children}</ViewModeContext.Provider>;
};

export const useViewMode = (): ViewModeContextType => {
  return useContext(ViewModeContext) ?? { viewMode: 'web', setViewMode: () => {} };
};
