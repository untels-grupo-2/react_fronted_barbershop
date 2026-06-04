import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { NotificationProvider } from './components/providers/NotificationProvider.tsx';
import { GlobalBusyProvider } from './components/providers/GlobalBusyProvider.tsx';
import { AuthProvider } from './components/providers/AuthProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <GlobalBusyProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </GlobalBusyProvider>
    </AuthProvider>
  </StrictMode>,
);
