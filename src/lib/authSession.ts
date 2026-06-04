import type { AuthSession, AuthUser } from '../types';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USERNAME_KEY = 'authUsername';
const AUTH_SESSION_EVENT = 'auth-session-changed';

const safeAtob = (value: string) => {
  try {
    return atob(value);
  } catch {
    return null;
  }
};

const decodeBase64Url = (value: string) => {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const decoded = safeAtob(normalized);
  if (!decoded) {
    return null;
  }

  try {
    const bytes = Array.from(decoded, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
    return decodeURIComponent(bytes);
  } catch {
    return decoded;
  }
};

const parseJwtPayload = (token: string) => {
  const [, payload] = token.split('.');
  if (!payload) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payload);
  if (!decodedPayload) {
    return null;
  }

  try {
    return JSON.parse(decodedPayload) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const buildInitials = (displayName: string) => {
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'A';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'A';
};

const getClaimString = (payload: Record<string, unknown> | null, keys: string[]) => {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
};

const getStoredUsername = () => {
  const username = localStorage.getItem(USERNAME_KEY);
  return username?.trim() ? username.trim() : undefined;
};

const resolveAuthUser = (token: string | null, fallbackUsername?: string): AuthUser | null => {
  if (!token) {
    return null;
  }

  const payload = parseJwtPayload(token);
  const username = fallbackUsername ?? getClaimString(payload, ['preferred_username', 'unique_name', 'sub', 'username', 'email', 'name']);
  const displayName = getClaimString(payload, ['name', 'given_name', 'preferred_username', 'unique_name', 'username', 'email']) ?? username;

  if (!username && !displayName) {
    return null;
  }

  const resolvedDisplayName = displayName ?? username ?? 'Administrador';
  return { username: username ?? resolvedDisplayName, displayName: resolvedDisplayName, initials: buildInitials(resolvedDisplayName) };
};

const dispatchAuthSessionChange = () => {
  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
};

export const readAuthSession = (): AuthSession => {
  const token = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const storedUsername = getStoredUsername();
  const user = resolveAuthUser(token, storedUsername);

  return { token, refreshToken, user, isAuthenticated: Boolean(token) };
};

export const saveAuthSession = (token: string, refreshToken: string, username?: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  const normalizedUsername = username?.trim() || resolveAuthUser(token)?.username;
  if (normalizedUsername) {
    localStorage.setItem(USERNAME_KEY, normalizedUsername);
  }

  dispatchAuthSessionChange();
};

export const updateAuthTokens = (token: string, refreshToken: string) => {
  saveAuthSession(token, refreshToken, getStoredUsername());
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  dispatchAuthSessionChange();
};

export const subscribeToAuthSession = (listener: () => void) => {
  const handleChange = () => listener();
  window.addEventListener(AUTH_SESSION_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
};
