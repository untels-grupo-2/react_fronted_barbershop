import { useContext } from 'react';
import { GlobalBusyContext } from './busyContext';

export const useGlobalBusy = () => {
  const context = useContext(GlobalBusyContext);
  if (!context) {
    throw new Error('useGlobalBusy must be used within GlobalBusyProvider');
  }
  return context;
};
