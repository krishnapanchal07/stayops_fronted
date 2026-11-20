import { notificationStore } from '@/services/notification/notificationStore';
import { supportStore } from '@/services/support/supportStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import {
  SupportCategory,
  SupportStatus,
  type SupportComment,
  type SupportFilters,
  type SupportFormValues,
  type SupportRequest,
} from '@/types/support';
import {
  canCommentOnSupport,
  canTransitionSupportStatus,
  emptySupportFilters,
  filterSupportRequests,
  summarizeSupport,
} from '@/utils/supportRules';
import { validateSupportForm } from '@/utils/supportValidation';

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

function nextCode(existing: SupportRequest[]): string {
  const numbers = existing.map((item) => Number.parseInt(item.supportCode.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `SUP-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`;
}

function scoped(propertyIds?: string[]): SupportRequest[] {
  return supportStore.list().filter((item) => !propertyIds?.length || (item.propertyId ? propertyIds.includes(item.propertyId) : false));
}

/**
 * Support requests are separate from maintenance complaints.
 * Phase 3 can replace this store with Axios → FastAPI.
 */
export const supportService = {
  getSupportRequests(propertyIds?: string[]): Promise<SupportRequest[]> {
    return wait(scoped(propertyIds));
  },

  getSupportRequestById(id: string, options?: { tenantId?: string; propertyIds?: string[] }): Promise<SupportRequest> {
    const request = supportStore.get(id);
    if (!request) return reject('Support request not found.');
    if (options?.tenantId && request.tenantId !== options.tenantId) return reject('Support request not found.');
    if (options?.propertyIds?.length && request.propertyId && !options.propertyIds.includes(request.propertyId)) {
      return reject('Support request not found.');
    }
    return wait(request);
  },

  getTenantSupportRequests(tenantId: string): Promise<SupportRequest[]> {
    return wait(supportStore.list().filter((item) => item.tenantId === tenantId));
  },

  searchSupportRequests(filters: SupportFilters = emptySupportFilters(), propertyIds?: string[]): Promise<SupportRequest[]> {
    return wait(filterSupportRequests(scoped(propertyIds), filters));
  },

  getSupportSummary(propertyIds?: string[], tenantId?: string) {
    const items = tenantId
      ? supportStore.list().filter((item) => item.tenantId === tenantId)
      : scoped(propertyIds);
    return wait(summarizeSupport(items));
  },

  createSupportRequest(tenantId: string, values: SupportFormValues): Promise<SupportRequest> {
    const tenant = tenantStore.get(tenantId);
    if (!tenant) return reject('Tenant profile not found.');
    const errors = validateSupportForm(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to create request.');
    const created: SupportRequest = {
      id: `sup-${Date.now().toString(36)}`,
      supportCode: nextCode(supportStore.list()),
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      propertyId: tenant.propertyId,
      propertyName: tenant.propertyName,
      category: values.category as SupportCategory,
      subject: values.subject.trim(),
      description: values.description.trim(),
      status: SupportStatus.OPEN,
      assignedTo: null,
      assignedToName: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return wait(supportStore.insert(created));
  },

  updateSupportRequest(id: string, data: Partial<Pick<SupportRequest, 'assignedTo' | 'assignedToName' | 'description'>>, propertyIds?: string[]): Promise<SupportRequest> {
    const current = supportStore.get(id);
    if (!current) return reject('Support request not found.');
    if (propertyIds?.length && current.propertyId && !propertyIds.includes(current.propertyId)) {
      return reject('Support request not found.');
    }
    return wait(supportStore.persist({ ...current, ...data, updatedAt: nowIso() }));
  },

  changeSupportStatus(id: string, status: SupportStatus, propertyIds?: string[]): Promise<SupportRequest> {
    const current = supportStore.get(id);
    if (!current) return reject('Support request not found.');
    if (propertyIds?.length && current.propertyId && !propertyIds.includes(current.propertyId)) {
      return reject('Support request not found.');
    }
    if (!canTransitionSupportStatus(current.status, status)) {
      return reject('That status change is not allowed.');
    }
    const updated = supportStore.persist({ ...current, status, updatedAt: nowIso() });
    notificationStore.push({
      title: 'Support request updated',
      description: `${updated.supportCode} is now ${status.replace('_', ' ').toLowerCase()}.`,
      tone: status === SupportStatus.CLOSED ? 'success' : 'info',
    });
    return wait(updated);
  },

  addSupportComment(
    id: string,
    comment: { authorId: string; authorName: string; authorRole: string; message: string },
    options?: { tenantId?: string; propertyIds?: string[] },
  ): Promise<SupportComment> {
    const current = supportStore.get(id);
    if (!current) return reject('Support request not found.');
    if (options?.tenantId && current.tenantId !== options.tenantId) return reject('Support request not found.');
    if (options?.propertyIds?.length && current.propertyId && !options.propertyIds.includes(current.propertyId)) {
      return reject('Support request not found.');
    }
    if (!canCommentOnSupport(current.status)) return reject('Comments are closed on this request.');
    if (!comment.message.trim()) return reject('Enter a comment.');
    const created = supportStore.addComment({
      id: `supc-${Date.now().toString(36)}`,
      requestId: id,
      authorId: comment.authorId,
      authorName: comment.authorName,
      authorRole: comment.authorRole,
      message: comment.message.trim(),
      createdAt: nowIso(),
    });
    supportStore.persist({ ...current, updatedAt: nowIso() });
    return wait(created);
  },

  getSupportComments(id: string): Promise<SupportComment[]> {
    return wait(supportStore.commentsFor(id));
  },
};
