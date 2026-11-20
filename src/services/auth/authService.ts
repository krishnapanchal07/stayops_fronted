import { AUTH_ERRORS } from '@/constants/authErrors';
import { ROLE_LABELS, RoleCode } from '@/constants/roles';
import credentialsData from '@/mock/credentials.json';
import permissionsData from '@/mock/permissions.json';
import rolesData from '@/mock/roles.json';
import usersData from '@/mock/users.json';
import { clearSession, readSession, writeSession } from '@/services/auth/session';
import type {
  AuthSession,
  MockCredentialRecord,
  MockRoleRecord,
  MockUserRecord,
  User,
} from '@/types/user';
import { getInitials } from '@/utils/initials';

const users = structuredClone(usersData) as MockUserRecord[];
const credentials = structuredClone(credentialsData) as MockCredentialRecord[];
const roles = rolesData as MockRoleRecord[];

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function isRoleCode(value: string): value is RoleCode {
  return Object.values(RoleCode).includes(value as RoleCode);
}

function toUser(record: MockUserRecord): User {
  if (!isRoleCode(record.roleId)) {
    throw new AuthError(AUTH_ERRORS.unexpected);
  }

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    roleId: record.roleId,
    role: record.roleId,
    roleLabel: ROLE_LABELS[record.roleId],
    initials: getInitials(record.name),
    status: record.status,
    avatar: record.avatar,
    propertyIds: record.propertyIds,
  };
}

function findUserById(userId: string): MockUserRecord | undefined {
  return users.find((user) => user.id === userId);
}

function buildSession(record: MockUserRecord): AuthSession {
  const role = roles.find((item) => item.id === record.roleId);
  if (!role || !isRoleCode(record.roleId)) {
    throw new AuthError(AUTH_ERRORS.unexpected);
  }

  return {
    user: toUser(record),
    role: record.roleId,
    permissions: role.permissions,
  };
}

/**
 * Mock authentication. Phase 3 will swap this implementation for Axios + FastAPI.
 * Pages and hooks must keep calling these methods and never import mock JSON.
 */
export const authService = {
  async login(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = credentials.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (!credential || credential.password !== password) {
      throw new AuthError(AUTH_ERRORS.invalidCredentials);
    }

    const record = findUserById(credential.userId);
    if (!record) {
      throw new AuthError(AUTH_ERRORS.invalidCredentials);
    }

    if (record.status !== 'ACTIVE') {
      throw new AuthError(AUTH_ERRORS.inactiveAccount);
    }

    const session = buildSession(record);
    writeSession(record.id);
    return session;
  },

  async logout(): Promise<void> {
    clearSession();
  },

  restoreSession(): AuthSession | null {
    const payload = readSession();
    if (!payload) return null;

    const record = findUserById(payload.userId);
    if (!record || record.status !== 'ACTIVE') {
      clearSession();
      return null;
    }

    try {
      return buildSession(record);
    } catch {
      clearSession();
      return null;
    }
  },

  getCurrentUser(): User | null {
    return this.restoreSession()?.user ?? null;
  },

  isAuthenticated(): boolean {
    return this.restoreSession() !== null;
  },

  getUserPermissions() {
    return this.restoreSession()?.permissions ?? [];
  },

  getPermissionCatalog() {
    return permissionsData;
  },

  /**
   * Phase 2 mock password change. Phase 3 replaces this with POST /auth/change-password.
   * Password values are never returned to the UI.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const credential = credentials.find((item) => item.userId === userId);
    if (!credential || credential.password !== currentPassword) {
      throw new AuthError('Current password is incorrect.');
    }
    if (newPassword.length < 8) {
      throw new AuthError('Use at least 8 characters for the new password.');
    }
    credential.password = newPassword;
  },

  /**
   * Phase 2 mock account update. Phase 3 replaces this with PATCH /auth/me.
   * Email and role stay read-only because they are used for identity and RBAC.
   */
  async updateMyProfile(userId: string, patch: { name: string; avatar?: string }): Promise<AuthSession> {
    const record = findUserById(userId);
    if (!record) {
      throw new AuthError('Profile information unavailable.');
    }
    const name = patch.name.trim();
    if (!name) {
      throw new AuthError('Name is required.');
    }
    record.name = name;
    record.avatar = patch.avatar || undefined;
    return buildSession(record);
  },
};
