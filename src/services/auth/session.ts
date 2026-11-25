import type { AuthSession } from '@/types/user';

// Tokens stay in memory. The browser manages the HttpOnly refresh cookie.
let accessToken: string | null = null;
let currentSession: AuthSession | null = null;
let listener: ((session: AuthSession | null) => void) | undefined;

export interface TokenResponse extends AuthSession {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export const getAccessToken = () => accessToken;
export const getSession = () => currentSession;
export function subscribeSession(callback: (session: AuthSession | null) => void) {
  listener = callback;
}
export function applySession(payload: TokenResponse): AuthSession {
  accessToken = payload.access_token;
  return updateSession(payload);
}
export function updateSession(payload: AuthSession): AuthSession {
  // Strip token fields before they reach Redux or application components.
  currentSession = { user: payload.user, role: payload.role, permissions: payload.permissions };
  listener?.(currentSession);
  return currentSession;
}
export function clearSession(): void {
  accessToken = null;
  currentSession = null;
  try {
    localStorage.removeItem('stayops.mock.session');
  } catch {
    /* Storage may be disabled. */
  }
  listener?.(null);
}
