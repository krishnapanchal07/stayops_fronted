import {
  ComplaintPriority,
  ComplaintStatus,
  SLA_HOURS,
  TERMINAL_COMPLAINT_STATUSES,
  type Complaint,
  type ComplaintFilters,
  type ComplaintSummary,
} from '@/types/complaint';

const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  OPEN: [ComplaintStatus.REVIEWED, ComplaintStatus.ASSIGNED, ComplaintStatus.REJECTED, ComplaintStatus.ESCALATED],
  REVIEWED: [ComplaintStatus.ASSIGNED, ComplaintStatus.REJECTED, ComplaintStatus.ESCALATED],
  ASSIGNED: [ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, ComplaintStatus.ESCALATED],
  IN_PROGRESS: [ComplaintStatus.RESOLVED, ComplaintStatus.ESCALATED],
  ESCALATED: [ComplaintStatus.ASSIGNED, ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, ComplaintStatus.REVIEWED],
  RESOLVED: [ComplaintStatus.CLOSED, ComplaintStatus.IN_PROGRESS],
  CLOSED: [],
  REJECTED: [],
};

export function canTransitionComplaintStatus(from: ComplaintStatus, to: ComplaintStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedComplaintTransitions(from: ComplaintStatus): ComplaintStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function calculateComplaintDueDate(createdAt: string, priority: ComplaintPriority): string {
  const created = new Date(createdAt);
  created.setHours(created.getHours() + SLA_HOURS[priority]);
  return created.toISOString();
}

export function isComplaintOverdue(complaint: Pick<Complaint, 'dueAt' | 'status'>, now = new Date()): boolean {
  if (TERMINAL_COMPLAINT_STATUSES.includes(complaint.status)) return false;
  return new Date(complaint.dueAt).getTime() < now.getTime();
}

export function canTenantComment(status: ComplaintStatus): boolean {
  return status !== ComplaintStatus.CLOSED && status !== ComplaintStatus.REJECTED;
}

export function canTenantConfirmResolution(status: ComplaintStatus): boolean {
  return status === ComplaintStatus.RESOLVED;
}

export function canAssignComplaint(status: ComplaintStatus): boolean {
  return (
    status === ComplaintStatus.OPEN ||
    status === ComplaintStatus.REVIEWED ||
    status === ComplaintStatus.ESCALATED ||
    status === ComplaintStatus.ASSIGNED
  );
}

export function canEscalateComplaint(status: ComplaintStatus): boolean {
  return (
    status === ComplaintStatus.OPEN ||
    status === ComplaintStatus.REVIEWED ||
    status === ComplaintStatus.ASSIGNED ||
    status === ComplaintStatus.IN_PROGRESS
  );
}

export function isActiveComplaint(status: ComplaintStatus): boolean {
  return !TERMINAL_COMPLAINT_STATUSES.includes(status);
}

export function emptyComplaintFilters(): ComplaintFilters {
  return {
    query: '',
    propertyId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    category: '',
    priority: '',
    status: '',
    assignedTo: '',
    fromDate: '',
    toDate: '',
    overdueOnly: false,
  };
}

export function filterComplaints(complaints: Complaint[], filters: ComplaintFilters): Complaint[] {
  const query = filters.query.trim().toLowerCase();
  return complaints.filter((complaint) => {
    if (filters.propertyId && complaint.propertyId !== filters.propertyId) return false;
    if (filters.roomId && complaint.roomId !== filters.roomId) return false;
    if (filters.category && complaint.category !== filters.category) return false;
    if (filters.priority && complaint.priority !== filters.priority) return false;
    if (filters.status && complaint.status !== filters.status) return false;
    if (filters.assignedTo && complaint.assignedTo !== filters.assignedTo) return false;
    if (filters.fromDate && complaint.createdAt.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && complaint.createdAt.slice(0, 10) > filters.toDate) return false;
    if (filters.overdueOnly && !isComplaintOverdue(complaint)) return false;
    if (!query) return true;
    return (
      complaint.complaintCode.toLowerCase().includes(query) ||
      complaint.tenantName.toLowerCase().includes(query) ||
      complaint.roomNumber.toLowerCase().includes(query) ||
      complaint.title.toLowerCase().includes(query)
    );
  });
}

export function summarizeComplaints(complaints: Complaint[], now = new Date()): ComplaintSummary {
  const month = now.toISOString().slice(0, 7);
  return {
    total: complaints.length,
    open: complaints.filter((item) => item.status === ComplaintStatus.OPEN || item.status === ComplaintStatus.REVIEWED).length,
    inProgress: complaints.filter(
      (item) =>
        item.status === ComplaintStatus.ASSIGNED ||
        item.status === ComplaintStatus.IN_PROGRESS ||
        item.status === ComplaintStatus.ESCALATED,
    ).length,
    resolved: complaints.filter((item) => item.status === ComplaintStatus.RESOLVED || item.status === ComplaintStatus.CLOSED)
      .length,
    overdue: complaints.filter((item) => isComplaintOverdue(item, now)).length,
    urgent: complaints.filter((item) => item.priority === ComplaintPriority.URGENT && isActiveComplaint(item.status)).length,
    resolvedThisMonth: complaints.filter(
      (item) => item.resolvedAt && item.resolvedAt.startsWith(month),
    ).length,
  };
}
