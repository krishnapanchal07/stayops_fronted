export const SupportCategory = {
  ACCOUNT: 'ACCOUNT',
  DOCUMENT: 'DOCUMENT',
  PAYMENT: 'PAYMENT',
  GENERAL: 'GENERAL',
} as const;

export type SupportCategory = (typeof SupportCategory)[keyof typeof SupportCategory];

export const SupportStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type SupportStatus = (typeof SupportStatus)[keyof typeof SupportStatus];

export const SUPPORT_CATEGORY_LABELS: Record<SupportCategory, string> = {
  ACCOUNT: 'Account issue',
  DOCUMENT: 'Document issue',
  PAYMENT: 'Payment clarification',
  GENERAL: 'General question',
};

export const SUPPORT_STATUS_LABELS: Record<SupportStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export interface SupportComment {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  supportCode: string;
  tenantId: string;
  tenantName: string;
  propertyId: string | null;
  propertyName: string | null;
  category: SupportCategory;
  subject: string;
  description: string;
  status: SupportStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportFilters {
  query: string;
  category: SupportCategory | '';
  status: SupportStatus | '';
}

export interface SupportFormValues {
  category: SupportCategory | '';
  subject: string;
  description: string;
}

export interface NotificationPreferences {
  userId: string;
  payments: boolean;
  complaints: boolean;
  visitors: boolean;
  leave: boolean;
  notices: boolean;
}

export interface TenantProfileFormValues {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyEmail: string;
  emergencyAddress: string;
  profileImage: string;
}

export interface ChangePasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SupportSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export interface RoommateInfo {
  id: string;
  fullName: string;
  profileImage?: string;
}
