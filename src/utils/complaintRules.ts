import {
  ComplaintStatus,
  TERMINAL_COMPLAINT_STATUSES,
  type Complaint,
  type ComplaintFilters,
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
