import seedStaff from '@/mock/staff.json';
import type { Staff } from '@/types/staff';

let staff = structuredClone(seedStaff) as Staff[];

function clone<T>(value: T): T {
  return structuredClone(value);
}

export const staffStore = {
  list(): Staff[] {
    return clone(staff);
  },

  get(id: string): Staff | undefined {
    const record = staff.find((item) => item.id === id);
    return record ? clone(record) : undefined;
  },

  insert(record: Staff): Staff {
    staff = [record, ...staff];
    return clone(record);
  },

  persist(next: Staff): Staff {
    staff = staff.map((item) => (item.id === next.id ? next : item));
    return clone(next);
  },
};
