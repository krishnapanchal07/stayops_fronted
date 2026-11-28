import type { FinanceQuery } from '@/services/finance/api';
import { roomService } from '@/services/room/roomService';
import { propertyService } from '@/services/property/propertyService';
import adminData from '@/mock/dashboards/admin.json';
import maintenanceData from '@/mock/dashboards/maintenance.json';
import securityData from '@/mock/dashboards/security.json';
import wardenData from '@/mock/dashboards/warden.json';
import { complaintService } from '@/services/complaint/complaintService';
import { financeService } from '@/services/finance/financeService';
import { leaveService } from '@/services/leave/leaveService';
import { maintenanceService } from '@/services/maintenance/maintenanceService';
import { noticeService } from '@/services/notice/noticeService';
import { tenantService } from '@/services/tenant/tenantService';
import { visitorService } from '@/services/visitor/visitorService';
import type {
  AccountantDashboardData,
  AdminDashboardData,
  MaintenanceDashboardData,
  SecurityDashboardData,
  TenantDashboardData,
  WardenDashboardData,
} from '@/types/dashboard';
import { COMPLAINT_PRIORITY_LABELS, COMPLAINT_STATUS_LABELS } from '@/types/complaint';
import { LEAVE_TYPE_LABELS } from '@/types/leave';
import { VisitorStatus } from '@/types/visitor';
import { emptyEntryExitFilters } from '@/utils/entryExitRules';
import { formatINR, formatShortDate, formatTime } from '@/utils/format';
import { localToday } from '@/utils/visitorRules';

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

/**
 * Dashboard reads go through this service so Phase 3 can replace mock JSON
 * with Axios → FastAPI without changing pages.
 */
export const dashboardService = {
  async getAdminDashboard(filters: FinanceQuery = {}): Promise<AdminDashboardData> {
    const base = adminData as Omit<
      AdminDashboardData,
      'monthlyRevenue' | 'pendingPayments' | 'recentActivity'
    >;
    const [inventory, properties, tenantSummary] = await Promise.all([
      roomService.getRoomSummary(),
      propertyService.getProperties(),
      tenantService.getTenantSummary(),
    ]);
    base.occupancy = {
      percent: inventory.occupancyPercent,
      occupied: inventory.occupiedBeds,
      vacant: inventory.availableBeds,
      slices: [
        { name: 'Occupied', value: inventory.occupiedBeds },
        { name: 'Available', value: inventory.availableBeds },
      ],
    };
    base.occupancyByProperty = properties.map((p) => ({
      id: p.id,
      name: p.name,
      occupied: p.occupiedBeds,
      total: p.totalBeds,
    }));
    base.stats = base.stats.map((metric) =>
      metric.id === 'properties'
        ? { ...metric, value: String(properties.length), trend: undefined }
        : metric.id === 'rooms'
          ? {
              ...metric,
              value: String(inventory.totalRooms),
              hint: `${inventory.occupancyPercent}% occupied`,
              trend: undefined,
            }
          : metric.id === 'tenants'
            ? { ...metric, value: String(tenantSummary.totalTenants), trend: undefined }
            : metric,
    );
    const overview = await financeService.getFinanceOverview(filters);
    const complaints = await complaintService.getComplaints();
    const visitors = await visitorService.getVisitors();
    const recentComplaints = [...complaints]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 4)
      .map((complaint) => ({
        id: complaint.complaintCode,
        title: complaint.title,
        room: complaint.roomNumber,
        status: COMPLAINT_STATUS_LABELS[complaint.status],
        priority: COMPLAINT_PRIORITY_LABELS[
          complaint.priority
        ] as AdminDashboardData['recentComplaints'][number]['priority'],
      }));
    return wait({
      ...base,
      stats: [
        ...base.stats,
        {
          id: 'revenue',
          label: 'Monthly Revenue',
          value: formatINR(overview.thisMonthCollected),
          hint: `Test Mode applied this month: ${formatINR(overview.thisMonthTestCollected)}`,
          tone: 'success',
        },
      ],
      monthlyRevenue: overview.collectionTrend,
      pendingPayments: overview.pendingInvoiceRows,
      recentComplaints,
      recentActivity: [
        ...visitors
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          .slice(0, 3)
          .map((visitor) => ({
            id: visitor.id,
            title: `Visitor ${visitor.status.toLowerCase().replace('_', ' ')}`,
            detail: `${visitor.visitorName} · ${visitor.tenantName} · Room ${visitor.roomNumber}`,
            time: formatTime(visitor.updatedAt),
          })),
        ...overview.recentPayments,
      ].slice(0, 6),
    });
  },

  async getTenantDashboard(userId: string): Promise<TenantDashboardData> {
    if (!userId) throw new Error('Unable to load dashboard.');
    const tenant = await tenantService.getMyTenant();
    const summary = tenant ? await financeService.getTenantFinancialSummary(tenant.id) : null;
    const room = tenant?.roomNumber
      ? `${tenant.roomNumber} · ${tenant.bedLabel ?? ''}`
      : 'Unassigned';
    return {
      room,
      stats: [
        {
          id: 'room',
          label: 'My Room',
          value: room,
          tone: 'primary',
          hint: tenant?.propertyName ?? 'Onboarding pending',
        },
        {
          id: 'due',
          label: 'Payments',
          value: summary ? formatINR(summary.currentDue) : 'Unavailable',
          tone: 'warning',
          hint: 'Outstanding invoices',
        },
        {
          id: 'complaints',
          label: 'Complaints',
          value: 'Unavailable',
          tone: 'info',
          hint: 'Complaints are not connected yet',
        },
        {
          id: 'notices',
          label: 'Tenant status',
          value: tenant?.status ?? 'Onboarding pending',
          tone: 'primary',
        },
      ],
      rent: {
        total: summary?.currentMonthCharges ?? 0,
        paid: summary?.currentMonthPaid ?? 0,
        testPaid: summary?.currentMonthTestPaid ?? 0,
        due: summary?.currentDue ?? 0,
        dueDate: summary?.nextDueDate ?? 'No open invoice',
      },
      upcomingPayments: (summary?.openInvoices ?? []).map((i) => ({
        id: i.id,
        title: i.invoiceNumber,
        amount: i.outstandingAmount,
        dueDate: i.dueDate,
        status: i.status === 'OVERDUE' ? 'Overdue' : 'Due',
      })),
      recentNotices: [],
    };
  },

  async getAccountantDashboard(filters: FinanceQuery = {}): Promise<AccountantDashboardData> {
    const overview = await financeService.getFinanceOverview(filters);
    return {
      stats: [
        {
          id: 'collection',
          label: 'Actual Collections',
          value: formatINR(overview.collected),
          hint: `Test Mode applied: ${formatINR(overview.testCollected)}`,
          tone: 'success',
        },
        {
          id: 'due',
          label: 'Total Due',
          value: formatINR(overview.outstanding),
          tone: 'warning',
          hint: `${overview.pendingInvoiceRows.length} invoices open`,
        },
        {
          id: 'overdue',
          label: 'Total Overdue',
          value: formatINR(overview.overdue),
          tone: 'danger',
          hint: `${overview.overdueAccounts} accounts`,
        },
        {
          id: 'month',
          label: 'This Month',
          value: formatINR(overview.thisMonthCollected),
          tone: 'primary',
        },
      ],
      collectionTrend: overview.collectionTrend,
      dueToday: overview.dueToday.map((item) => ({
        id: item.id,
        tenant: item.tenant,
        room: item.room,
        amount: item.amount,
      })),
      recentPayments: overview.recentPayments,
      paymentMethods: overview.paymentMethods,
    };
  },

  async getSecurityDashboard(propertyIds?: string[]): Promise<SecurityDashboardData> {
    const base = securityData as SecurityDashboardData;
    const [visitors, visitorSummary, leaveSummary, logs] = await Promise.all([
      visitorService.getVisitors(propertyIds),
      visitorService.getVisitorSummary(undefined, propertyIds),
      leaveService.getLeaveSummary(undefined, propertyIds),
      visitorService.getEntryExitLogs(emptyEntryExitFilters(), propertyIds),
    ]);
    const today = localToday();
    const expected = visitors.filter(
      (visitor) => visitor.visitDate === today && visitor.status === VisitorStatus.APPROVED,
    ).length;
    const recentCheckIns = logs
      .filter((log) => log.kind === 'VISITOR' && log.entryAt)
      .slice(0, 5)
      .map((log) => ({
        id: log.id,
        name: log.personName,
        tenant: `${log.tenantName} · ${log.roomNumber}`,
        time: formatTime(log.entryAt),
        gate: 'Main Gate',
      }));
    const recentCheckOuts = logs
      .filter((log) => log.kind === 'VISITOR' && log.exitAt)
      .slice(0, 5)
      .map((log) => ({
        id: log.id,
        name: log.personName,
        tenant: `${log.tenantName} · ${log.roomNumber}`,
        time: formatTime(log.exitAt),
        gate: 'Main Gate',
      }));
    return wait({
      ...base,
      stats: base.stats.map((metric) => {
        if (metric.id === 'today') {
          return {
            ...metric,
            value: String(visitorSummary.totalToday),
            hint: `${visitorSummary.currentlyInside} still inside`,
          };
        }
        if (metric.id === 'expected') {
          return { ...metric, value: String(expected), hint: 'Approved passes' };
        }
        if (metric.id === 'inside') {
          return {
            ...metric,
            value: String(visitorSummary.currentlyInside),
            hint: 'Live gate count',
          };
        }
        if (metric.id === 'passes') {
          return {
            ...metric,
            value: String(leaveSummary.approved + leaveSummary.currentlyOut),
            hint: `${leaveSummary.currentlyOut} currently out`,
          };
        }
        return metric;
      }),
      recentCheckIns: recentCheckIns.length ? recentCheckIns : base.recentCheckIns,
      recentCheckOuts: recentCheckOuts.length ? recentCheckOuts : base.recentCheckOuts,
    });
  },

  async getMaintenanceDashboard(staffId?: string): Promise<MaintenanceDashboardData> {
    const base = maintenanceData as MaintenanceDashboardData;
    const summary = await maintenanceService.getMaintenanceSummary(staffId);
    const tasks = staffId
      ? await maintenanceService.getMaintenanceTasksByStaff(staffId)
      : await maintenanceService.getMaintenanceTasks();
    const recentTasks = [...tasks]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 5)
      .map((task) => ({
        id: task.taskCode,
        title: task.title,
        room: task.roomNumber,
        priority: COMPLAINT_PRIORITY_LABELS[
          task.priority
        ] as MaintenanceDashboardData['recentTasks'][number]['priority'],
        status: (task.status === 'IN_PROGRESS'
          ? 'In Progress'
          : task.status === 'COMPLETED'
            ? 'Completed'
            : 'New') as MaintenanceDashboardData['recentTasks'][number]['status'],
      }));
    return wait({
      ...base,
      stats: base.stats.map((metric) => {
        if (metric.id === 'assigned') return { ...metric, value: String(summary.assigned) };
        if (metric.id === 'new') return { ...metric, value: String(summary.new) };
        if (metric.id === 'progress') return { ...metric, value: String(summary.inProgress) };
        if (metric.id === 'urgent') return { ...metric, value: String(summary.urgent) };
        if (metric.id === 'done') return { ...metric, value: String(summary.completed) };
        return metric;
      }),
      recentTasks,
    });
  },

  async getWardenDashboard(propertyIds?: string[]): Promise<WardenDashboardData> {
    const base = wardenData as WardenDashboardData;
    const inventory = await roomService.getRoomSummary();
    const tenants = await tenantService.getTenantSummary();
    base.occupancy = {
      percent: inventory.occupancyPercent,
      occupied: inventory.occupiedBeds,
      vacant: inventory.availableBeds,
      slices: [
        { name: 'Occupied', value: inventory.occupiedBeds },
        { name: 'Available', value: inventory.availableBeds },
      ],
    };
    base.stats = base.stats.map((metric) =>
      metric.id === 'occupancy'
        ? {
            ...metric,
            value: `${inventory.occupancyPercent}%`,
            hint: `${inventory.occupiedBeds} / ${inventory.totalBeds} beds`,
          }
        : metric.id === 'tenants'
          ? { ...metric, value: String(tenants.totalTenants), hint: undefined }
          : metric,
    );
    const [summary, visitorSummary, leaveSummary, visitors, leaves, notices] = await Promise.all([
      complaintService.getComplaintSummary(undefined, propertyIds),
      visitorService.getVisitorSummary(undefined, propertyIds),
      leaveService.getLeaveSummary(undefined, propertyIds),
      visitorService.getVisitors(propertyIds),
      leaveService.getLeaveRequests(propertyIds),
      noticeService.getNotices(propertyIds),
    ]);
    const today = localToday();
    return wait({
      ...base,
      stats: base.stats.map((metric) => {
        if (metric.id === 'complaints') {
          return {
            ...metric,
            value: String(summary.open + summary.inProgress),
            hint: summary.urgent > 0 ? `${summary.urgent} urgent` : `${summary.overdue} overdue`,
          };
        }
        if (metric.id === 'leaves') {
          return { ...metric, value: String(leaveSummary.pending), hint: 'Awaiting approval' };
        }
        if (metric.id === 'visitors') {
          return {
            ...metric,
            value: String(visitorSummary.totalToday || visitorSummary.approved),
            hint: 'Today',
          };
        }
        if (metric.id === 'notices') {
          const published = notices.filter((notice) => notice.status === 'PUBLISHED');
          return { ...metric, value: String(published.length), hint: 'Published' };
        }
        return metric;
      }),
      recentNotices: notices
        .filter((notice) => notice.status === 'PUBLISHED')
        .slice(0, 4)
        .map((notice) => ({
          id: notice.id,
          title: notice.title,
          date: formatShortDate(notice.publishDate),
          isNew: notice.priority === 'HIGH' || notice.priority === 'URGENT',
        })),
      expectedVisitors: visitors
        .filter(
          (visitor) =>
            visitor.visitDate >= today &&
            (visitor.status === VisitorStatus.APPROVED || visitor.status === VisitorStatus.PENDING),
        )
        .slice(0, 5)
        .map((visitor) => ({
          id: visitor.id,
          name: visitor.visitorName,
          tenant: `${visitor.tenantName} · ${visitor.roomNumber}`,
          time: formatTime(visitor.expectedEntryTime),
          gate: visitor.propertyName,
        })),
      pendingLeaves: leaves
        .filter((leave) => leave.status === 'PENDING')
        .slice(0, 5)
        .map((leave) => ({
          id: leave.id,
          title: `${LEAVE_TYPE_LABELS[leave.leaveType]} leave`,
          detail: `${leave.tenantName} · ${formatShortDate(leave.startDate)}–${formatShortDate(leave.expectedReturnDate)}`,
          time: 'Pending',
        })),
    });
  },
};
