import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { NotificationContext, type NotificationContextValue } from '../../hooks/notificationContext';

type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationState {
  open: boolean;
  message: string;
  severity: NotificationSeverity;
}

const DEFAULT_NOTIFICATION: NotificationState = { open: false, message: '', severity: 'info' };

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationState>(DEFAULT_NOTIFICATION);

  const show = useCallback((severity: NotificationSeverity, message: string) => {
    setNotification({ open: true, severity, message });
  }, []);

  const handleClose = useCallback(() => {
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  const contextValue = useMemo<NotificationContextValue>(() => ({ showSuccess: (message: string) => show('success', message), showError: (message: string) => show('error', message), showWarning: (message: string) => show('warning', message), showInfo: (message: string) => show('info', message) }), [show]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleClose} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
