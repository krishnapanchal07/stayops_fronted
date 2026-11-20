export const LeaveType = {
  HOME: 'HOME',
  MEDICAL: 'MEDICAL',
  PERSONAL: 'PERSONAL',
  COLLEGE: 'COLLEGE',
  WORK: 'WORK',
  FESTIVAL: 'FESTIVAL',
  OTHER: 'OTHER',
} as const;

export type LeaveType = (typeof LeaveType)[keyof typeof LeaveType];

export const LeaveStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED',
} as const;

export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus];

export const GatePassStatus = {
  ACTIVE: 'ACTIVE',
  USED: 'USED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type GatePassStatus = (typeof GatePassStatus)[keyof typeof GatePassStatus];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  HOME: 'Home',
  MEDICAL: 'Medical',
  PERSONAL: 'Personal',
  COLLEGE: 'College',
  WORK: 'Work',
  FESTIVAL: 'Festival',
  OTHER: 'Other',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
};

export const GATE_PASS_STATUS_LABELS: Record<GatePassStatus, string> = {
  ACTIVE: 'Active',
  USED: 'Used',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

export interface LeaveRequest {
  id: string;
  leaveCode: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  leaveType: LeaveType;
  startDate: string;
  startTime: string;
  expectedReturnDate: string;
  expectedReturnTime: string;
  reason: string;
  status: LeaveStatus;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  gatePassId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GatePass {
  id: string;
  passCode: string;
  leaveId: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string;
  startDateTime: string;
  expectedReturnDateTime: string;
  status: GatePassStatus;
  createdAt: string;
}

export interface LeaveFilters {
  query: string;
  propertyId: string;
  leaveType: LeaveType | '';
  status: LeaveStatus | '';
  fromDate: string;
  toDate: string;
}

export interface LeaveFormValues {
  leaveType: LeaveType | '';
  startDate: string;
  startTime: string;
  expectedReturnDate: string;
  expectedReturnTime: string;
  reason: string;
}

export interface LeaveSummary {
  pending: number;
  approved: number;
  upcoming: number;
  completed: number;
  currentlyOut: number;
}

export interface LeaveActor {
  id: string;
  name: string;
  role: string;
}
