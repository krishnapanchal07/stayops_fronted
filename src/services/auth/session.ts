/**
 * Phase 1 uses mock session persistence. Real authentication and JWT/token
 * handling will be implemented in Phase 3.
 *
 * Only a user id is stored. Role and permissions are resolved from mock data
 * on every restore so a deleted or inactive user cannot keep access.
 */
const SESSION_KEY = 'stayops.mock.session';

export interface MockSessionPayload {
  userId: string;
}

function isSessionPayload(value: unknown): value is MockSessionPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    typeof (value as MockSessionPayload).userId === 'string' &&
    (value as MockSessionPayload).userId.length > 0
  );
}

export function readSession(): MockSessionPayload | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isSessionPayload(parsed)) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function writeSession(userId: string): void {
  const payload: MockSessionPayload = { userId };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
