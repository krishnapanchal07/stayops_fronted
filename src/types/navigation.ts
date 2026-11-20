import type { Permission } from '@/constants/permissions';
import type { RoleCode } from '@/constants/roles';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  requiredPermission?: Permission;
  requiredRoles?: RoleCode[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export type NavigationConfig = Record<RoleCode, NavGroup[]>;
