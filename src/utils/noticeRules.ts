import {
  NoticeAudience,
  NoticeStatus,
  type Notice,
  type NoticeFilters,
  type NoticeSummary,
  type NoticeWithRead,
} from '@/types/notice';
import type { Tenant } from '@/types/tenant';

const TRANSITIONS: Record<NoticeStatus, NoticeStatus[]> = {
  DRAFT: [NoticeStatus.PUBLISHED, NoticeStatus.ARCHIVED],
  PUBLISHED: [NoticeStatus.EXPIRED, NoticeStatus.ARCHIVED],
  EXPIRED: [],
  ARCHIVED: [],
};

export function canTransitionNoticeStatus(from: NoticeStatus, to: NoticeStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedNoticeTransitions(from: NoticeStatus): NoticeStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function emptyNoticeFilters(): NoticeFilters {
  return {
    query: '',
    category: '',
    priority: '',
    status: '',
    propertyId: '',
    readState: '',
    fromDate: '',
    toDate: '',
  };
}

export function isNoticeExpired(notice: Notice, today = new Date().toISOString().slice(0, 10)): boolean {
  return Boolean(notice.expiryDate && notice.expiryDate < today);
}

export function noticeVisibleToTenant(notice: Notice, tenant: Tenant): boolean {
  if (notice.status === NoticeStatus.DRAFT || notice.status === NoticeStatus.ARCHIVED || notice.status === NoticeStatus.EXPIRED) {
    return false;
  }
  if (notice.audience === NoticeAudience.STAFF) return false;
  if (notice.audience === NoticeAudience.ALL_TENANTS) return true;
  if (notice.audience === NoticeAudience.PROPERTY) return tenant.propertyId === notice.propertyId;
  if (notice.audience === NoticeAudience.BUILDING) {
    return tenant.propertyId === notice.propertyId && tenant.buildingId === notice.buildingId;
  }
  if (notice.audience === NoticeAudience.ROOM) {
    return tenant.roomId === notice.roomId;
  }
  return false;
}

export function filterNotices(items: Notice[] | NoticeWithRead[], filters: NoticeFilters): Array<Notice | NoticeWithRead> {
  const query = filters.query.trim().toLowerCase();
  return items.filter((notice) => {
    if (filters.category && notice.category !== filters.category) return false;
    if (filters.priority && notice.priority !== filters.priority) return false;
    if (filters.status && notice.status !== filters.status) return false;
    if (filters.propertyId && notice.propertyId !== filters.propertyId) return false;
    if (filters.fromDate && notice.publishDate < filters.fromDate) return false;
    if (filters.toDate && notice.publishDate > filters.toDate) return false;
    if (filters.readState && 'isRead' in notice) {
      if (filters.readState === 'READ' && !notice.isRead) return false;
      if (filters.readState === 'UNREAD' && notice.isRead) return false;
    }
    if (!query) return true;
    return (
      notice.title.toLowerCase().includes(query) ||
      notice.description.toLowerCase().includes(query) ||
      notice.noticeCode.toLowerCase().includes(query) ||
      notice.propertyName.toLowerCase().includes(query)
    );
  });
}

export function summarizeNotices(items: Notice[], unread = 0): NoticeSummary {
  return {
    total: items.length,
    draft: items.filter((item) => item.status === NoticeStatus.DRAFT).length,
    published: items.filter((item) => item.status === NoticeStatus.PUBLISHED).length,
    expired: items.filter((item) => item.status === NoticeStatus.EXPIRED).length,
    archived: items.filter((item) => item.status === NoticeStatus.ARCHIVED).length,
    unread,
  };
}
