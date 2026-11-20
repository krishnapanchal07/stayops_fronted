import type { ComplaintPriority } from '@/types/complaint';

export const MaintenanceStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

export const MAINTENANCE_STATUS_LABELS: Record<MaintenanceStatus, string> = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export interface MaintenanceTask {
  id: string;
  taskCode: string;
  complaintId: string;
  complaintCode: string;
  title: string;
  description: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  assignedTo: string | null;
  assignedToName: string | null;
  priority: ComplaintPriority;
  status: MaintenanceStatus;
  scheduledDate: string | null;
  dueDate: string;
  estimatedCost: number | null;
  actualCost: number | null;
  partsUsed: string;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface MaintenanceFilters {
  query: string;
  propertyId: string;
  status: MaintenanceStatus | '';
  priority: ComplaintPriority | '';
  assignedTo: string;
  fromDate: string;
  toDate: string;
}

export interface MaintenanceSummary {
  assigned: number;
  new: number;
  inProgress: number;
  urgent: number;
  completed: number;
}

export interface CompleteTaskValues {
  resolutionNotes: string;
  actualCost: number;
  partsUsed: string;
  completedAt: string;
}
