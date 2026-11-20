import type { RoleCode } from '@/constants/roles';

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  ASSIGN: 'ASSIGN',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  BED_ASSIGNED: 'BED_ASSIGNED',
  BED_RELEASED: 'BED_RELEASED',
  INQUIRY_APPROVED: 'INQUIRY_APPROVED',
  TENANT_CREATED: 'TENANT_CREATED',
  COMPLAINT_ESCALATED: 'COMPLAINT_ESCALATED',
  VISITOR_CHECKED_IN: 'VISITOR_CHECKED_IN',
  VISITOR_CHECKED_OUT: 'VISITOR_CHECKED_OUT',
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditResourceType = {
  PROPERTY: 'PROPERTY',
  ROOM: 'ROOM',
  BED: 'BED',
  TENANT: 'TENANT',
  INQUIRY: 'INQUIRY',
  STAFF: 'STAFF',
  PAYMENT: 'PAYMENT',
  INVOICE: 'INVOICE',
  EXPENSE: 'EXPENSE',
  COMPLAINT: 'COMPLAINT',
  MAINTENANCE: 'MAINTENANCE',
  VISITOR: 'VISITOR',
  LEAVE: 'LEAVE',
  NOTICE: 'NOTICE',
  DOCUMENT: 'DOCUMENT',
  SESSION: 'SESSION',
} as const;

export type AuditResourceType = (typeof AuditResourceType)[keyof typeof AuditResourceType];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  STATUS_CHANGE: 'Status changed',
  ASSIGN: 'Assigned',
  APPROVE: 'Approved',
  REJECT: 'Rejected',
  LOGIN: 'Signed in',
  LOGOUT: 'Signed out',
  PAYMENT_RECORDED: 'Payment recorded',
  PAYMENT_REFUNDED: 'Payment refunded',
  BED_ASSIGNED: 'Bed assigned',
  BED_RELEASED: 'Bed released',
  INQUIRY_APPROVED: 'Inquiry approved',
  TENANT_CREATED: 'Tenant created',
  COMPLAINT_ESCALATED: 'Complaint escalated',
  VISITOR_CHECKED_IN: 'Visitor checked in',
  VISITOR_CHECKED_OUT: 'Visitor checked out',
};

export const AUDIT_RESOURCE_LABELS: Record<AuditResourceType, string> = {
  PROPERTY: 'Property',
  ROOM: 'Room',
  BED: 'Bed',
  TENANT: 'Tenant',
  INQUIRY: 'Inquiry',
  STAFF: 'Staff',
  PAYMENT: 'Payment',
  INVOICE: 'Invoice',
  EXPENSE: 'Expense',
  COMPLAINT: 'Complaint',
  MAINTENANCE: 'Maintenance',
  VISITOR: 'Visitor',
  LEAVE: 'Leave',
  NOTICE: 'Notice',
  DOCUMENT: 'Document',
  SESSION: 'Session',
};

export const CRITICAL_AUDIT_ACTIONS: AuditAction[] = [
  AuditAction.DELETE,
  AuditAction.PAYMENT_REFUNDED,
  AuditAction.COMPLAINT_ESCALATED,
  AuditAction.REJECT,
  AuditAction.STATUS_CHANGE,
];

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: RoleCode;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  resourceLabel: string;
  description: string;
  oldValue?: Record<string, string | number | boolean | null>;
  newValue?: Record<string, string | number | boolean | null>;
  propertyId?: string;
  propertyName?: string;
  metadata?: Record<string, string>;
}

export interface AuditFilters {
  query: string;
  actorId: string;
  role: RoleCode | '';
  action: AuditAction | '';
  resourceType: AuditResourceType | '';
  propertyId: string;
  fromDate: string;
  toDate: string;
}

export interface AuditSummary {
  today: number;
  logins: number;
  updates: number;
  critical: number;
}
