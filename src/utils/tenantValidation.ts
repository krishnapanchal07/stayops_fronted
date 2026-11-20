import { TenantStatus, type Tenant, type TenantFilters, type TenantFormValues } from '@/types/tenant';

export type TenantFormErrors = Partial<Record<keyof TenantFormValues, string>>;

export const emptyTenantFilters: TenantFilters = {
  query: '',
  propertyId: '',
  buildingId: '',
  floorId: '',
  roomId: '',
  status: '',
  moveInPeriod: '',
};

export function emptyTenantForm(): TenantFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    profileImage: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
    emergencyEmail: '',
    emergencyAddress: '',
    propertyId: '',
    buildingId: '',
    floorId: '',
    roomId: '',
    bedId: '',
    moveInDate: '',
    expectedMoveOutDate: '',
    roomRent: 0,
    securityDeposit: 0,
    status: TenantStatus.ONBOARDING,
    internalNotes: '',
    source: 'DIRECT',
    inquiryId: '',
  };
}

export function toTenantFormValues(tenant: Tenant): TenantFormValues {
  return {
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    email: tenant.email,
    phone: tenant.phone,
    dateOfBirth: tenant.dateOfBirth ?? '',
    gender: tenant.gender ?? '',
    profileImage: tenant.profileImage ?? '',
    addressLine1: tenant.address?.addressLine1 ?? '',
    addressLine2: tenant.address?.addressLine2 ?? '',
    city: tenant.address?.city ?? '',
    state: tenant.address?.state ?? '',
    postalCode: tenant.address?.postalCode ?? '',
    country: tenant.address?.country ?? 'India',
    emergencyName: tenant.emergencyContact?.name ?? '',
    emergencyRelationship: tenant.emergencyContact?.relationship ?? '',
    emergencyPhone: tenant.emergencyContact?.phone ?? '',
    emergencyEmail: tenant.emergencyContact?.email ?? '',
    emergencyAddress: tenant.emergencyContact?.address ?? '',
    propertyId: tenant.propertyId ?? '',
    buildingId: tenant.buildingId ?? '',
    floorId: tenant.floorId ?? '',
    roomId: tenant.roomId ?? '',
    bedId: tenant.bedId ?? '',
    moveInDate: tenant.moveInDate ?? '',
    expectedMoveOutDate: tenant.expectedMoveOutDate ?? '',
    roomRent: tenant.roomRent ?? 0,
    securityDeposit: tenant.securityDeposit ?? 0,
    status: tenant.status,
    internalNotes: tenant.internalNotes ?? '',
    source: tenant.source,
    inquiryId: tenant.inquiryId ?? '',
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateTenantForm(values: TenantFormValues, tenants: Tenant[], editingId?: string): TenantFormErrors {
  const errors: TenantFormErrors = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const email = values.email.trim();
  const phone = values.phone.replace(/\D/g, '');

  if (!firstName) errors.firstName = 'First name is required.';
  if (!lastName) errors.lastName = 'Last name is required.';

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  } else if (tenants.some((tenant) => tenant.id !== editingId && tenant.email.toLowerCase() === email.toLowerCase())) {
    errors.email = 'This email is already used by another tenant.';
  }

  if (!phone) {
    errors.phone = 'Phone is required.';
  } else if (phone.length !== 10) {
    errors.phone = 'Enter a 10-digit mobile number.';
  }

  if (values.dateOfBirth) {
    const birth = new Date(`${values.dateOfBirth}T00:00:00`);
    if (Number.isNaN(birth.getTime()) || birth > new Date()) {
      errors.dateOfBirth = 'Enter a valid date of birth.';
    }
  }

  if (values.emergencyEmail && !EMAIL_PATTERN.test(values.emergencyEmail.trim())) {
    errors.emergencyEmail = 'Enter a valid emergency email.';
  }
  if (values.emergencyPhone && values.emergencyPhone.replace(/\D/g, '').length !== 10) {
    errors.emergencyPhone = 'Enter a 10-digit emergency phone number.';
  }

  if (values.moveInDate && values.expectedMoveOutDate && values.expectedMoveOutDate < values.moveInDate) {
    errors.expectedMoveOutDate = 'Move-out date must be after the move-in date.';
  }

  if (values.roomRent && values.roomRent < 0) {
    errors.roomRent = 'Monthly rent cannot be negative.';
  }
  if (values.bedId && (!Number.isFinite(values.roomRent) || values.roomRent <= 0)) {
    errors.roomRent = 'Enter a valid monthly rent for the assigned bed.';
  }
  if (values.securityDeposit < 0) {
    errors.securityDeposit = 'Security deposit cannot be negative.';
  }

  const hasBed = Boolean(values.roomId && values.bedId);
  if (values.status === TenantStatus.ACTIVE && !hasBed) {
    errors.bedId = 'Active tenants need an assigned room and bed.';
  }
  if ((values.roomId && !values.bedId) || (values.bedId && !values.roomId)) {
    errors.bedId = 'Select both a room and a bed, or leave both empty.';
  }

  if (
    hasBed &&
    tenants.some(
      (tenant) =>
        tenant.id !== editingId &&
        tenant.bedId === values.bedId &&
        tenant.status !== TenantStatus.CHECKED_OUT &&
        tenant.status !== TenantStatus.INACTIVE,
    )
  ) {
    errors.bedId = 'Selected bed is no longer available.';
  }

  return errors;
}
