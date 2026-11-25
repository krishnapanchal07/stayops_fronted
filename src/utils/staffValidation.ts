import {
  StaffDepartment,
  StaffRole,
  StaffStatus,
  type Staff,
  type StaffFilters,
  type StaffFormValues,
} from '@/types/staff';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;

export type StaffFormErrors = Partial<Record<keyof StaffFormValues, string>>;

export function emptyStaffFilters(): StaffFilters {
  return { query: '', role: '', department: '', propertyId: '', status: '' };
}

export function emptyStaffForm(): StaffFormValues {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    designation: '',
    propertyIds: [],
    joiningDate: '',
    status: StaffStatus.ACTIVE,
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
  };
}

export function toStaffFormValues(staff: Staff): StaffFormValues {
  return {
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    phone: staff.phone,
    role: staff.role,
    department: staff.department,
    designation: staff.designation,
    propertyIds: [...staff.propertyIds],
    joiningDate: staff.joiningDate,
    status: staff.status,
    profileImage: staff.profileImage ?? '',
    addressLine1: staff.address.addressLine1,
    addressLine2: staff.address.addressLine2 ?? '',
    city: staff.address.city,
    state: staff.address.state,
    postalCode: staff.address.postalCode,
    country: staff.address.country,
    emergencyName: staff.emergencyContact.name,
    emergencyRelationship: staff.emergencyContact.relationship,
    emergencyPhone: staff.emergencyContact.phone,
  };
}

export function validateStaffForm(values: StaffFormValues, allowSingleName = false): StaffFormErrors {
  const errors: StaffFormErrors = {};
  if (!values.firstName.trim()) errors.firstName = 'First name is required.';
  if (!allowSingleName && !values.lastName.trim()) errors.lastName = 'Last name is required.';
  if (`${values.firstName.trim()} ${values.lastName.trim()}`.trim().length > 120) errors.firstName = 'Full name must be at most 120 characters.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email.';
  if (!values.phone.trim()) errors.phone = 'Phone is required.';
  else if (!PHONE_PATTERN.test(values.phone.replace(/\D/g, ''))) errors.phone = 'Enter a 10-digit phone number.';
  if (!values.role || !(values.role in StaffRole)) errors.role = 'Select a role.';
  if (!values.department || !(values.department in StaffDepartment)) errors.department = 'Select a department.';
  if (!values.designation.trim()) errors.designation = 'Designation is required.';
  if (values.propertyIds.length === 0) errors.propertyIds = 'Assign at least one property.';
  if (!values.joiningDate || Number.isNaN(new Date(values.joiningDate).getTime())) errors.joiningDate = 'Enter a valid joining date.';
  if (!values.status || !(values.status in StaffStatus)) errors.status = 'Select a status.';
  if (!values.addressLine1.trim()) errors.addressLine1 = 'Address is required.';
  if (!values.city.trim()) errors.city = 'City is required.';
  if (!values.state.trim()) errors.state = 'State is required.';
  if (!values.emergencyName.trim()) errors.emergencyName = 'Emergency contact is required.';
  if (!values.emergencyPhone.trim()) errors.emergencyPhone = 'Emergency phone is required.';
  else if (!PHONE_PATTERN.test(values.emergencyPhone.replace(/\D/g, ''))) errors.emergencyPhone = 'Enter a 10-digit emergency phone number.';
  return errors;
}

export function filterStaff(records: Staff[], filters: StaffFilters): Staff[] {
  const query = filters.query.trim().toLowerCase();
  return records.filter((staff) => {
    if (query) {
      const haystack = [staff.fullName, staff.employeeCode, staff.email, staff.phone].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.role && staff.role !== filters.role) return false;
    if (filters.department && staff.department !== filters.department) return false;
    if (filters.propertyId && !staff.propertyIds.includes(filters.propertyId)) return false;
    if (filters.status && staff.status !== filters.status) return false;
    return true;
  });
}

export function summarizeStaff(records: Staff[]) {
  return {
    total: records.length,
    active: records.filter((item) => item.status === StaffStatus.ACTIVE).length,
    onLeave: records.filter((item) => item.status === StaffStatus.ON_LEAVE).length,
    inactive: records.filter((item) => item.status === StaffStatus.INACTIVE).length,
  };
}
