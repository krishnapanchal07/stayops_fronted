export const VisitorStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
} as const;

export type VisitorStatus = (typeof VisitorStatus)[keyof typeof VisitorStatus];

export const VisitorRelationship = {
  PARENT: 'PARENT',
  SIBLING: 'SIBLING',
  FRIEND: 'FRIEND',
  RELATIVE: 'RELATIVE',
  DELIVERY: 'DELIVERY',
  OTHER: 'OTHER',
} as const;

export type VisitorRelationship = (typeof VisitorRelationship)[keyof typeof VisitorRelationship];

export const VISITOR_STATUS_LABELS: Record<VisitorStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
};

export const VISITOR_RELATIONSHIP_LABELS: Record<VisitorRelationship, string> = {
  PARENT: 'Parent',
  SIBLING: 'Sibling',
  FRIEND: 'Friend',
  RELATIVE: 'Relative',
  DELIVERY: 'Delivery',
  OTHER: 'Other',
};

export interface Visitor {
  id: string;
  visitorCode: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  relationship: VisitorRelationship;
  purpose: string;
  visitDate: string;
  expectedEntryTime: string;
  expectedExitTime: string;
  status: VisitorStatus;
  qrToken: string | null;
  qrExpiresAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitorPass {
  visitorId: string;
  visitorCode: string;
  token: string;
  expiresAt: string;
  generatedAt: string;
  visitorName: string;
  tenantName: string;
  propertyName: string;
  roomNumber: string;
  visitDate: string;
  expectedEntryTime: string;
  expectedExitTime: string;
  status: VisitorStatus;
}

export interface VisitorFilters {
  query: string;
  propertyId: string;
  buildingId: string;
  roomId: string;
  status: VisitorStatus | '';
  tenantId: string;
  fromDate: string;
  toDate: string;
}

export interface VisitorFormValues {
  visitorName: string;
  visitorPhone: string;
  visitorEmail: string;
  relationship: VisitorRelationship | '';
  purpose: string;
  visitDate: string;
  expectedEntryTime: string;
  expectedExitTime: string;
  notes: string;
}

export interface VisitorSummary {
  totalToday: number;
  pending: number;
  approved: number;
  currentlyInside: number;
  upcoming: number;
  past: number;
}

export interface VisitorActor {
  id: string;
  name: string;
  role: string;
}
