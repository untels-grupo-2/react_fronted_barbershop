import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { GlobalBusyContext, type GlobalBusyContextValue } from '../../hooks/busyContext';

export const GlobalBusyProvider = ({ children }: { children: ReactNode }) => {
  const [busyCount, setBusyCount] = useState(0);

  const runWithGlobalBusy = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    setBusyCount((prev) => prev + 1);
    try {
      return await task();
    } finally {
      setBusyCount((prev) => Math.max(prev - 1, 0));
    }
  }, []);

  const value = useMemo<GlobalBusyContextValue>(() => ({ isGlobalBusy: busyCount > 0, runWithGlobalBusy }), [busyCount, runWithGlobalBusy]);

  return <GlobalBusyContext.Provider value={value}>{children}</GlobalBusyContext.Provider>;
};
