import { notificationStore } from '@/services/notification/notificationStore';
import { noticeStore } from '@/services/notice/noticeStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import {
  NoticeAudience,
  NoticeCategory,
  NoticePriority,
  NoticeStatus,
  type Notice,
  type NoticeFilters,
  type NoticeFormValues,
  type NoticeWithRead,
} from '@/types/notice';
import {
  canTransitionNoticeStatus,
  emptyNoticeFilters,
  filterNotices,
  isNoticeExpired,
  noticeVisibleToTenant,
  summarizeNotices,
} from '@/utils/noticeRules';
import { validateNoticeForm } from '@/utils/noticeValidation';

function wait<T>(value: T, ms = 160): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function nowIso(): string {
  return new Date().toISOString();
}

function today(): string {
  return nowIso().slice(0, 10);
}

function nextCode(existing: Notice[]): string {
  const numbers = existing.map((item) => Number.parseInt(item.noticeCode.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `NT-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`;
}

function evaluateNotice(notice: Notice): Notice {
  if (notice.status === NoticeStatus.PUBLISHED && isNoticeExpired(notice) && canTransitionNoticeStatus(notice.status, NoticeStatus.EXPIRED)) {
    return noticeStore.persist({
      ...notice,
      status: NoticeStatus.EXPIRED,
      updatedAt: nowIso(),
    });
  }
  return notice;
}

function scopedNotices(propertyIds?: string[]): Notice[] {
  return noticeStore.list()
    .map(evaluateNotice)
    .filter((notice) => !propertyIds?.length || propertyIds.includes(notice.propertyId));
}

function toRecord(id: string, noticeCode: string, values: NoticeFormValues, actor: { id: string; name: string }, createdAt: string, status: NoticeStatus): Notice {
  return {
    id,
    noticeCode,
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category as NoticeCategory,
    priority: values.priority as NoticePriority,
    audience: values.audience as NoticeAudience,
    propertyId: values.propertyId,
    propertyName: '',
    buildingId: values.buildingId || null,
    buildingName: null,
    roomId: values.roomId || null,
    roomNumber: null,
    publishDate: values.publishDate || today(),
    expiryDate: values.expiryDate || null,
    attachmentName: values.attachmentName || null,
    attachmentUrl: values.attachmentUrl || null,
    status,
    createdBy: actor.id,
    createdByName: actor.name,
    createdAt,
    updatedAt: nowIso(),
  };
}

/**
 * Notice reads/mutations go through this service so Phase 3 can
 * replace the in-memory store with Axios → FastAPI.
 */
export const noticeService = {
  getNotices(propertyIds?: string[]): Promise<Notice[]> {
    return wait(scopedNotices(propertyIds));
  },

  getNoticeById(id: string, propertyIds?: string[]): Promise<Notice> {
    const notice = noticeStore.get(id);
    if (!notice) return reject('Notice not found.');
    const evaluated = evaluateNotice(notice);
    if (propertyIds?.length && !propertyIds.includes(evaluated.propertyId)) {
      return reject('Notice not found.');
    }
    return wait(evaluated);
  },

  getTenantNotices(tenantId: string): Promise<NoticeWithRead[]> {
    const tenant = tenantStore.get(tenantId);
    if (!tenant) return reject('Tenant not found.');
    const items = noticeStore
      .list()
      .map(evaluateNotice)
      .filter((notice) => noticeVisibleToTenant(notice, tenant))
      .map((notice) => ({
        ...notice,
        isRead: noticeStore.isRead(tenantId, notice.id),
      }))
      .sort((left, right) => right.publishDate.localeCompare(left.publishDate));
    return wait(items);
  },

  getPropertyNotices(propertyId: string): Promise<Notice[]> {
    return wait(scopedNotices().filter((notice) => notice.propertyId === propertyId || notice.audience === NoticeAudience.ALL_TENANTS));
  },

  searchNotices(filters: NoticeFilters = emptyNoticeFilters(), propertyIds?: string[]): Promise<Notice[]> {
    return wait(filterNotices(scopedNotices(propertyIds), filters) as Notice[]);
  },

  getNoticeSummary(propertyIds?: string[], tenantId?: string) {
    const items = scopedNotices(propertyIds);
    const unread = tenantId
      ? items.filter((notice) => {
          const tenant = tenantStore.get(tenantId);
          return tenant ? noticeVisibleToTenant(notice, tenant) && !noticeStore.isRead(tenantId, notice.id) : false;
        }).length
      : 0;
    return wait(summarizeNotices(items, unread));
  },

  async createNotice(values: NoticeFormValues, actor: { id: string; name: string }, propertyIds?: string[]): Promise<Notice> {
    const errors = validateNoticeForm(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to save notice.');
    if (propertyIds?.length && !propertyIds.includes(values.propertyId)) {
      return reject('Notice not found.');
    }
    const { propertyService } = await import('@/services/property/propertyService');
    const property = await propertyService.getPropertyById(values.propertyId);
    const current = noticeStore.list();
    const created = toRecord(`notice-${Date.now().toString(36)}`, nextCode(current), values, actor, nowIso(), NoticeStatus.DRAFT);
    created.propertyName = property.name;
    if (values.buildingId) {
      created.buildingName = property.buildings.find((building) => building.id === values.buildingId)?.name ?? null;
    }
    if (values.roomId) {
      const { roomService } = await import('@/services/room/roomService');
      const room = await roomService.getRoomById(values.roomId);
      created.roomNumber = room.roomNumber;
      created.buildingId = room.buildingId;
      created.buildingName = room.buildingName;
    }
    return wait(noticeStore.insert(created));
  },

  async updateNotice(id: string, values: NoticeFormValues, propertyIds?: string[]): Promise<Notice> {
    const current = noticeStore.get(id);
    if (!current) return reject('Notice not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Notice not found.');
    if (current.status === NoticeStatus.ARCHIVED || current.status === NoticeStatus.EXPIRED) {
      return reject('Expired or archived notices cannot be edited.');
    }
    const errors = validateNoticeForm(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to save notice.');
    const { propertyService } = await import('@/services/property/propertyService');
    const property = await propertyService.getPropertyById(values.propertyId);
    const next = toRecord(id, current.noticeCode, values, { id: current.createdBy, name: current.createdByName }, current.createdAt, current.status);
    next.propertyName = property.name;
    next.buildingName = values.buildingId
      ? property.buildings.find((building) => building.id === values.buildingId)?.name ?? null
      : null;
    if (values.roomId) {
      const { roomService } = await import('@/services/room/roomService');
      const room = await roomService.getRoomById(values.roomId);
      next.roomNumber = room.roomNumber;
      next.buildingId = room.buildingId;
      next.buildingName = room.buildingName;
    }
    return wait(noticeStore.persist(next));
  },

  async publishNotice(id: string, propertyIds?: string[]): Promise<Notice> {
    const current = noticeStore.get(id);
    if (!current) return reject('Notice not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Notice not found.');
    if (!canTransitionNoticeStatus(current.status, NoticeStatus.PUBLISHED)) {
      return reject('This notice cannot be published.');
    }
    const published = noticeStore.persist({
      ...current,
      status: NoticeStatus.PUBLISHED,
      publishDate: current.publishDate || today(),
      updatedAt: nowIso(),
    });
    notificationStore.push({
      title: 'New notice published',
      description: published.title,
      tone: published.priority === 'URGENT' || published.priority === 'HIGH' ? 'warning' : 'info',
    });
    return wait(published);
  },

  expireNotice(id: string, propertyIds?: string[]): Promise<Notice> {
    const current = noticeStore.get(id);
    if (!current) return reject('Notice not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Notice not found.');
    if (!canTransitionNoticeStatus(current.status, NoticeStatus.EXPIRED)) {
      return reject('Only published notices can be expired.');
    }
    return wait(noticeStore.persist({ ...current, status: NoticeStatus.EXPIRED, updatedAt: nowIso() }));
  },

  archiveNotice(id: string, propertyIds?: string[]): Promise<Notice> {
    const current = noticeStore.get(id);
    if (!current) return reject('Notice not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Notice not found.');
    if (!canTransitionNoticeStatus(current.status, NoticeStatus.ARCHIVED)) {
      return reject('This notice cannot be archived.');
    }
    return wait(noticeStore.persist({ ...current, status: NoticeStatus.ARCHIVED, updatedAt: nowIso() }));
  },

  markNoticeRead(tenantId: string, noticeId: string): Promise<NoticeWithRead> {
    const tenant = tenantStore.get(tenantId);
    const notice = noticeStore.get(noticeId);
    if (!tenant || !notice) return reject('Notice not found.');
    const evaluated = evaluateNotice(notice);
    if (!noticeVisibleToTenant(evaluated, tenant)) return reject('Notice not found.');
    noticeStore.markRead(tenantId, noticeId, nowIso());
    return wait({ ...evaluated, isRead: true });
  },
};
