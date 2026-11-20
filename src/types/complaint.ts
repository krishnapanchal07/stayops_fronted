export const ComplaintCategory = {
  PLUMBING: 'PLUMBING',
  ELECTRICAL: 'ELECTRICAL',
  INTERNET: 'INTERNET',
  CLEANING: 'CLEANING',
  FURNITURE: 'FURNITURE',
  AC: 'AC',
  WATER: 'WATER',
  SECURITY: 'SECURITY',
  ROOM: 'ROOM',
  NOISE: 'NOISE',
  HOUSEKEEPING: 'HOUSEKEEPING',
  OTHER: 'OTHER',
} as const;

export type ComplaintCategory = (typeof ComplaintCategory)[keyof typeof ComplaintCategory];

export const ComplaintPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type ComplaintPriority = (typeof ComplaintPriority)[keyof typeof ComplaintPriority];

export const ComplaintStatus = {
  OPEN: 'OPEN',
  REVIEWED: 'REVIEWED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
  ESCALATED: 'ESCALATED',
} as const;

export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const ComplaintSource = {
  TENANT: 'TENANT',
  ADMIN: 'ADMIN',
  WARDEN: 'WARDEN',
} as const;

export type ComplaintSource = (typeof ComplaintSource)[keyof typeof ComplaintSource];

export const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  PLUMBING: 'Plumbing',
  ELECTRICAL: 'Electrical',
  INTERNET: 'Internet',
  CLEANING: 'Cleaning',
  FURNITURE: 'Furniture',
  AC: 'AC',
  WATER: 'Water',
  SECURITY: 'Security',
  ROOM: 'Room',
  NOISE: 'Noise',
  HOUSEKEEPING: 'Housekeeping',
  OTHER: 'Other',
};

export const COMPLAINT_PRIORITY_LABELS: Record<ComplaintPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  OPEN: 'Open',
  REVIEWED: 'Reviewed',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
};

export const SLA_HOURS: Record<ComplaintPriority, number> = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 4,
};

export const TERMINAL_COMPLAINT_STATUSES: ComplaintStatus[] = [
  ComplaintStatus.RESOLVED,
  ComplaintStatus.CLOSED,
  ComplaintStatus.REJECTED,
];

export interface ComplaintAttachment {
  id: string;
  complaintId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ComplaintComment {
  id: string;
  complaintId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  message: string;
  visibility: 'PUBLIC' | 'INTERNAL';
  createdAt: string;
}

export interface ComplaintEvent {
  id: string;
  complaintId: string;
  type: string;
  message: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  complaintCode: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  category: ComplaintCategory;
  title: string;
  description: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  resolutionNotes: string;
  estimatedCost: number | null;
  actualCost: number | null;
  escalationLevel: number;
  source: ComplaintSource;
  attachments: ComplaintAttachment[];
}

export interface ComplaintFilters {
  query: string;
  propertyId: string;
  buildingId: string;
  floorId: string;
  roomId: string;
  category: ComplaintCategory | '';
  priority: ComplaintPriority | '';
  status: ComplaintStatus | '';
  assignedTo: string;
  fromDate: string;
  toDate: string;
  overdueOnly: boolean;
}

export interface ComplaintFormValues {
  category: ComplaintCategory | '';
  title: string;
  description: string;
  priority: ComplaintPriority;
  roomId: string;
  attachments: ComplaintAttachment[];
}

export interface ComplaintSummary {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  urgent: number;
  resolvedThisMonth: number;
}

export interface StaffOption {
  id: string;
  name: string;
  roleId: string;
}
