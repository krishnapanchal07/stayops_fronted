import seedTasks from '@/mock/maintenanceTasks.json';
import type { MaintenanceTask } from '@/types/maintenance';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let tasks: MaintenanceTask[] = clone(seedTasks as MaintenanceTask[]);

export const maintenanceStore = {
  list(): MaintenanceTask[] {
    return clone(tasks);
  },
  get(id: string): MaintenanceTask | undefined {
    const item = tasks.find((task) => task.id === id);
    return item ? clone(item) : undefined;
  },
  byComplaint(complaintId: string): MaintenanceTask[] {
    return clone(tasks.filter((task) => task.complaintId === complaintId));
  },
  insert(record: MaintenanceTask): MaintenanceTask {
    tasks = [record, ...tasks];
    return clone(record);
  },
  persist(record: MaintenanceTask): MaintenanceTask {
    tasks = tasks.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
};
