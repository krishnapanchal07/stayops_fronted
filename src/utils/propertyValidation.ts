import type { PropertyFormValues } from '@/types/property';

export type PropertyFormErrors = Partial<Record<keyof PropertyFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const POSTAL_PATTERN = /^\d{6}$/;

export function emptyPropertyForm(): PropertyFormValues {
  return {
    name: '',
    type: 'PG',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    contactNumber: '',
    email: '',
    description: '',
    amenities: [],
    status: 'ACTIVE',
  };
}

export function toPropertyFormValues(values: PropertyFormValues): PropertyFormValues {
  return {
    ownerUserId: values.ownerUserId ?? null,
    latitude: values.latitude ?? null, longitude: values.longitude ?? null,
    isPublic: values.isPublic ?? false, isDemo: values.isDemo ?? false,
    locality: values.locality ?? "", country: values.country ?? "India",
    name: values.name,
    type: values.type,
    address: values.address,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    contactNumber: values.contactNumber,
    email: values.email,
    description: values.description,
    amenities: [...values.amenities],
    status: values.status,
  };
}

export function validatePropertyForm(values: PropertyFormValues): PropertyFormErrors {
  const errors: PropertyFormErrors = {};
  const name = values.name.trim();
  const address = values.address.trim();
  const city = values.city.trim();
  const state = values.state.trim();
  const email = values.email.trim();
  const phone = values.contactNumber.replace(/\D/g, '');
  const postal = values.postalCode.trim();

  if (!name) {
    errors.name = 'Property name is required.';
  } else if (name.length < 2) {
    errors.name = 'Use at least 2 characters.';
  } else if (name.length > 80) {
    errors.name = 'Keep the name under 80 characters.';
  }

  if (!values.type) {
    errors.type = 'Property type is required.';
  }

  if (!address) {
    errors.address = 'Address is required.';
  } else if (address.length > 160) {
    errors.address = 'Keep the address under 160 characters.';
  }

  if (!city) {
    errors.city = 'City is required.';
  }

  if (!state) {
    errors.state = 'State is required.';
  }

  if (postal && !POSTAL_PATTERN.test(postal)) {
    errors.postalCode = 'Enter a 6-digit postal code.';
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.contactNumber = 'Enter a valid 10-digit mobile number.';
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (values.description.trim().length > 500) {
    errors.description = 'Keep the description under 500 characters.';
  }

  if ((values.latitude == null) !== (values.longitude == null)) errors.latitude = 'Provide both coordinates or leave both blank.';
  if (values.latitude != null && (!Number.isFinite(values.latitude) || Math.abs(values.latitude) > 85.05112878)) errors.latitude = 'Latitude must be between -85.05112878 and 85.05112878.';
  if (values.longitude != null && (!Number.isFinite(values.longitude) || Math.abs(values.longitude) > 180)) errors.longitude = 'Longitude must be between -180 and 180.';
  return errors;
}

export function normalizedPropertyForm(values: PropertyFormValues): PropertyFormValues {
  return {
    ...values,
    name: values.name.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    postalCode: values.postalCode.trim(),
    contactNumber: values.contactNumber.replace(/\D/g, ''),
    email: values.email.trim(),
    description: values.description.trim(),
  };
}
