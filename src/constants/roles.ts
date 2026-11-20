/**
 * Role codes used across routing, navigation, and (from Part 2) RBAC.
 * TypeScript enums are avoided because the project uses erasableSyntaxOnly.
 */
export const RoleCode = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  WARDEN: 'WARDEN',
  ACCOUNTANT: 'ACCOUNTANT',
  SECURITY: 'SECURITY',
  MAINTENANCE: 'MAINTENANCE',
  TENANT: 'TENANT',
} as const;

export type RoleCode = (typeof RoleCode)[keyof typeof RoleCode];

export const ROLE_LABELS: Record<RoleCode, string> = {
  [RoleCode.SUPER_ADMIN]: 'Super Admin',
  [RoleCode.OWNER]: 'Property Owner',
  [RoleCode.WARDEN]: 'Warden',
  [RoleCode.ACCOUNTANT]: 'Accountant',
  [RoleCode.SECURITY]: 'Security Staff',
  [RoleCode.MAINTENANCE]: 'Maintenance Staff',
  [RoleCode.TENANT]: 'Student / Tenant',
};
