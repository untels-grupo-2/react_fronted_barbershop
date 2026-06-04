export interface AuthUser {
  username: string;
  displayName: string;
  initials: string;
}

export interface AuthSession {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}
