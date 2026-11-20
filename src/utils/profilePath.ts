import { RoleCode } from '@/constants/roles';
import { PATHS } from '@/routes/paths';

export function getProfilePath(role: RoleCode): string {
  switch (role) {
    case RoleCode.TENANT:
      return PATHS.tenant.profile;
    case RoleCode.ACCOUNTANT:
      return PATHS.accountant.profile;
    case RoleCode.SECURITY:
      return PATHS.security.profile;
    case RoleCode.MAINTENANCE:
      return PATHS.maintenance.profile;
    case RoleCode.WARDEN:
      return PATHS.warden.profile;
    default:
      return PATHS.admin.profile;
  }
}
