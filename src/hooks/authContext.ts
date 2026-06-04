import { createContext } from 'react';
import type { AuthSession } from '../types';

export interface AuthContextValue extends AuthSession {
  saveSession: (token: string, refreshToken: string, username?: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
