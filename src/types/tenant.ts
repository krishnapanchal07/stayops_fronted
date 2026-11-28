export const TenantStatus = {
  PROSPECT: 'PROSPECT',
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  NOTICE_PERIOD: 'NOTICE_PERIOD',
  CHECKED_OUT: 'CHECKED_OUT',
  INACTIVE: 'INACTIVE',
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const TenantGender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type TenantGender = (typeof TenantGender)[keyof typeof TenantGender];

export const TenantSource = {
  DIRECT: 'DIRECT',
  WALK_IN: 'WALK_IN',
  INQUIRY: 'INQUIRY',
} as const;

export type TenantSource = (typeof TenantSource)[keyof typeof TenantSource];

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  PROSPECT: 'Prospect',
  ONBOARDING: 'Onboarding',
  ACTIVE: 'Active',
  NOTICE_PERIOD: 'Notice Period',
  CHECKED_OUT: 'Checked Out',
  INACTIVE: 'Inactive',
};

export const TENANT_GENDER_LABELS: Record<TenantGender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export const TENANT_SOURCE_LABELS: Record<TenantSource, string> = {
  DIRECT: 'Direct',
  WALK_IN: 'Walk-in',
  INQUIRY: 'Inquiry',
};

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface TenantActivityEvent {
  id: string;
  action: string;
  description: string;
  actor: string;
  occurredAt: string;
}

export interface TenantPaymentsSummary {
  monthlyRent: number;
  paidThisMonth: number;
  outstanding: number;
  securityDeposit: number;
}

export interface TenantComplaintsSummary {
  open: number;
  resolved: number;
  lastComplaint: string | null;
}

export interface Tenant {
  id: string;
  tenantCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: TenantGender;
  profileImage?: string;
  propertyId: string | null;
  propertyName: string | null;
  buildingId: string | null;
  buildingName: string | null;
  floorId: string | null;
  floorName: string | null;
  roomId: string | null;
  roomNumber: string | null;
  bedId: string | null;
  bedLabel: string | null;
  roomRent: number | null;
  securityDeposit: number | null;
  moveInDate: string | null;
  expectedMoveOutDate: string | null;
  actualMoveOutDate: string | null;
  status: TenantStatus;
  emergencyContact?: EmergencyContact;
  address?: Address;
  /** Admin/warden-only operational notes. Never expose on tenant self-service. */
  internalNotes?: string;
  source: TenantSource;
  inquiryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFilters {
  query: string;
  propertyId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  status: TenantStatus | '';
  moveInPeriod: '' | '30' | '90' | 'YEAR';
}

export interface TenantFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: TenantGender | '';
  profileImage: string;
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
  propertyId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  bedId: string;
  moveInDate: string;
  expectedMoveOutDate: string;
  roomRent: number;
  securityDeposit: number;
  status: TenantStatus;
  internalNotes: string;
  source: TenantSource;
  inquiryId: string;
}

export interface TenantSummary {
  totalTenants: number;
  activeTenants: number;
  onboardingTenants: number;
  noticePeriodTenants: number;
  checkedOutTenants: number;
}

export interface TenantAllocationPatch {
  propertyId: string | null;
  propertyName: string | null;
  buildingId: string | null;
  buildingName: string | null;
  floorId: string | null;
  floorName: string | null;
  roomId: string | null;
  roomNumber: string | null;
  bedId: string | null;
  bedLabel: string | null;
  roomRent: number | null;
  moveInDate: string | null;
}
