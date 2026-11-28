import type { FinanceQuery } from '@/services/finance/api';
import { roomService } from '@/services/room/roomService';
import { propertyService } from '@/services/property/propertyService';
import { complaintService } from '@/services/complaint/complaintService';
import { financeService } from '@/services/finance/financeService';
import { maintenanceService } from '@/services/maintenance/maintenanceService';
import { tenantService } from '@/services/tenant/tenantService';
import type {
  AccountantDashboardData,
  AdminDashboardData,
  MaintenanceDashboardData,
  TenantDashboardData,
  WardenDashboardData,
} from '@/types/dashboard';
import { COMPLAINT_PRIORITY_LABELS, COMPLAINT_STATUS_LABELS } from '@/types/complaint';
import { formatINR } from '@/utils/format';

export const dashboardService = {
  async getAdminDashboard(filters: FinanceQuery = {}): Promise<AdminDashboardData> {
    const [inventory, properties, tenantSummary] = await Promise.all([
      roomService.getRoomSummary(), propertyService.getProperties(), tenantService.getTenantSummary(),
    ]);
    const summary = await complaintService.getComplaintSummary();
    const overview = await financeService.getFinanceOverview(filters);
    const complaints = await complaintService.getRecentComplaints();
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
    return {
      occupancy: { percent: inventory.occupancyPercent, occupied: inventory.occupiedBeds, vacant: inventory.availableBeds,
        slices: [{name: 'Occupied', value: inventory.occupiedBeds}, {name: 'Available', value: inventory.availableBeds}] },
      occupancyByProperty: properties.map((p) => ({ id: p.id, name: p.name, occupied: p.occupiedBeds, total: p.totalBeds })),
      stats: [
        { id: 'properties', label: 'Properties', value: String(properties.length), tone: 'primary' },
        { id: 'rooms', label: 'Rooms', value: String(inventory.totalRooms), tone: 'info' },
        { id: 'tenants', label: 'Tenants', value: String(tenantSummary.totalTenants), tone: 'primary' },
        { id: 'complaints', label: 'Open complaints', value: String(summary.open + summary.inProgress), hint: `${summary.overdue} overdue`, tone: 'warning' },
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
      recentActivity: overview.recentPayments,
    };
  },

  async getTenantDashboard(userId: string): Promise<TenantDashboardData> {
    if (!userId) throw new Error('Unable to load dashboard.');
    const tenant = await tenantService.getMyTenant();
    const summary = tenant ? await financeService.getTenantFinancialSummary(tenant.id) : null;
    const complaints = await complaintService.getComplaintSummary();
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
          value: String(complaints.open + complaints.inProgress),
          tone: 'info',
          hint: `${complaints.overdue} overdue`,
        },
        {
          id: 'tenant-status',
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

  async getMaintenanceDashboard(staffId?: string): Promise<MaintenanceDashboardData> {
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
    return {
      stats: [
        { id: 'assigned', label: 'Assigned', value: String(summary.assigned), tone: 'primary' },
        { id: 'new', label: 'New tasks', value: String(summary.new), tone: 'info' },
        { id: 'progress', label: 'In progress', value: String(summary.inProgress), tone: 'warning' },
        { id: 'urgent', label: 'Urgent', value: String(summary.urgent), tone: 'danger' },
        { id: 'done', label: 'Completed', value: String(summary.completed), tone: 'success' },
      ],
      recentTasks,
    };
  },

  async getWardenDashboard(): Promise<WardenDashboardData> {
    const [inventory, tenants, summary] = await Promise.all([
      roomService.getRoomSummary(), tenantService.getTenantSummary(), complaintService.getComplaintSummary(),
    ]);
    return {
      occupancy: { percent: inventory.occupancyPercent, occupied: inventory.occupiedBeds, vacant: inventory.availableBeds,
        slices: [{name: 'Occupied', value: inventory.occupiedBeds}, {name: 'Available', value: inventory.availableBeds}] },
      stats: [
        { id: 'tenants', label: 'Tenants', value: String(tenants.totalTenants), tone: 'primary' },
        { id: 'complaints', label: 'Open complaints', value: String(summary.open + summary.inProgress), hint: `${summary.overdue} overdue`, tone: 'warning' },
      ],
    };
  },
};
