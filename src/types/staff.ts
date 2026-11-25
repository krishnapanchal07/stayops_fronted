import { RoleCode } from '@/constants/roles';
import type { Address, EmergencyContact } from '@/types/tenant';

export const StaffRole = {
  WARDEN: RoleCode.WARDEN,
  ACCOUNTANT: RoleCode.ACCOUNTANT,
  SECURITY: RoleCode.SECURITY,
  MAINTENANCE: RoleCode.MAINTENANCE,
} as const;

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const StaffStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
} as const;

export type StaffStatus = (typeof StaffStatus)[keyof typeof StaffStatus];

export const StaffDepartment = {
  OPERATIONS: 'OPERATIONS',
  FINANCE: 'FINANCE',
  SECURITY: 'SECURITY',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export type StaffDepartment = (typeof StaffDepartment)[keyof typeof StaffDepartment];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.WARDEN]: 'Warden',
  [StaffRole.ACCOUNTANT]: 'Accountant',
  [StaffRole.SECURITY]: 'Security',
  [StaffRole.MAINTENANCE]: 'Maintenance',
};

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ON_LEAVE: 'On Leave',
};

export const STAFF_DEPARTMENT_LABELS: Record<StaffDepartment, string> = {
  OPERATIONS: 'Operations',
  FINANCE: 'Finance',
  SECURITY: 'Security',
  MAINTENANCE: 'Maintenance',
};

export const STAFF_DEPARTMENT_BY_ROLE: Record<StaffRole, StaffDepartment> = {
  [StaffRole.WARDEN]: StaffDepartment.OPERATIONS,
  [StaffRole.ACCOUNTANT]: StaffDepartment.FINANCE,
  [StaffRole.SECURITY]: StaffDepartment.SECURITY,
  [StaffRole.MAINTENANCE]: StaffDepartment.MAINTENANCE,
};

export interface Staff {
  accountLinkPending?: boolean;
  accountEnabled?: boolean;
  id: string;
  userId?: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  propertyIds: string[];
  propertyNames: string[];
  department: StaffDepartment;
  designation: string;
  status: StaffStatus;
  profileImage?: string;
  joiningDate: string;
  address: Address;
  emergencyContact: EmergencyContact;
  createdAt: string;
  updatedAt: string;
}

export interface StaffFilters {
  query: string;
  role: StaffRole | '';
  department: StaffDepartment | '';
  propertyId: string;
  status: StaffStatus | '';
}

export interface StaffFormValues {
  existingUserId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole | '';
  department: StaffDepartment | '';
  designation: string;
  propertyIds: string[];
  joiningDate: string;
  status: StaffStatus;
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
}

export interface StaffSummary {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}
