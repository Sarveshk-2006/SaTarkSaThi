import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../api/endpoints';

interface DemoModeContextType {
  isBackendConnected: boolean;
  isDemoMode: boolean;
  activeProvider: string;
  isChecking: boolean;
  checkStatus: () => Promise<void>;
  resetDatabase: (seed: boolean) => Promise<void>;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export const DemoModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [activeProvider, setActiveProvider] = useState<string>('rule_based');
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const health = await api.checkHealth();
      setIsBackendConnected(health.status === 'online');
      const settings = await api.getSettings();
      setIsDemoMode(settings.enable_demo_seed);
      setActiveProvider(settings.analysis_provider);
    } catch {
      setIsBackendConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const resetDatabase = useCallback(async (seed: boolean) => {
    await api.resetDatabase(seed);
    setIsDemoMode(seed);
    await checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <DemoModeContext.Provider
      value={{
        isBackendConnected,
        isDemoMode,
        activeProvider,
        isChecking,
        checkStatus,
        resetDatabase,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    return {
      isBackendConnected: false,
      isDemoMode: true,
      activeProvider: 'rule_based',
      isChecking: false,
      checkStatus: async () => {},
      resetDatabase: async () => {},
    };
  }
  return context;
};
