import { Permission } from '@/constants/permissions';
import { RoleCode } from '@/constants/roles';
import { PATHS } from '@/routes/paths';
import type { NavGroup, NavigationConfig } from '@/types/navigation';
import {
  BarChart3,
  BedDouble,
  Building2,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileText,
  HelpCircle,
  History,
  Inbox,
  LayoutDashboard,
  MessageSquareWarning,
  Receipt,
  Search,
  Settings,
  Shield,
  UserCircle,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

const adminGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.admin.dashboard,
        icon: LayoutDashboard,
        requiredPermission: Permission.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'management',
    label: 'Management',
    items: [
      {
        id: 'properties',
        label: 'Properties',
        path: PATHS.admin.properties,
        icon: Building2,
        requiredPermission: Permission.PROPERTY_VIEW,
      },
      {
        id: 'rooms',
        label: 'Rooms',
        path: PATHS.admin.rooms,
        icon: DoorOpen,
        requiredPermission: Permission.ROOM_VIEW,
      },
      {
        id: 'tenants',
        label: 'Tenants',
        path: PATHS.admin.tenants,
        icon: Users,
        requiredPermission: Permission.TENANT_VIEW,
      },
      {
        id: 'inquiries',
        label: 'Inquiries',
        path: PATHS.admin.inquiries,
        icon: Inbox,
        requiredPermission: Permission.INQUIRY_VIEW,
      },
      {
        id: 'staff',
        label: 'Staff',
        path: PATHS.admin.staff,
        icon: Shield,
        requiredPermission: Permission.STAFF_VIEW,
      },
      {
        id: 'complaints',
        label: 'Complaints',
        path: PATHS.admin.complaints,
        icon: MessageSquareWarning,
        requiredPermission: Permission.COMPLAINT_VIEW,
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        path: PATHS.admin.maintenance,
        icon: Wrench,
        requiredPermission: Permission.MAINTENANCE_VIEW,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        id: 'payments',
        label: 'Payments',
        path: PATHS.admin.payments,
        icon: CreditCard,
        requiredPermission: Permission.PAYMENT_VIEW,
      },
      {
        id: 'invoices',
        label: 'Invoices',
        path: PATHS.admin.invoices,
        icon: Receipt,
        requiredPermission: Permission.INVOICE_VIEW,
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: PATHS.admin.expenses,
        icon: Wallet,
        requiredPermission: Permission.EXPENSE_VIEW,
      },
      {
        id: 'reports',
        label: 'Finance Reports',
        path: PATHS.admin.reports,
        icon: BarChart3,
        requiredPermission: Permission.FINANCE_REPORT_VIEW,
      },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        path: PATHS.admin.settings,
        icon: Settings,
        requiredPermission: Permission.SETTINGS_VIEW,
      },
    ],
  },
];

const tenantGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.tenant.dashboard,
        icon: LayoutDashboard,
        requiredPermission: Permission.DASHBOARD_VIEW,
      },
      {
        id: 'my-room',
        label: 'My Room',
        path: PATHS.tenant.myRoom,
        icon: BedDouble,
        requiredPermission: Permission.ROOM_VIEW,
      },
      {
        id: 'find-room',
        label: 'Find Room',
        path: PATHS.tenant.findRoom,
        icon: Search,
        requiredPermission: Permission.ROOM_VIEW,
      },
      {
        id: 'inquiries',
        label: 'My Inquiries',
        path: PATHS.tenant.inquiries,
        icon: ClipboardList,
        requiredPermission: Permission.INQUIRY_VIEW,
      },
    ],
  },
  {
    id: 'services',
    label: 'Services',
    items: [
      {
        id: 'payments',
        label: 'Payments',
        path: PATHS.tenant.payments,
        icon: CreditCard,
        requiredPermission: Permission.PAYMENT_VIEW,
      },
      {
        id: 'complaints',
        label: 'Complaints',
        path: PATHS.tenant.complaints,
        icon: MessageSquareWarning,
        requiredPermission: Permission.COMPLAINT_VIEW,
      },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        path: PATHS.tenant.profile,
        icon: UserCircle,
        requiredPermission: Permission.PROFILE_VIEW,
      },
      {
        id: 'help',
        label: 'Help',
        path: PATHS.tenant.help,
        icon: HelpCircle,
        requiredPermission: Permission.HELP_VIEW,
      },
    ],
  },
];

const accountantGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.accountant.dashboard,
        icon: LayoutDashboard,
        requiredPermission: Permission.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        id: 'payments',
        label: 'Payments',
        path: PATHS.accountant.payments,
        icon: CreditCard,
        requiredPermission: Permission.PAYMENT_VIEW,
      },
      {
        id: 'invoices',
        label: 'Invoices',
        path: PATHS.accountant.invoices,
        icon: Receipt,
        requiredPermission: Permission.INVOICE_VIEW,
      },
      {
        id: 'expenses',
        label: 'Expenses',
        path: PATHS.accountant.expenses,
        icon: Wallet,
        requiredPermission: Permission.EXPENSE_VIEW,
      },
      {
        id: 'outstanding',
        label: 'Outstanding Dues',
        path: PATHS.accountant.outstanding,
        icon: FileText,
        requiredPermission: Permission.PAYMENT_VIEW,
      },
      {
        id: 'reports',
        label: 'Finance Reports',
        path: PATHS.accountant.reports,
        icon: BarChart3,
        requiredPermission: Permission.FINANCE_REPORT_VIEW,
      },
    ],
  },
];

const securityGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.security.dashboard,
        icon: LayoutDashboard,
        requiredPermission: Permission.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'gate',
    label: 'Gate Operations',
    items: [
    ],
  },
];

const maintenanceGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.maintenance.dashboard,
        icon: LayoutDashboard,
        requiredPermission: Permission.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'work',
    label: 'Work Orders',
    items: [
      {
        id: 'assigned',
        label: 'Assigned Complaints',
        path: PATHS.maintenance.assigned,
        icon: MessageSquareWarning,
        requiredPermission: Permission.MAINTENANCE_VIEW,
      },
      {
        id: 'tasks',
        label: 'Tasks',
        path: PATHS.maintenance.tasks,
        icon: ClipboardList,
        requiredPermission: Permission.MAINTENANCE_VIEW,
      },
      {
        id: 'history',
        label: 'Maintenance History',
        path: PATHS.maintenance.history,
        icon: History,
        requiredPermission: Permission.MAINTENANCE_VIEW,
      },
    ],
  },
];

const wardenGroups: NavGroup[] = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: PATHS.warden.dashboard,
        icon: LayoutDashboard,
        requiredPermission: Permission.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'tenants',
        label: 'Tenants',
        path: PATHS.warden.tenants,
        icon: Users,
        requiredPermission: Permission.TENANT_VIEW,
      },
      {
        id: 'inquiries',
        label: 'Inquiries',
        path: PATHS.warden.inquiries,
        icon: Inbox,
        requiredPermission: Permission.INQUIRY_VIEW,
      },
      {
        id: 'rooms',
        label: 'Rooms',
        path: PATHS.warden.rooms,
        icon: DoorOpen,
        requiredPermission: Permission.ROOM_VIEW,
      },
      {
        id: 'complaints',
        label: 'Complaints',
        path: PATHS.warden.complaints,
        icon: MessageSquareWarning,
        requiredPermission: Permission.COMPLAINT_VIEW,
      },
    ],
  },
];

/**
 * Role-specific sidebar menus. Items are also filtered by requiredPermission
 * so hiding a link matches the same RBAC model as route guards.
 */
export const navigationConfig: NavigationConfig = {
  [RoleCode.SUPER_ADMIN]: adminGroups,
  [RoleCode.OWNER]: adminGroups,
  [RoleCode.WARDEN]: wardenGroups,
  [RoleCode.ACCOUNTANT]: accountantGroups,
  [RoleCode.SECURITY]: securityGroups,
  [RoleCode.MAINTENANCE]: maintenanceGroups,
  [RoleCode.TENANT]: tenantGroups,
};

export function getNavigationForRole(role: RoleCode, permissions?: Permission[]): NavGroup[] {
  const groups = navigationConfig[role];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.requiredRoles && !item.requiredRoles.includes(role)) {
          return false;
        }
        if (!permissions || !item.requiredPermission) {
          return true;
        }
        return permissions.includes(item.requiredPermission);
      }),
    }))
    .filter((group) => group.items.length > 0);
}
