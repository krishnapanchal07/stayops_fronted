import { GatePassStatus, LeaveStatus, type LeaveFilters, type LeaveRequest, type LeaveSummary } from '@/types/leave';
import type { GatePass } from '@/types/leave';

const TRANSITIONS: Record<LeaveStatus, LeaveStatus[]> = {
  PENDING: [LeaveStatus.APPROVED, LeaveStatus.REJECTED, LeaveStatus.CANCELLED],
  APPROVED: [LeaveStatus.COMPLETED, LeaveStatus.EXPIRED, LeaveStatus.CANCELLED],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  COMPLETED: [],
};

export function canTransitionLeaveStatus(from: LeaveStatus, to: LeaveStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function leaveStart(leave: Pick<LeaveRequest, 'startDate' | 'startTime'>): Date {
  return new Date(`${leave.startDate}T${leave.startTime}:00`);
}

export function leaveReturn(leave: Pick<LeaveRequest, 'expectedReturnDate' | 'expectedReturnTime'>): Date {
  return new Date(`${leave.expectedReturnDate}T${leave.expectedReturnTime}:00`);
}

function windowsOverlap(
  startDate: string,
  startTime: string,
  returnDate: string,
  returnTime: string,
  leave: LeaveRequest,
): boolean {
  const start = new Date(`${startDate}T${startTime}:00`).getTime();
  const end = new Date(`${returnDate}T${returnTime}:00`).getTime();
  return start < leaveReturn(leave).getTime() && end > leaveStart(leave).getTime();
}

export function isApprovedLeaveOverlapping(
  current: LeaveRequest[],
  tenantId: string,
  startDate: string,
  startTime: string,
  returnDate: string,
  returnTime: string,
  ignoreId?: string,
): boolean {
  return current.some(
    (leave) =>
      leave.tenantId === tenantId &&
      leave.id !== ignoreId &&
      leave.status === LeaveStatus.APPROVED &&
      windowsOverlap(startDate, startTime, returnDate, returnTime, leave),
  );
}

export function isPendingLeaveOverlapping(
  current: LeaveRequest[],
  tenantId: string,
  startDate: string,
  startTime: string,
  returnDate: string,
  returnTime: string,
  ignoreId?: string,
): boolean {
  return current.some(
    (leave) =>
      leave.tenantId === tenantId &&
      leave.id !== ignoreId &&
      leave.status === LeaveStatus.PENDING &&
      windowsOverlap(startDate, startTime, returnDate, returnTime, leave),
  );
}

export function isLeaveOverlapping(
  current: LeaveRequest[],
  tenantId: string,
  startDate: string,
  startTime: string,
  returnDate: string,
  returnTime: string,
  ignoreId?: string,
): boolean {
  return (
    isApprovedLeaveOverlapping(current, tenantId, startDate, startTime, returnDate, returnTime, ignoreId) ||
    isPendingLeaveOverlapping(current, tenantId, startDate, startTime, returnDate, returnTime, ignoreId)
  );
}

export function canVerifyGatePass(pass: GatePass): string | null {
  if (pass.status === GatePassStatus.CANCELLED) return 'This gate pass was cancelled.';
  if (pass.status === GatePassStatus.EXPIRED) return 'This gate pass has expired.';
  if (pass.status !== GatePassStatus.ACTIVE && pass.status !== GatePassStatus.USED) {
    return 'This gate pass cannot be verified.';
  }
  return null;
}

export function isReturnOverdue(pass: GatePass, now = new Date()): boolean {
  return pass.status === GatePassStatus.USED && now.getTime() > new Date(pass.expectedReturnDateTime).getTime();
}

export function emptyLeaveFilters(): LeaveFilters {
  return { query: '', propertyId: '', leaveType: '', status: '', fromDate: '', toDate: '' };
}

export function filterLeaveRequests(leaves: LeaveRequest[], filters: LeaveFilters): LeaveRequest[] {
  const query = filters.query.trim().toLowerCase();
  return leaves.filter((leave) => {
    if (filters.propertyId && leave.propertyId !== filters.propertyId) return false;
    if (filters.leaveType && leave.leaveType !== filters.leaveType) return false;
    if (filters.status && leave.status !== filters.status) return false;
    if (filters.fromDate && leave.startDate < filters.fromDate) return false;
    if (filters.toDate && leave.startDate > filters.toDate) return false;
    if (!query) return true;
    return (
      leave.leaveCode.toLowerCase().includes(query) ||
      leave.tenantName.toLowerCase().includes(query) ||
      leave.roomNumber.toLowerCase().includes(query)
    );
  });
}

export function summarizeLeaveRequests(leaves: LeaveRequest[], now = new Date()): LeaveSummary {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return {
    pending: leaves.filter((item) => item.status === LeaveStatus.PENDING).length,
    approved: leaves.filter((item) => item.status === LeaveStatus.APPROVED).length,
    upcoming: leaves.filter((item) => item.status === LeaveStatus.APPROVED && item.startDate >= today).length,
    completed: leaves.filter((item) => item.status === LeaveStatus.COMPLETED).length,
    currentlyOut: 0,
  };
}
