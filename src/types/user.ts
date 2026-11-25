import type { Permission } from '@/constants/permissions';
import type { RoleCode } from '@/constants/roles';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Public user shape used by the UI and Redux.
 * Passwords and tokens never appear here. Authentication comes from the API.
 *
 * propertyIds prepares Phase 3 data scoping (a tenant only sees their own records).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  roleId: RoleCode;
  role: RoleCode;
  roleLabel: string;
  initials: string;
  status: UserStatus;
  avatar?: string;
  propertyIds?: string[];
}

export interface AuthSession {
  user: User;
  role: RoleCode;
  permissions: Permission[];
}

export interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  roleId: RoleCode;
  status: UserStatus;
  avatar?: string;
  propertyIds?: string[];
}

export interface MockCredentialRecord {
  userId: string;
  email: string;
  password: string;
}

export interface MockRoleRecord {
  id: RoleCode;
  name: string;
  permissions: Permission[];
}

export interface MockPermissionRecord {
  id: Permission;
  name: string;
}
