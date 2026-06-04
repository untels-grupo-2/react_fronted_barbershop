import { createContext } from 'react';

export interface GlobalBusyContextValue {
  isGlobalBusy: boolean;
  runWithGlobalBusy: <T>(task: () => Promise<T>) => Promise<T>;
}

export const GlobalBusyContext = createContext<GlobalBusyContextValue | undefined>(undefined);
