import { SupportCategory, type ChangePasswordValues, type SupportFormValues, type TenantProfileFormValues } from '@/types/support';
import type { Tenant } from '@/types/tenant';

export type SupportFormErrors = Partial<Record<keyof SupportFormValues, string>>;
export type TenantProfileFormErrors = Partial<Record<keyof TenantProfileFormValues, string>>;
export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptySupportForm(): SupportFormValues {
  return { category: '', subject: '', description: '' };
}

export function validateSupportForm(values: SupportFormValues): SupportFormErrors {
  const errors: SupportFormErrors = {};
  if (!values.category || !(values.category in SupportCategory)) errors.category = 'Select a category.';
  if (!values.subject.trim()) errors.subject = 'Subject is required.';
  if (!values.description.trim()) errors.description = 'Describe the issue.';
  return errors;
}

export function toTenantProfileForm(tenant: Tenant): TenantProfileFormValues {
  return {
    phone: tenant.phone,
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
    profileImage: tenant.profileImage ?? '',
  };
}

export function emptyTenantProfileForm(): TenantProfileFormValues {
  return {
    phone: '',
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
    profileImage: '',
  };
}

export function validateTenantProfileForm(values: TenantProfileFormValues): TenantProfileFormErrors {
  const errors: TenantProfileFormErrors = {};
  const phone = values.phone.replace(/\D/g, '');
  if (!phone) errors.phone = 'Phone is required.';
  else if (phone.length !== 10) errors.phone = 'Enter a 10-digit mobile number.';

  if (!values.addressLine1.trim()) errors.addressLine1 = 'Address is required.';
  if (!values.city.trim()) errors.city = 'City is required.';
  if (!values.state.trim()) errors.state = 'State is required.';
  if (!values.postalCode.trim()) errors.postalCode = 'Postal code is required.';

  if (!values.emergencyName.trim()) errors.emergencyName = 'Emergency contact name is required.';
  if (!values.emergencyRelationship.trim()) errors.emergencyRelationship = 'Relationship is required.';
  const emergencyPhone = values.emergencyPhone.replace(/\D/g, '');
  if (!emergencyPhone) errors.emergencyPhone = 'Emergency phone is required.';
  else if (emergencyPhone.length !== 10) errors.emergencyPhone = 'Enter a 10-digit emergency phone number.';
  if (values.emergencyEmail && !EMAIL_PATTERN.test(values.emergencyEmail.trim())) {
    errors.emergencyEmail = 'Enter a valid emergency email.';
  }
  return errors;
}

export function validateChangePassword(values: ChangePasswordValues): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {};
  if (!values.currentPassword) errors.currentPassword = 'Current password is required.';
  if (!values.newPassword) errors.newPassword = 'New password is required.';
  else if (values.newPassword.length < 8) errors.newPassword = 'Use at least 8 characters.';
  if (!values.confirmPassword) errors.confirmPassword = 'Confirm the new password.';
  else if (values.newPassword !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (values.currentPassword && values.newPassword && values.currentPassword === values.newPassword) {
    errors.newPassword = 'New password must be different from the current password.';
  }
  return errors;
}
