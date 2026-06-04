import { createContext } from 'react';

export interface NotificationContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);
