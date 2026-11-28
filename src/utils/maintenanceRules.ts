import { MaintenanceStatus, type MaintenanceFilters } from '@/types/maintenance';

export function canStartMaintenanceTask(status: MaintenanceStatus): boolean {
  return status === MaintenanceStatus.ASSIGNED;
}

export function canCompleteMaintenanceTask(status: MaintenanceStatus): boolean {
  return status === MaintenanceStatus.IN_PROGRESS;
}

export function emptyMaintenanceFilters(): MaintenanceFilters {
  return { query: '', propertyId: '', status: '', priority: '', assignedTo: '', fromDate: '', toDate: '' };
}
