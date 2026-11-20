export const NoticeStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  EXPIRED: 'EXPIRED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type NoticeStatus = (typeof NoticeStatus)[keyof typeof NoticeStatus];

export const NoticeCategory = {
  GENERAL: 'GENERAL',
  MAINTENANCE: 'MAINTENANCE',
  EMERGENCY: 'EMERGENCY',
  PAYMENT: 'PAYMENT',
  EVENT: 'EVENT',
  POLICY: 'POLICY',
  OTHER: 'OTHER',
} as const;

export type NoticeCategory = (typeof NoticeCategory)[keyof typeof NoticeCategory];

export const NoticePriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type NoticePriority = (typeof NoticePriority)[keyof typeof NoticePriority];

export const NoticeAudience = {
  ALL_TENANTS: 'ALL_TENANTS',
  PROPERTY: 'PROPERTY',
  BUILDING: 'BUILDING',
  ROOM: 'ROOM',
  STAFF: 'STAFF',
} as const;

export type NoticeAudience = (typeof NoticeAudience)[keyof typeof NoticeAudience];

export const NOTICE_STATUS_LABELS: Record<NoticeStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  GENERAL: 'General',
  MAINTENANCE: 'Maintenance',
  EMERGENCY: 'Emergency',
  PAYMENT: 'Payment',
  EVENT: 'Event',
  POLICY: 'Policy',
  OTHER: 'Other',
};

export const NOTICE_PRIORITY_LABELS: Record<NoticePriority, string> = {
  LOW: 'Low',
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const NOTICE_AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  ALL_TENANTS: 'All tenants',
  PROPERTY: 'Property',
  BUILDING: 'Building',
  ROOM: 'Room',
  STAFF: 'Staff',
};

export interface Notice {
  id: string;
  noticeCode: string;
  title: string;
  description: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: NoticeAudience;
  propertyId: string;
  propertyName: string;
  buildingId: string | null;
  buildingName: string | null;
  roomId: string | null;
  roomNumber: string | null;
  publishDate: string;
  expiryDate: string | null;
  attachmentName: string | null;
  attachmentUrl: string | null;
  status: NoticeStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeReadState {
  tenantId: string;
  noticeId: string;
  readAt: string;
}

export interface NoticeWithRead extends Notice {
  isRead: boolean;
}

export interface NoticeFilters {
  query: string;
  category: NoticeCategory | '';
  priority: NoticePriority | '';
  status: NoticeStatus | '';
  propertyId: string;
  readState: '' | 'READ' | 'UNREAD';
  fromDate: string;
  toDate: string;
}

export interface NoticeFormValues {
  title: string;
  description: string;
  category: NoticeCategory | '';
  priority: NoticePriority | '';
  audience: NoticeAudience | '';
  propertyId: string;
  buildingId: string;
  roomId: string;
  publishDate: string;
  expiryDate: string;
  attachmentName: string;
  attachmentUrl: string;
}

export interface NoticeSummary {
  total: number;
  draft: number;
  published: number;
  expired: number;
  archived: number;
  unread: number;
}
