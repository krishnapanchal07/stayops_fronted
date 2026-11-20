import { Permission } from '@/constants/permissions';
import { RoleCode } from '@/constants/roles';
import { AccountantDashboardPage } from '@/pages/accountant/AccountantDashboardPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { BuildingDetailsPage } from '@/pages/admin/properties/BuildingDetailsPage';
import { PropertyDetailsPage } from '@/pages/admin/properties/PropertyDetailsPage';
import { PropertyListPage } from '@/pages/admin/properties/PropertyListPage';
import { RoomDetailsPage } from '@/pages/admin/rooms/RoomDetailsPage';
import { RoomListPage } from '@/pages/admin/rooms/RoomListPage';
import { InquiryDetailsPage } from '@/pages/admin/inquiries/InquiryDetailsPage';
import { InquiryListPage } from '@/pages/admin/inquiries/InquiryListPage';
import { TenantDetailsPage } from '@/pages/admin/tenants/TenantDetailsPage';
import { TenantListPage } from '@/pages/admin/tenants/TenantListPage';
import { ModulePlaceholderPage } from '@/pages/common/ModulePlaceholderPage';
import { StaffProfilePage } from '@/pages/common/StaffProfilePage';
import { FindRoomDetailsPage } from '@/pages/find-room/FindRoomDetailsPage';
import { FindRoomPage } from '@/pages/find-room/FindRoomPage';
import { MyInquiriesPage } from '@/pages/tenant/MyInquiriesPage';
import { ComplaintDetailsPage } from '@/pages/complaints/ComplaintDetailsPage';
import { ComplaintListPage } from '@/pages/complaints/ComplaintListPage';
import { MaintenanceDashboardPage } from '@/pages/maintenance/MaintenanceDashboardPage';
import { MaintenanceTaskDetailsPage } from '@/pages/maintenance/MaintenanceTaskDetailsPage';
import { MaintenanceTaskListPage } from '@/pages/maintenance/MaintenanceTaskListPage';
import { LeaveDetailsPage } from '@/pages/leave/LeaveDetailsPage';
import { LeaveListPage } from '@/pages/leave/LeaveListPage';
import { EntryExitLogsPage } from '@/pages/security/EntryExitLogsPage';
import { GatePassListPage } from '@/pages/security/GatePassListPage';
import { SecurityDashboardPage } from '@/pages/security/SecurityDashboardPage';
import { VisitorCheckInPage } from '@/pages/security/VisitorCheckInPage';
import { VisitorCheckOutPage } from '@/pages/security/VisitorCheckOutPage';
import { VisitorDetailsPage } from '@/pages/visitors/VisitorDetailsPage';
import { VisitorListPage } from '@/pages/visitors/VisitorListPage';
import { ExpenseDetailsPage } from '@/pages/finance/ExpenseDetailsPage';
import { ExpenseListPage } from '@/pages/finance/ExpenseListPage';
import { InvoiceDetailsPage } from '@/pages/finance/InvoiceDetailsPage';
import { InvoiceListPage } from '@/pages/finance/InvoiceListPage';
import { OutstandingDuesPage } from '@/pages/finance/OutstandingDuesPage';
import { PaymentDetailsPage } from '@/pages/finance/PaymentDetailsPage';
import { PaymentListPage } from '@/pages/finance/PaymentListPage';
import { DocumentDetailsPage } from '@/pages/documents/DocumentDetailsPage';
import { DocumentListPage } from '@/pages/documents/DocumentListPage';
import { HelpPage } from '@/pages/tenant/HelpPage';
import { MyRoomPage } from '@/pages/tenant/MyRoomPage';
import { NoticeDetailsPage } from '@/pages/notices/NoticeDetailsPage';
import { NoticeListPage } from '@/pages/notices/NoticeListPage';
import { SupportDetailsPage } from '@/pages/support/SupportDetailsPage';
import { SupportListPage } from '@/pages/support/SupportListPage';
import { TenantDashboardPage } from '@/pages/tenant/TenantDashboardPage';
import { TenantPaymentsPage } from '@/pages/tenant/TenantPaymentsPage';
import { AuditLogDetailsPage } from '@/pages/admin/audit/AuditLogDetailsPage';
import { AuditLogListPage } from '@/pages/admin/audit/AuditLogListPage';
import { ReportsPage } from '@/pages/admin/reports/ReportsPage';
import { StaffDetailsPage } from '@/pages/admin/staff/StaffDetailsPage';
import { StaffListPage } from '@/pages/admin/staff/StaffListPage';
import { TenantProfilePage } from '@/pages/tenant/TenantProfilePage';
import { WardenDashboardPage } from '@/pages/warden/WardenDashboardPage';
import { PermissionRoute } from '@/routes/PermissionRoute';
import { PATHS } from '@/routes/paths';
import type { ReactElement } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

export interface AppRouteDefinition {
  path: string;
  element: ReactElement;
  roles: RoleCode[];
  permission?: Permission;
}

const placeholder = <ModulePlaceholderPage />;

const ADMIN_ROLES = [RoleCode.SUPER_ADMIN, RoleCode.OWNER];

export const appRouteDefinitions: AppRouteDefinition[] = [
  {
    path: PATHS.admin.root,
    element: <Navigate to={PATHS.admin.dashboard} replace />,
    roles: ADMIN_ROLES,
  },
  {
    path: PATHS.admin.dashboard,
    element: <AdminDashboardPage />,
    roles: ADMIN_ROLES,
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    path: PATHS.admin.properties,
    element: <PropertyListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.PROPERTY_VIEW,
  },
  {
    path: PATHS.admin.propertyDetail,
    element: <PropertyDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.PROPERTY_VIEW,
  },
  {
    path: PATHS.admin.buildingDetail,
    element: <BuildingDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.PROPERTY_VIEW,
  },
  {
    path: PATHS.admin.rooms,
    element: <RoomListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.admin.roomDetail,
    element: <RoomDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.admin.tenants,
    element: <TenantListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.TENANT_VIEW,
  },
  {
    path: PATHS.admin.tenantDetail,
    element: <TenantDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.TENANT_VIEW,
  },
  {
    path: PATHS.admin.inquiries,
    element: <InquiryListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.INQUIRY_VIEW,
  },
  {
    path: PATHS.admin.inquiryDetail,
    element: <InquiryDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.INQUIRY_VIEW,
  },
  {
    path: PATHS.admin.staff,
    element: <StaffListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.STAFF_VIEW,
  },
  {
    path: PATHS.admin.staffDetail,
    element: <StaffDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.STAFF_VIEW,
  },
  {
    path: PATHS.admin.visitors,
    element: <VisitorListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.admin.visitorDetail,
    element: <VisitorDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.admin.complaints,
    element: <ComplaintListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.COMPLAINT_VIEW,
  },
  {
    path: PATHS.admin.complaintDetail,
    element: <ComplaintDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.COMPLAINT_VIEW,
  },
  {
    path: PATHS.admin.maintenance,
    element: <MaintenanceTaskListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.MAINTENANCE_VIEW,
  },
  {
    path: PATHS.admin.maintenanceTaskDetail,
    element: <MaintenanceTaskDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.MAINTENANCE_VIEW,
  },
  {
    path: PATHS.admin.leaveRequests,
    element: <LeaveListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.admin.leaveDetail,
    element: <LeaveDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.admin.payments,
    element: <PaymentListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.admin.paymentDetail,
    element: <PaymentDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.admin.invoices,
    element: <InvoiceListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.INVOICE_VIEW,
  },
  {
    path: PATHS.admin.invoiceDetail,
    element: <InvoiceDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.INVOICE_VIEW,
  },
  {
    path: PATHS.admin.expenses,
    element: <ExpenseListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.EXPENSE_VIEW,
  },
  {
    path: PATHS.admin.expenseDetail,
    element: <ExpenseDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.EXPENSE_VIEW,
  },
  {
    path: PATHS.admin.notices,
    element: <NoticeListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.NOTICE_VIEW,
  },
  {
    path: PATHS.admin.noticeDetail,
    element: <NoticeDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.NOTICE_VIEW,
  },
  {
    path: PATHS.admin.documents,
    element: <DocumentListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.DOCUMENT_VIEW,
  },
  {
    path: PATHS.admin.documentDetail,
    element: <DocumentDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.DOCUMENT_VIEW,
  },
  {
    path: PATHS.admin.support,
    element: <SupportListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.SUPPORT_VIEW,
  },
  {
    path: PATHS.admin.supportDetail,
    element: <SupportDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.SUPPORT_VIEW,
  },
  {
    path: PATHS.admin.reports,
    element: <ReportsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.REPORT_VIEW,
  },
  {
    path: PATHS.admin.auditLogs,
    element: <AuditLogListPage />,
    roles: ADMIN_ROLES,
    permission: Permission.AUDIT_VIEW,
  },
  {
    path: PATHS.admin.auditLogDetail,
    element: <AuditLogDetailsPage />,
    roles: ADMIN_ROLES,
    permission: Permission.AUDIT_VIEW,
  },
  {
    path: PATHS.admin.settings,
    element: placeholder,
    roles: ADMIN_ROLES,
    permission: Permission.SETTINGS_VIEW,
  },
  {
    path: PATHS.admin.profile,
    element: <StaffProfilePage />,
    roles: ADMIN_ROLES,
    permission: Permission.PROFILE_VIEW,
  },

  {
    path: PATHS.warden.root,
    element: <Navigate to={PATHS.warden.dashboard} replace />,
    roles: [RoleCode.WARDEN],
  },
  {
    path: PATHS.warden.dashboard,
    element: <WardenDashboardPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    path: PATHS.warden.tenants,
    element: <TenantListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.TENANT_VIEW,
  },
  {
    path: PATHS.warden.tenantDetail,
    element: <TenantDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.TENANT_VIEW,
  },
  {
    path: PATHS.warden.inquiries,
    element: <InquiryListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.INQUIRY_VIEW,
  },
  {
    path: PATHS.warden.inquiryDetail,
    element: <InquiryDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.INQUIRY_VIEW,
  },
  {
    path: PATHS.warden.rooms,
    element: <RoomListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.warden.roomDetail,
    element: <RoomDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.warden.complaints,
    element: <ComplaintListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.COMPLAINT_VIEW,
  },
  {
    path: PATHS.warden.complaintDetail,
    element: <ComplaintDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.COMPLAINT_VIEW,
  },
  {
    path: PATHS.warden.visitors,
    element: <VisitorListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.warden.visitorDetail,
    element: <VisitorDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.warden.leaveRequests,
    element: <LeaveListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.warden.leaveDetail,
    element: <LeaveDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.warden.notices,
    element: <NoticeListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.NOTICE_VIEW,
  },
  {
    path: PATHS.warden.noticeDetail,
    element: <NoticeDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.NOTICE_VIEW,
  },
  {
    path: PATHS.warden.documents,
    element: <DocumentListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.DOCUMENT_VIEW,
  },
  {
    path: PATHS.warden.documentDetail,
    element: <DocumentDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.DOCUMENT_VIEW,
  },
  {
    path: PATHS.warden.support,
    element: <SupportListPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.SUPPORT_VIEW,
  },
  {
    path: PATHS.warden.supportDetail,
    element: <SupportDetailsPage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.SUPPORT_VIEW,
  },
  {
    path: PATHS.warden.profile,
    element: <StaffProfilePage />,
    roles: [RoleCode.WARDEN],
    permission: Permission.PROFILE_VIEW,
  },

  {
    path: PATHS.accountant.root,
    element: <Navigate to={PATHS.accountant.dashboard} replace />,
    roles: [RoleCode.ACCOUNTANT],
  },
  {
    path: PATHS.accountant.dashboard,
    element: <AccountantDashboardPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    path: PATHS.accountant.payments,
    element: <PaymentListPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.accountant.paymentDetail,
    element: <PaymentDetailsPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.accountant.invoices,
    element: <InvoiceListPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.INVOICE_VIEW,
  },
  {
    path: PATHS.accountant.invoiceDetail,
    element: <InvoiceDetailsPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.INVOICE_VIEW,
  },
  {
    path: PATHS.accountant.expenses,
    element: <ExpenseListPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.EXPENSE_VIEW,
  },
  {
    path: PATHS.accountant.expenseDetail,
    element: <ExpenseDetailsPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.EXPENSE_VIEW,
  },
  {
    path: PATHS.accountant.outstanding,
    element: <OutstandingDuesPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.accountant.reports,
    element: <ReportsPage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.REPORT_VIEW,
  },
  {
    path: PATHS.accountant.profile,
    element: <StaffProfilePage />,
    roles: [RoleCode.ACCOUNTANT],
    permission: Permission.PROFILE_VIEW,
  },

  {
    path: PATHS.security.root,
    element: <Navigate to={PATHS.security.dashboard} replace />,
    roles: [RoleCode.SECURITY],
  },
  {
    path: PATHS.security.dashboard,
    element: <SecurityDashboardPage />,
    roles: [RoleCode.SECURITY],
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    path: PATHS.security.checkIn,
    element: <VisitorCheckInPage />,
    roles: [RoleCode.SECURITY],
    permission: Permission.VISITOR_CHECKIN,
  },
  {
    path: PATHS.security.checkOut,
    element: <VisitorCheckOutPage />,
    roles: [RoleCode.SECURITY],
    permission: Permission.VISITOR_CHECKIN,
  },
  {
    path: PATHS.security.gatePasses,
    element: <GatePassListPage />,
    roles: [RoleCode.SECURITY],
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.security.entryExitLogs,
    element: <EntryExitLogsPage />,
    roles: [RoleCode.SECURITY],
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.security.profile,
    element: <StaffProfilePage />,
    roles: [RoleCode.SECURITY],
    permission: Permission.PROFILE_VIEW,
  },

  {
    path: PATHS.maintenance.root,
    element: <Navigate to={PATHS.maintenance.dashboard} replace />,
    roles: [RoleCode.MAINTENANCE],
  },
  {
    path: PATHS.maintenance.dashboard,
    element: <MaintenanceDashboardPage />,
    roles: [RoleCode.MAINTENANCE],
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    path: PATHS.maintenance.assigned,
    element: <MaintenanceTaskListPage />,
    roles: [RoleCode.MAINTENANCE],
    permission: Permission.MAINTENANCE_VIEW,
  },
  {
    path: PATHS.maintenance.tasks,
    element: <MaintenanceTaskListPage />,
    roles: [RoleCode.MAINTENANCE],
    permission: Permission.MAINTENANCE_VIEW,
  },
  {
    path: PATHS.maintenance.taskDetail,
    element: <MaintenanceTaskDetailsPage />,
    roles: [RoleCode.MAINTENANCE],
    permission: Permission.MAINTENANCE_VIEW,
  },
  {
    path: PATHS.maintenance.history,
    element: <MaintenanceTaskListPage />,
    roles: [RoleCode.MAINTENANCE],
    permission: Permission.MAINTENANCE_VIEW,
  },
  {
    path: PATHS.maintenance.profile,
    element: <StaffProfilePage />,
    roles: [RoleCode.MAINTENANCE],
    permission: Permission.PROFILE_VIEW,
  },

  {
    path: PATHS.tenant.root,
    element: <Navigate to={PATHS.tenant.dashboard} replace />,
    roles: [RoleCode.TENANT],
  },
  {
    path: PATHS.tenant.dashboard,
    element: <TenantDashboardPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.DASHBOARD_VIEW,
  },
  {
    path: PATHS.tenant.myRoom,
    element: <MyRoomPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.tenant.findRoom,
    element: <FindRoomPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.tenant.findRoomDetail,
    element: <FindRoomDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.ROOM_VIEW,
  },
  {
    path: PATHS.tenant.inquiries,
    element: <MyInquiriesPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.INQUIRY_VIEW,
  },
  {
    path: PATHS.tenant.inquiryDetail,
    element: <InquiryDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.INQUIRY_VIEW,
  },
  {
    path: PATHS.tenant.payments,
    element: <TenantPaymentsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.tenant.invoiceDetail,
    element: <InvoiceDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.tenant.paymentDetail,
    element: <PaymentDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.PAYMENT_VIEW,
  },
  {
    path: PATHS.tenant.complaints,
    element: <ComplaintListPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.COMPLAINT_VIEW,
  },
  {
    path: PATHS.tenant.complaintDetail,
    element: <ComplaintDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.COMPLAINT_VIEW,
  },
  {
    path: PATHS.tenant.visitors,
    element: <VisitorListPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.tenant.visitorDetail,
    element: <VisitorDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.VISITOR_VIEW,
  },
  {
    path: PATHS.tenant.leave,
    element: <LeaveListPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.tenant.leaveDetail,
    element: <LeaveDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.LEAVE_VIEW,
  },
  {
    path: PATHS.tenant.notices,
    element: <NoticeListPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.NOTICE_VIEW,
  },
  {
    path: PATHS.tenant.noticeDetail,
    element: <NoticeDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.NOTICE_VIEW,
  },
  {
    path: PATHS.tenant.documents,
    element: <DocumentListPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.DOCUMENT_VIEW,
  },
  {
    path: PATHS.tenant.documentDetail,
    element: <DocumentDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.DOCUMENT_VIEW,
  },
  {
    path: PATHS.tenant.profile,
    element: <TenantProfilePage />,
    roles: [RoleCode.TENANT],
    permission: Permission.PROFILE_VIEW,
  },
  {
    path: PATHS.tenant.help,
    element: <HelpPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.HELP_VIEW,
  },
  {
    path: PATHS.tenant.helpRequests,
    element: <SupportListPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.SUPPORT_VIEW,
  },
  {
    path: PATHS.tenant.helpRequestDetail,
    element: <SupportDetailsPage />,
    roles: [RoleCode.TENANT],
    permission: Permission.SUPPORT_VIEW,
  },
];

export function toGuardedRoute(definition: AppRouteDefinition): RouteObject {
  return {
    path: definition.path,
    element: definition.permission ? (
      <PermissionRoute permission={definition.permission}>{definition.element}</PermissionRoute>
    ) : (
      definition.element
    ),
  };
}

export function routesForRoles(roles: RoleCode[]): RouteObject[] {
  return appRouteDefinitions
    .filter((definition) => definition.roles.every((role) => roles.includes(role)) && definition.roles.length === roles.length)
    .map(toGuardedRoute);
}
