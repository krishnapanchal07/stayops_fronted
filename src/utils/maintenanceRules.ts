import { ComplaintPriority } from '@/types/complaint';
import { MaintenanceStatus, type MaintenanceFilters, type MaintenanceSummary, type MaintenanceTask } from '@/types/maintenance';

const TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  PENDING: [MaintenanceStatus.ASSIGNED, MaintenanceStatus.CANCELLED],
  ASSIGNED: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  IN_PROGRESS: [MaintenanceStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransitionMaintenanceStatus(from: MaintenanceStatus, to: MaintenanceStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedMaintenanceTransitions(from: MaintenanceStatus): MaintenanceStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canStartMaintenanceTask(status: MaintenanceStatus): boolean {
  return status === MaintenanceStatus.ASSIGNED || status === MaintenanceStatus.PENDING;
}

export function canCompleteMaintenanceTask(status: MaintenanceStatus): boolean {
  return status === MaintenanceStatus.IN_PROGRESS;
}

export function emptyMaintenanceFilters(): MaintenanceFilters {
  return { query: '', propertyId: '', status: '', priority: '', assignedTo: '', fromDate: '', toDate: '' };
}

export function filterMaintenanceTasks(tasks: MaintenanceTask[], filters: MaintenanceFilters): MaintenanceTask[] {
  const query = filters.query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.propertyId && task.propertyId !== filters.propertyId) return false;
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
    if (filters.fromDate && task.createdAt.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && task.createdAt.slice(0, 10) > filters.toDate) return false;
    if (!query) return true;
    return (
      task.taskCode.toLowerCase().includes(query) ||
      task.complaintCode.toLowerCase().includes(query) ||
      task.roomNumber.toLowerCase().includes(query) ||
      task.title.toLowerCase().includes(query)
    );
  });
}

export function summarizeMaintenanceTasks(tasks: MaintenanceTask[]): MaintenanceSummary {
  const active = tasks.filter((task) => task.status !== MaintenanceStatus.CANCELLED);
  return {
    assigned: active.filter((task) => task.assignedTo && task.status !== MaintenanceStatus.COMPLETED).length,
    new: active.filter((task) => task.status === MaintenanceStatus.PENDING || task.status === MaintenanceStatus.ASSIGNED)
      .length,
    inProgress: active.filter((task) => task.status === MaintenanceStatus.IN_PROGRESS).length,
    urgent: active.filter(
      (task) => task.priority === ComplaintPriority.URGENT && task.status !== MaintenanceStatus.COMPLETED,
    ).length,
    completed: tasks.filter((task) => task.status === MaintenanceStatus.COMPLETED).length,
  };
}
