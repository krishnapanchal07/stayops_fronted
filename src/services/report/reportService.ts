import { complaintService } from '@/services/complaint/complaintService';
import { financeService } from '@/services/finance/financeService';
import { leaveService } from '@/services/leave/leaveService';
import { maintenanceService } from '@/services/maintenance/maintenanceService';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { tenantService } from '@/services/tenant/tenantService';
import { visitorService } from '@/services/visitor/visitorService';
import { ComplaintStatus } from '@/types/complaint';
import {
  EXPENSE_CATEGORY_LABELS,
  ExpenseStatus,
  InvoiceStatus,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  PaymentStatus,
} from '@/types/finance';
import { LeaveStatus } from '@/types/leave';
import { MaintenanceStatus } from '@/types/maintenance';
import {
  REPORT_TYPE_LABELS,
  ReportType,
  type ReportBreakdownRow,
  type ReportFilters,
  type ReportMetric,
  type ReportResult,
} from '@/types/report';
import { TenantStatus } from '@/types/tenant';
import { VisitorStatus } from '@/types/visitor';
import { formatINR } from '@/utils/format';

function wait<T>(value: T, ms = 160): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function inRange(date: string | null | undefined, fromDate: string, toDate: string): boolean {
  if (!date) return !fromDate && !toDate;
  const day = date.slice(0, 10);
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function metric(id: string, label: string, value: string, tone: ReportMetric['tone'] = 'primary'): ReportMetric {
  return { id, label, value, tone };
}

function result(
  type: ReportType,
  metrics: ReportMetric[],
  columns: { id: string; header: string }[],
  rows: ReportBreakdownRow[],
  trend?: { label: string; value: number }[],
): ReportResult {
  return {
    type,
    title: REPORT_TYPE_LABELS[type],
    generatedAt: new Date().toISOString(),
    metrics,
    columns,
    rows,
    trend,
  };
}

export const reportService = {
  async getReport(filters: ReportFilters): Promise<ReportResult> {
    switch (filters.type) {
      case ReportType.OCCUPANCY:
        return wait(await occupancyReport(filters));
      case ReportType.REVENUE:
        return wait(await revenueReport(filters));
      case ReportType.PAYMENTS:
        return wait(await paymentReport(filters));
      case ReportType.OUTSTANDING:
        return wait(await outstandingReport(filters));
      case ReportType.EXPENSES:
        return wait(await expenseReport(filters));
      case ReportType.TENANTS:
        return wait(await tenantReport(filters));
      case ReportType.COMPLAINTS:
        return wait(await complaintReport(filters));
      case ReportType.VISITORS:
        return wait(await visitorReport(filters));
      case ReportType.LEAVE:
        return wait(await leaveReport(filters));
      case ReportType.MAINTENANCE:
        return wait(await maintenanceReport(filters));
      default:
        throw new Error('Unsupported report type.');
    }
  },
};

async function occupancyReport(filters: ReportFilters): Promise<ReportResult> {
  const [rooms, properties] = await Promise.all([roomService.getRooms(), propertyService.getProperties()]);
  const scopedRooms = rooms.filter((room) => !filters.propertyId || room.propertyId === filters.propertyId);
  const totalRooms = scopedRooms.length;
  const totalBeds = scopedRooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupied = scopedRooms.reduce((sum, room) => sum + room.occupiedBeds, 0);
  const available = totalBeds - occupied;
  const propertiesInScope = properties.filter((property) => !filters.propertyId || property.id === filters.propertyId);

  return result(
    ReportType.OCCUPANCY,
    [
      metric('rooms', 'Total Rooms', String(totalRooms)),
      metric('beds', 'Total Beds', String(totalBeds), 'info'),
      metric('occupied', 'Occupied', String(occupied), 'warning'),
      metric('available', 'Available', String(available), 'success'),
      metric('rate', 'Occupancy %', `${percent(occupied, totalBeds)}%`, 'primary'),
    ],
    [
      { id: 'property', header: 'Property' },
      { id: 'occupied', header: 'Occupied / Capacity' },
      { id: 'rate', header: 'Occupancy' },
    ],
    propertiesInScope.map((property) => {
      const propertyRooms = scopedRooms.filter((room) => room.propertyId === property.id);
      const beds = propertyRooms.reduce((sum, room) => sum + room.capacity, 0);
      const used = propertyRooms.reduce((sum, room) => sum + room.occupiedBeds, 0);
      return {
        id: property.id,
        label: property.name,
        values: {
          property: property.name,
          occupied: `${used} / ${beds}`,
          rate: `${percent(used, beds)}%`,
        },
      };
    }),
  );
}

async function revenueReport(filters: ReportFilters): Promise<ReportResult> {
  const [invoices, payments] = await Promise.all([financeService.getInvoices(), financeService.getPayments()]);
  const scopedInvoices = invoices.filter(
    (invoice) =>
      (!filters.propertyId || invoice.propertyId === filters.propertyId) &&
      inRange(invoice.issueDate, filters.fromDate, filters.toDate) &&
      !invoice.cancelled,
  );
  const scopedPayments = payments.filter(
    (payment) =>
      payment.status === PaymentStatus.SUCCESS &&
      (!filters.propertyId || payment.propertyId === filters.propertyId) &&
      inRange(payment.paymentDate, filters.fromDate, filters.toDate),
  );
  const billed = scopedInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const collected = scopedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = scopedInvoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
  const overdue = scopedInvoices
    .filter((invoice) => invoice.status === InvoiceStatus.OVERDUE)
    .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);

  const months = new Map<string, { billed: number; collected: number }>();
  scopedInvoices.forEach((invoice) => {
    const key = invoice.issueDate.slice(0, 7);
    const current = months.get(key) ?? { billed: 0, collected: 0 };
    current.billed += invoice.total;
    months.set(key, current);
  });
  scopedPayments.forEach((payment) => {
    const key = payment.paymentDate.slice(0, 7);
    const current = months.get(key) ?? { billed: 0, collected: 0 };
    current.collected += payment.amount;
    months.set(key, current);
  });

  const trend = [...months.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value: value.collected }));

  return result(
    ReportType.REVENUE,
    [
      metric('billed', 'Total Invoiced', formatINR(billed)),
      metric('collected', 'Total Collected', formatINR(collected), 'success'),
      metric('outstanding', 'Outstanding', formatINR(outstanding), 'warning'),
      metric('overdue', 'Overdue', formatINR(overdue), 'danger'),
    ],
    [
      { id: 'month', header: 'Month' },
      { id: 'billed', header: 'Invoiced' },
      { id: 'collected', header: 'Collected' },
    ],
    [...months.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([month, value]) => ({
        id: month,
        label: month,
        values: { month, billed: formatINR(value.billed), collected: formatINR(value.collected) },
      })),
    trend,
  );
}

async function paymentReport(filters: ReportFilters): Promise<ReportResult> {
  const payments = await financeService.getPayments();
  const scoped = payments.filter(
    (payment) =>
      (!filters.propertyId || payment.propertyId === filters.propertyId) &&
      inRange(payment.paymentDate, filters.fromDate, filters.toDate) &&
      (!filters.status || payment.status === filters.status),
  );
  const count = (status: PaymentStatus) => scoped.filter((payment) => payment.status === status).length;
  const methodRows = Object.values(PaymentMethod).map((method) => {
    const items = scoped.filter((payment) => payment.method === method && payment.status === PaymentStatus.SUCCESS);
    const amount = items.reduce((sum, payment) => sum + payment.amount, 0);
    return {
      id: method,
      label: PAYMENT_METHOD_LABELS[method],
      values: {
        method: PAYMENT_METHOD_LABELS[method],
        count: items.length,
        amount: formatINR(amount),
      },
    };
  });

  return result(
    ReportType.PAYMENTS,
    [
      metric('total', 'Total Payments', String(scoped.length)),
      metric('success', 'Successful', String(count(PaymentStatus.SUCCESS)), 'success'),
      metric('pending', 'Pending', String(count(PaymentStatus.PENDING)), 'warning'),
      metric('failed', 'Failed', String(count(PaymentStatus.FAILED)), 'danger'),
      metric('refunded', 'Refunded', String(count(PaymentStatus.REFUNDED)), 'info'),
    ],
    [
      { id: 'method', header: 'Method' },
      { id: 'count', header: 'Successful count' },
      { id: 'amount', header: 'Amount' },
    ],
    methodRows,
  );
}

async function outstandingReport(filters: ReportFilters): Promise<ReportResult> {
  const invoices = await financeService.getInvoices();
  const scoped = invoices.filter(
    (invoice) =>
      invoice.outstandingAmount > 0 &&
      !invoice.cancelled &&
      (!filters.propertyId || invoice.propertyId === filters.propertyId) &&
      inRange(invoice.dueDate, filters.fromDate, filters.toDate),
  );
  const overdue = scoped.filter((invoice) => invoice.status === InvoiceStatus.OVERDUE);
  return result(
    ReportType.OUTSTANDING,
    [
      metric('accounts', 'Open invoices', String(scoped.length)),
      metric('amount', 'Outstanding', formatINR(scoped.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0)), 'warning'),
      metric('overdue', 'Overdue invoices', String(overdue.length), 'danger'),
      metric('overdueAmt', 'Overdue amount', formatINR(overdue.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0)), 'danger'),
    ],
    [
      { id: 'tenant', header: 'Tenant' },
      { id: 'property', header: 'Property' },
      { id: 'due', header: 'Due date' },
      { id: 'amount', header: 'Outstanding' },
      { id: 'status', header: 'Status' },
    ],
    scoped.slice(0, 40).map((invoice) => ({
      id: invoice.id,
      label: invoice.tenantName,
      values: {
        tenant: invoice.tenantName,
        property: invoice.propertyName,
        due: invoice.dueDate,
        amount: formatINR(invoice.outstandingAmount),
        status: invoice.status,
      },
    })),
  );
}

async function expenseReport(filters: ReportFilters): Promise<ReportResult> {
  const expenses = await financeService.getExpenses();
  const scoped = expenses.filter(
    (expense) =>
      expense.status !== ExpenseStatus.CANCELLED &&
      (!filters.propertyId || expense.propertyId === filters.propertyId) &&
      inRange(expense.expenseDate, filters.fromDate, filters.toDate) &&
      (!filters.category || expense.category === filters.category),
  );
  const total = scoped.reduce((sum, expense) => sum + expense.amount, 0);
  const rows = Object.entries(EXPENSE_CATEGORY_LABELS).map(([category, label]) => {
    const items = scoped.filter((expense) => expense.category === category);
    const amount = items.reduce((sum, expense) => sum + expense.amount, 0);
    return {
      id: category,
      label,
      values: { category: label, count: items.length, amount: formatINR(amount) },
    };
  });

  return result(
    ReportType.EXPENSES,
    [
      metric('total', 'Total Expenses', formatINR(total), 'warning'),
      metric('count', 'Expense records', String(scoped.length), 'info'),
    ],
    [
      { id: 'category', header: 'Category' },
      { id: 'count', header: 'Count' },
      { id: 'amount', header: 'Amount' },
    ],
    rows,
  );
}

async function tenantReport(filters: ReportFilters): Promise<ReportResult> {
  const [tenants, properties] = await Promise.all([tenantService.getTenants(), propertyService.getProperties()]);
  const scoped = tenants.filter(
    (tenant) =>
      (!filters.propertyId || tenant.propertyId === filters.propertyId) &&
      inRange(tenant.createdAt, filters.fromDate, filters.toDate) &&
      (!filters.status || tenant.status === filters.status),
  );
  const count = (status: TenantStatus) => scoped.filter((tenant) => tenant.status === status).length;
  const propertiesInScope = properties.filter((property) => !filters.propertyId || property.id === filters.propertyId);

  return result(
    ReportType.TENANTS,
    [
      metric('total', 'Total Tenants', String(scoped.length)),
      metric('active', 'Active', String(count(TenantStatus.ACTIVE)), 'success'),
      metric('onboarding', 'Onboarding', String(count(TenantStatus.ONBOARDING)), 'info'),
      metric('notice', 'Notice Period', String(count(TenantStatus.NOTICE_PERIOD)), 'warning'),
      metric('out', 'Checked Out', String(count(TenantStatus.CHECKED_OUT))),
    ],
    [
      { id: 'property', header: 'Property' },
      { id: 'total', header: 'Tenants' },
      { id: 'active', header: 'Active' },
    ],
    propertiesInScope.map((property) => {
      const items = scoped.filter((tenant) => tenant.propertyId === property.id);
      return {
        id: property.id,
        label: property.name,
        values: {
          property: property.name,
          total: items.length,
          active: items.filter((tenant) => tenant.status === TenantStatus.ACTIVE).length,
        },
      };
    }),
  );
}

async function complaintReport(filters: ReportFilters): Promise<ReportResult> {
  const complaints = await complaintService.getComplaints();
  const scoped = complaints.filter(
    (complaint) =>
      (!filters.propertyId || complaint.propertyId === filters.propertyId) &&
      inRange(complaint.createdAt, filters.fromDate, filters.toDate) &&
      (!filters.status || complaint.status === filters.status) &&
      (!filters.category || complaint.category === filters.category),
  );
  const now = Date.now();
  const overdue = scoped.filter((complaint) => {
    if (!complaint.dueAt) return false;
    const open =
      complaint.status !== ComplaintStatus.RESOLVED &&
      complaint.status !== ComplaintStatus.CLOSED &&
      complaint.status !== ComplaintStatus.REJECTED;
    return open && new Date(complaint.dueAt).getTime() < now;
  }).length;

  const byCategory = new Map<string, number>();
  scoped.forEach((complaint) => {
    byCategory.set(complaint.category, (byCategory.get(complaint.category) ?? 0) + 1);
  });

  return result(
    ReportType.COMPLAINTS,
    [
      metric('total', 'Total', String(scoped.length)),
      metric('open', 'Open', String(scoped.filter((item) => item.status === ComplaintStatus.OPEN).length), 'warning'),
      metric(
        'progress',
        'In Progress',
        String(scoped.filter((item) => item.status === ComplaintStatus.IN_PROGRESS).length),
        'info',
      ),
      metric('resolved', 'Resolved', String(scoped.filter((item) => item.status === ComplaintStatus.RESOLVED).length), 'success'),
      metric('closed', 'Closed', String(scoped.filter((item) => item.status === ComplaintStatus.CLOSED).length)),
      metric('overdue', 'Overdue', String(overdue), 'danger'),
      metric('urgent', 'Urgent', String(scoped.filter((item) => item.priority === 'URGENT').length), 'danger'),
    ],
    [
      { id: 'category', header: 'Category' },
      { id: 'count', header: 'Complaints' },
    ],
    [...byCategory.entries()].map(([category, count]) => ({
      id: category,
      label: category,
      values: { category, count },
    })),
  );
}

async function visitorReport(filters: ReportFilters): Promise<ReportResult> {
  const visitors = await visitorService.getVisitors();
  const scoped = visitors.filter(
    (visitor) =>
      (!filters.propertyId || visitor.propertyId === filters.propertyId) &&
      inRange(visitor.visitDate, filters.fromDate, filters.toDate) &&
      (!filters.status || visitor.status === filters.status),
  );
  const count = (status: VisitorStatus) => scoped.filter((visitor) => visitor.status === status).length;
  return result(
    ReportType.VISITORS,
    [
      metric('total', 'Total Visits', String(scoped.length)),
      metric('approved', 'Approved', String(count(VisitorStatus.APPROVED)), 'success'),
      metric('in', 'Checked In', String(count(VisitorStatus.CHECKED_IN)), 'info'),
      metric('out', 'Checked Out', String(count(VisitorStatus.CHECKED_OUT))),
      metric('rejected', 'Rejected', String(count(VisitorStatus.REJECTED)), 'danger'),
      metric('expired', 'Expired', String(count(VisitorStatus.EXPIRED)), 'warning'),
    ],
    [
      { id: 'status', header: 'Status' },
      { id: 'count', header: 'Visits' },
    ],
    Object.values(VisitorStatus).map((status) => ({
      id: status,
      label: status,
      values: { status, count: count(status) },
    })),
  );
}

async function leaveReport(filters: ReportFilters): Promise<ReportResult> {
  const leaves = await leaveService.getLeaveRequests();
  const scoped = leaves.filter(
    (leave) =>
      (!filters.propertyId || leave.propertyId === filters.propertyId) &&
      inRange(leave.startDate, filters.fromDate, filters.toDate) &&
      (!filters.status || leave.status === filters.status),
  );
  const count = (status: LeaveStatus) => scoped.filter((leave) => leave.status === status).length;
  return result(
    ReportType.LEAVE,
    [
      metric('total', 'Total Requests', String(scoped.length)),
      metric('pending', 'Pending', String(count(LeaveStatus.PENDING)), 'warning'),
      metric('approved', 'Approved', String(count(LeaveStatus.APPROVED)), 'success'),
      metric('rejected', 'Rejected', String(count(LeaveStatus.REJECTED)), 'danger'),
      metric('completed', 'Completed', String(count(LeaveStatus.COMPLETED)), 'info'),
    ],
    [
      { id: 'status', header: 'Status' },
      { id: 'count', header: 'Requests' },
    ],
    Object.values(LeaveStatus).map((status) => ({
      id: status,
      label: status,
      values: { status, count: count(status) },
    })),
  );
}

async function maintenanceReport(filters: ReportFilters): Promise<ReportResult> {
  const tasks = await maintenanceService.getMaintenanceTasks();
  const scoped = tasks.filter(
    (task) =>
      (!filters.propertyId || task.propertyId === filters.propertyId) &&
      inRange(task.createdAt, filters.fromDate, filters.toDate) &&
      (!filters.status || task.status === filters.status),
  );
  const count = (status: MaintenanceStatus) => scoped.filter((task) => task.status === status).length;
  const estimated = scoped.reduce((sum, task) => sum + (task.estimatedCost ?? 0), 0);
  const actual = scoped.reduce((sum, task) => sum + (task.actualCost ?? 0), 0);
  return result(
    ReportType.MAINTENANCE,
    [
      metric('total', 'Total Tasks', String(scoped.length)),
      metric('pending', 'Pending', String(count(MaintenanceStatus.PENDING)), 'warning'),
      metric('assigned', 'Assigned', String(count(MaintenanceStatus.ASSIGNED)), 'info'),
      metric('progress', 'In Progress', String(count(MaintenanceStatus.IN_PROGRESS))),
      metric('completed', 'Completed', String(count(MaintenanceStatus.COMPLETED)), 'success'),
      metric('cancelled', 'Cancelled', String(count(MaintenanceStatus.CANCELLED))),
      metric('estimated', 'Estimated Cost', formatINR(estimated)),
      metric('actual', 'Actual Cost', formatINR(actual), 'warning'),
    ],
    [
      { id: 'status', header: 'Status' },
      { id: 'count', header: 'Tasks' },
    ],
    Object.values(MaintenanceStatus).map((status) => ({
      id: status,
      label: status,
      values: { status, count: count(status) },
    })),
  );
}
