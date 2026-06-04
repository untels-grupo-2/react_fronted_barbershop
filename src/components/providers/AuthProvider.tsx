import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../../hooks/authContext.ts';
import { clearAuthSession, readAuthSession, saveAuthSession, subscribeToAuthSession } from '../../lib/authSession.ts';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState(readAuthSession);

  useEffect(() => {
    return subscribeToAuthSession(() => {
      setSession(readAuthSession());
    });
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      saveSession: (token: string, refreshToken: string, username?: string) => {
        saveAuthSession(token, refreshToken, username);
      },
      logout: () => {
        clearAuthSession();
        window.location.href = '/login';
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
