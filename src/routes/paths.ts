import { RoleCode } from '@/constants/roles';

export const PATHS = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  register: '/register',
  findRoom: '/find-room',
  publicPropertyDetail: '/find-room/properties/:propertyId',
  findRoomDetail: '/find-room/:roomId',
  forbidden: '/403',
  notFound: '/404',

  admin: {
    root: '/admin',
    dashboard: '/admin/dashboard',
    properties: '/admin/properties',
    propertyDetail: '/admin/properties/:propertyId',
    buildingDetail: '/admin/properties/:propertyId/buildings/:buildingId',
    rooms: '/admin/rooms',
    roomDetail: '/admin/rooms/:roomId',
    tenants: '/admin/tenants',
    tenantDetail: '/admin/tenants/:tenantId',
    inquiries: '/admin/inquiries',
    inquiryDetail: '/admin/inquiries/:inquiryId',
    staff: '/admin/staff',
    staffDetail: '/admin/staff/:staffId',


    complaints: '/admin/complaints',
    complaintDetail: '/admin/complaints/:complaintId',
    maintenance: '/admin/maintenance',
    maintenanceTaskDetail: '/admin/maintenance/:taskId',


    payments: '/admin/payments',
    paymentDetail: '/admin/payments/:paymentId',
    invoices: '/admin/invoices',
    invoiceDetail: '/admin/invoices/:invoiceId',
    expenses: '/admin/expenses',
    expenseDetail: '/admin/expenses/:expenseId',






    reports: '/admin/finance/reports',


    settings: '/admin/settings',
    profile: '/admin/profile',
  },

  warden: {
    root: '/warden',
    dashboard: '/warden/dashboard',
    tenants: '/warden/tenants',
    tenantDetail: '/warden/tenants/:tenantId',
    inquiries: '/warden/inquiries',
    inquiryDetail: '/warden/inquiries/:inquiryId',
    rooms: '/warden/rooms',
    roomDetail: '/warden/rooms/:roomId',
    complaints: '/warden/complaints',
    complaintDetail: '/warden/complaints/:complaintId',










    profile: '/warden/profile',
  },

  accountant: {
    root: '/accountant',
    dashboard: '/accountant/dashboard',
    payments: '/accountant/payments',
    paymentDetail: '/accountant/payments/:paymentId',
    invoices: '/accountant/invoices',
    invoiceDetail: '/accountant/invoices/:invoiceId',
    expenses: '/accountant/expenses',
    expenseDetail: '/accountant/expenses/:expenseId',
    outstanding: '/accountant/outstanding-dues',
    reports: '/accountant/finance/reports',
    profile: '/accountant/profile',
  },

  security: {
    root: '/security',
    dashboard: '/security/dashboard',




    profile: '/security/profile',
  },

  maintenance: {
    root: '/maintenance',
    dashboard: '/maintenance/dashboard',
    assigned: '/maintenance/assigned-complaints',
    tasks: '/maintenance/tasks',
    taskDetail: '/maintenance/tasks/:taskId',
    history: '/maintenance/history',
    profile: '/maintenance/profile',
  },

  tenant: {
    root: '/tenant',
    dashboard: '/tenant/dashboard',
    myRoom: '/tenant/my-room',
    findRoom: '/tenant/find-room',
    findRoomDetail: '/tenant/find-room/:roomId',
    inquiries: '/tenant/inquiries',
    inquiryDetail: '/tenant/inquiries/:inquiryId',
    payments: '/tenant/payments',
    invoiceDetail: '/tenant/payments/invoices/:invoiceId',
    paymentDetail: '/tenant/payments/receipts/:paymentId',
    complaints: '/tenant/complaints',
    complaintDetail: '/tenant/complaints/:complaintId',








    profile: '/tenant/profile',
    help: '/tenant/help',
  },
} as const;

export function propertyDetailPath(propertyId: string): string {
  return `/admin/properties/${propertyId}`;
}

export function buildingDetailPath(propertyId: string, buildingId: string): string {
  return `/admin/properties/${propertyId}/buildings/${buildingId}`;
}

export function roomDetailPath(roomId: string): string {
  return `/admin/rooms/${roomId}`;
}

export function wardenRoomDetailPath(roomId: string): string {
  return `/warden/rooms/${roomId}`;
}

export function staffDetailPath(staffId: string): string {
  return `/admin/staff/${staffId}`;
}

export function auditLogDetailPath(auditId: string): string {
  return `/admin/audit-logs/${auditId}`;
}

export function tenantDetailPath(tenantId: string): string {
  return `/admin/tenants/${tenantId}`;
}

export function wardenTenantDetailPath(tenantId: string): string {
  return `/warden/tenants/${tenantId}`;
}

export function publicFindRoomDetailPath(roomId: string, bedId?: string): string {
  return bedId ? `/find-room/${roomId}?bed=${bedId}` : `/find-room/${roomId}`;
}

export function publicPropertyDetailPath(propertyId: string): string {
  return `/find-room/properties/${encodeURIComponent(propertyId)}`;
}

export function tenantFindRoomDetailPath(roomId: string, bedId?: string): string {
  return bedId ? `/tenant/find-room/${roomId}?bed=${bedId}` : `/tenant/find-room/${roomId}`;
}

export function inquiryDetailPath(inquiryId: string): string {
  return `/admin/inquiries/${inquiryId}`;
}

export function wardenInquiryDetailPath(inquiryId: string): string {
  return `/warden/inquiries/${inquiryId}`;
}

export function tenantInquiryDetailPath(inquiryId: string): string {
  return `/tenant/inquiries/${inquiryId}`;
}

export function complaintDetailPath(complaintId: string): string {
  return `/admin/complaints/${complaintId}`;
}

export function wardenComplaintDetailPath(complaintId: string): string {
  return `/warden/complaints/${complaintId}`;
}

export function tenantComplaintDetailPath(complaintId: string): string {
  return `/tenant/complaints/${complaintId}`;
}

export function maintenanceTaskDetailPath(taskId: string): string {
  return `/maintenance/tasks/${taskId}`;
}

export function adminMaintenanceTaskDetailPath(taskId: string): string {
  return `/admin/maintenance/${taskId}`;
}

/**
 * Centralized post-login landing paths.
 * Used by Part 2 authentication redirects. Defined now so routing stays the source of truth.
 */
export const ROLE_HOME_PATH: Record<RoleCode, string> = {
  [RoleCode.SUPER_ADMIN]: PATHS.admin.dashboard,
  [RoleCode.OWNER]: PATHS.admin.dashboard,
  [RoleCode.WARDEN]: PATHS.warden.dashboard,
  [RoleCode.ACCOUNTANT]: PATHS.accountant.dashboard,
  [RoleCode.SECURITY]: PATHS.security.dashboard,
  [RoleCode.MAINTENANCE]: PATHS.maintenance.dashboard,
  [RoleCode.TENANT]: PATHS.tenant.dashboard,
};

export function getHomePath(role: RoleCode): string {
  return ROLE_HOME_PATH[role];
}
