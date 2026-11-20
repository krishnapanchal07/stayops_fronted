import { propertyService } from '@/services/property/propertyService';
import { staffStore } from '@/services/staff/staffStore';
import { StaffStatus, type Staff, type StaffFilters, type StaffFormValues, type StaffSummary } from '@/types/staff';
import { filterStaff, summarizeStaff } from '@/utils/staffValidation';

function wait<T>(value: T, ms = 140): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

async function withPropertyNames(record: Staff): Promise<Staff> {
  const properties = await propertyService.getProperties();
  const names = record.propertyIds
    .map((id) => properties.find((property) => property.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  return { ...record, propertyNames: names };
}

function nextEmployeeCode(existing: Staff[]): string {
  const numbers = existing
    .map((item) => Number(item.employeeCode.replace(/\D/g, '')))
    .filter((value) => Number.isFinite(value));
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `STF-${next}`;
}

function fromForm(values: StaffFormValues, current?: Staff): Staff {
  const now = new Date().toISOString();
  return {
    id: current?.id ?? `staff-${Date.now().toString(36)}`,
    userId: current?.userId,
    employeeCode: current?.employeeCode ?? nextEmployeeCode(staffStore.list()),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    fullName: `${values.firstName.trim()} ${values.lastName.trim()}`.replace(/\s+/g, ' '),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.replace(/\D/g, '').slice(-10),
    role: values.role as Staff['role'],
    propertyIds: [...values.propertyIds],
    propertyNames: current?.propertyNames ?? [],
    department: values.department as Staff['department'],
    designation: values.designation.trim(),
    status: values.status,
    profileImage: values.profileImage || undefined,
    joiningDate: values.joiningDate,
    address: {
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || undefined,
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
      country: values.country.trim() || 'India',
    },
    emergencyContact: {
      name: values.emergencyName.trim(),
      relationship: values.emergencyRelationship.trim(),
      phone: values.emergencyPhone.trim(),
    },
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  };
}

export const staffService = {
  async getStaff(): Promise<Staff[]> {
    const records = await Promise.all(staffStore.list().map((item) => withPropertyNames(item)));
    return wait(records);
  },

  async getStaffById(id: string): Promise<Staff> {
    const record = staffStore.get(id);
    if (!record) return Promise.reject(new Error('Staff member not found.'));
    return wait(await withPropertyNames(record));
  },

  async searchStaff(filters: StaffFilters): Promise<Staff[]> {
    const records = await this.getStaff();
    return filterStaff(records, filters);
  },

  async getStaffSummary(): Promise<StaffSummary> {
    const records = staffStore.list();
    return wait(summarizeStaff(records));
  },

  async createStaff(values: StaffFormValues): Promise<Staff> {
    const created = staffStore.insert(fromForm(values));
    return wait(await withPropertyNames(created));
  },

  async updateStaff(id: string, values: StaffFormValues): Promise<Staff> {
    const current = staffStore.get(id);
    if (!current) return Promise.reject(new Error('Staff member not found.'));
    const next = fromForm(values, current);
    if (current.userId) {
      next.email = current.email;
      next.role = current.role;
      next.userId = current.userId;
    }
    return wait(await withPropertyNames(staffStore.persist(next)));
  },

  async activateStaff(id: string): Promise<Staff> {
    const current = staffStore.get(id);
    if (!current) return Promise.reject(new Error('Staff member not found.'));
    return wait(
      await withPropertyNames(
        staffStore.persist({ ...current, status: StaffStatus.ACTIVE, updatedAt: new Date().toISOString() }),
      ),
    );
  },

  async deactivateStaff(id: string): Promise<Staff> {
    const current = staffStore.get(id);
    if (!current) return Promise.reject(new Error('Staff member not found.'));
    return wait(
      await withPropertyNames(
        staffStore.persist({ ...current, status: StaffStatus.INACTIVE, updatedAt: new Date().toISOString() }),
      ),
    );
  },
};
