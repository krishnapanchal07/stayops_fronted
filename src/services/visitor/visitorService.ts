import { entryExitStore } from '@/services/entryExit/entryExitStore';
import { notificationStore } from '@/services/notification/notificationStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import { visitorStore } from '@/services/visitor/visitorStore';
import { EntryExitKind, EntryExitStatus, type EntryExitFilters, type EntryExitLog } from '@/types/entryExit';
import {
  VisitorStatus,
  type Visitor,
  type VisitorActor,
  type VisitorFilters,
  type VisitorFormValues,
  type VisitorPass,
  type VisitorRelationship,
} from '@/types/visitor';
import { emptyEntryExitFilters, filterEntryExitLogs } from '@/utils/entryExitRules';
import {
  canTransitionVisitorStatus,
  canVerifyVisitorPass,
  emptyVisitorFilters,
  filterVisitors,
  isIdenticalVisitorRequest,
  isVisitorPassExpired,
  localToday,
  summarizeVisitors,
  visitorWindowEnd,
} from '@/utils/visitorRules';
import { validateRejectionReason, validateVisitorForm } from '@/utils/visitorValidation';

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

function nextCode(values: string[]): string {
  const numbers = values.map((value) => Number.parseInt(value.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `VR-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`;
}

/**
 * Phase 2 mock QR token. Real signed/validated QR token will be implemented in Phase 3/backend.
 */
function mockQrToken(visitorCode: string): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VIS-${visitorCode.replace(/\D/g, '')}-${suffix}`;
}

function toPass(visitor: Visitor): VisitorPass | null {
  if (!visitor.qrToken || !visitor.qrExpiresAt) return null;
  return {
    visitorId: visitor.id,
    visitorCode: visitor.visitorCode,
    token: visitor.qrToken,
    expiresAt: visitor.qrExpiresAt,
    generatedAt: visitor.approvedAt ?? visitor.updatedAt,
    visitorName: visitor.visitorName,
    tenantName: visitor.tenantName,
    propertyName: visitor.propertyName,
    roomNumber: visitor.roomNumber,
    visitDate: visitor.visitDate,
    expectedEntryTime: visitor.expectedEntryTime,
    expectedExitTime: visitor.expectedExitTime,
    status: visitor.status,
  };
}

function evaluateVisitor(visitor: Visitor, now = new Date()): Visitor {
  if (visitor.status === VisitorStatus.APPROVED && isVisitorPassExpired(visitor, now)) {
    if (!canTransitionVisitorStatus(visitor.status, VisitorStatus.EXPIRED)) return visitor;
    return visitorStore.persist({
      ...visitor,
      status: VisitorStatus.EXPIRED,
      updatedAt: nowIso(),
    });
  }
  return visitor;
}

function evaluateAll(): Visitor[] {
  return visitorStore.list().map((visitor) => evaluateVisitor(visitor));
}

function scopedVisitors(propertyIds?: string[]): Visitor[] {
  const items = evaluateAll();
  return propertyIds?.length ? items.filter((visitor) => propertyIds.includes(visitor.propertyId)) : items;
}

function attachPass(visitor: Visitor): Visitor {
  const expiresAt = visitorWindowEnd(visitor).toISOString();
  return visitorStore.persist({
    ...visitor,
    qrToken: visitor.qrToken ?? mockQrToken(visitor.visitorCode),
    qrExpiresAt: expiresAt,
    updatedAt: nowIso(),
  });
}

export const visitorService = {
  getVisitors(propertyIds?: string[]): Promise<Visitor[]> {
    return wait(scopedVisitors(propertyIds));
  },

  getVisitorById(id: string): Promise<Visitor> {
    const visitor = visitorStore.get(id);
    if (!visitor) return reject('Visitor request not found.');
    return wait(evaluateVisitor(visitor));
  },

  getVisitorsByTenant(tenantId: string): Promise<Visitor[]> {
    return wait(evaluateAll().filter((visitor) => visitor.tenantId === tenantId));
  },

  getMyVisitorById(id: string, tenantId: string): Promise<Visitor> {
    const visitor = visitorStore.get(id);
    if (!visitor || visitor.tenantId !== tenantId) return reject('You can only view your own visitor requests.');
    return wait(evaluateVisitor(visitor));
  },

  getVisitorsByProperty(propertyId: string): Promise<Visitor[]> {
    return wait(evaluateAll().filter((visitor) => visitor.propertyId === propertyId));
  },

  searchVisitors(filters: VisitorFilters, propertyIds?: string[]): Promise<Visitor[]> {
    return wait(filterVisitors(scopedVisitors(propertyIds), filters));
  },

  getVisitorSummary(tenantId?: string, propertyIds?: string[]) {
    let items = evaluateAll();
    if (tenantId) items = items.filter((visitor) => visitor.tenantId === tenantId);
    if (propertyIds?.length) items = items.filter((visitor) => propertyIds.includes(visitor.propertyId));
    return wait(summarizeVisitors(items));
  },

  async createVisitorRequest(tenantId: string, values: VisitorFormValues): Promise<Visitor> {
    const tenant = tenantStore.get(tenantId);
    if (!tenant) return reject('Tenant profile not found.');
    if (!tenant.propertyId || !tenant.roomId || !tenant.roomNumber || !tenant.propertyName) {
      return reject('Visitor requests require an active room allocation.');
    }
    const errors = validateVisitorForm(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to submit visitor request.');
    const existing = evaluateAll();
    if (
      isIdenticalVisitorRequest(
        existing,
        tenantId,
        values.visitorName,
        values.visitDate,
        values.expectedEntryTime,
        values.expectedExitTime,
      )
    ) {
      return reject('An overlapping request for this visitor already exists.');
    }

    const createdAt = nowIso();
    const record: Visitor = {
      id: `vis-${Date.now().toString(36)}`,
      visitorCode: nextCode(existing.map((item) => item.visitorCode)),
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      propertyId: tenant.propertyId,
      propertyName: tenant.propertyName,
      roomId: tenant.roomId,
      roomNumber: tenant.roomNumber,
      visitorName: values.visitorName.trim(),
      visitorPhone: values.visitorPhone.trim(),
      visitorEmail: values.visitorEmail.trim(),
      relationship: values.relationship as VisitorRelationship,
      purpose: values.purpose.trim(),
      visitDate: values.visitDate,
      expectedEntryTime: values.expectedEntryTime,
      expectedExitTime: values.expectedExitTime,
      status: VisitorStatus.PENDING,
      qrToken: null,
      qrExpiresAt: null,
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      rejectedReason: null,
      checkedInAt: null,
      checkedOutAt: null,
      notes: values.notes.trim(),
      createdAt,
      updatedAt: createdAt,
    };
    visitorStore.insert(record);
    notificationStore.push({
      title: 'Visitor request submitted',
      description: `${record.visitorCode}: ${record.visitorName} on ${record.visitDate}.`,
      tone: 'info',
    });
    notificationStore.push({
      title: 'New visitor expected',
      description: `${record.visitorName} requested to visit ${record.tenantName} · Room ${record.roomNumber}.`,
      tone: 'info',
    });
    return wait(record);
  },

  async updateVisitorRequest(id: string, data: Partial<VisitorFormValues>, tenantId?: string): Promise<Visitor> {
    const current = visitorStore.get(id);
    if (!current) return reject('Visitor request not found.');
    if (tenantId && current.tenantId !== tenantId) return reject('You can only update your own visitor requests.');
    if (current.status !== VisitorStatus.PENDING) return reject('Only pending visitor requests can be edited.');
    const merged: VisitorFormValues = {
      visitorName: data.visitorName ?? current.visitorName,
      visitorPhone: data.visitorPhone ?? current.visitorPhone,
      visitorEmail: data.visitorEmail ?? current.visitorEmail,
      relationship: data.relationship ?? current.relationship,
      purpose: data.purpose ?? current.purpose,
      visitDate: data.visitDate ?? current.visitDate,
      expectedEntryTime: data.expectedEntryTime ?? current.expectedEntryTime,
      expectedExitTime: data.expectedExitTime ?? current.expectedExitTime,
      notes: data.notes ?? current.notes,
    };
    const errors = validateVisitorForm(merged);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to update visitor request.');
    return wait(
      visitorStore.persist({
        ...current,
        ...merged,
        relationship: merged.relationship as VisitorRelationship,
        visitorName: merged.visitorName.trim(),
        visitorPhone: merged.visitorPhone.trim(),
        visitorEmail: merged.visitorEmail.trim(),
        purpose: merged.purpose.trim(),
        notes: merged.notes.trim(),
        updatedAt: nowIso(),
      }),
    );
  },

  async approveVisitor(id: string, actor: VisitorActor): Promise<Visitor> {
    const current = evaluateVisitor(visitorStore.get(id) ?? ({} as Visitor));
    if (!current.id) return reject('Visitor request not found.');
    if (!canTransitionVisitorStatus(current.status, VisitorStatus.APPROVED)) {
      return reject('This visitor request cannot be approved.');
    }
    const approved = visitorStore.persist({
      ...current,
      status: VisitorStatus.APPROVED,
      approvedBy: actor.id,
      approvedByName: actor.name,
      approvedAt: nowIso(),
      rejectedReason: null,
      updatedAt: nowIso(),
    });
    const withPass = attachPass(approved);
    notificationStore.push({
      title: 'Visitor approved',
      description: `${withPass.visitorCode}: ${withPass.visitorName} can now use the visitor pass.`,
      tone: 'success',
    });
    notificationStore.push({
      title: 'New visitor expected',
      description: `${withPass.visitorName} visiting ${withPass.tenantName} · Room ${withPass.roomNumber}.`,
      tone: 'info',
    });
    return wait(withPass);
  },

  async rejectVisitor(id: string, reason: string, actor: VisitorActor): Promise<Visitor> {
    const current = visitorStore.get(id);
    if (!current) return reject('Visitor request not found.');
    const reasonError = validateRejectionReason(reason);
    if (reasonError) return reject(reasonError);
    if (!canTransitionVisitorStatus(current.status, VisitorStatus.REJECTED)) {
      return reject('This visitor request cannot be rejected.');
    }
    const updated = visitorStore.persist({
      ...current,
      status: VisitorStatus.REJECTED,
      rejectedReason: reason.trim(),
      approvedBy: actor.id,
      approvedByName: actor.name,
      approvedAt: nowIso(),
      qrToken: null,
      qrExpiresAt: null,
      updatedAt: nowIso(),
    });
    notificationStore.push({
      title: 'Visitor rejected',
      description: `${updated.visitorCode}: ${updated.visitorName} was rejected.`,
      tone: 'warning',
    });
    return wait(updated);
  },

  async cancelVisitor(id: string, tenantId?: string): Promise<Visitor> {
    const current = visitorStore.get(id);
    if (!current) return reject('Visitor request not found.');
    if (tenantId && current.tenantId !== tenantId) return reject('You can only cancel your own visitor requests.');
    if (current.status === VisitorStatus.CHECKED_IN) return reject('A checked-in visitor cannot be cancelled.');
    if (!canTransitionVisitorStatus(current.status, VisitorStatus.CANCELLED)) {
      return reject('This visitor request cannot be cancelled.');
    }
    return wait(
      visitorStore.persist({
        ...current,
        status: VisitorStatus.CANCELLED,
        qrToken: null,
        qrExpiresAt: null,
        updatedAt: nowIso(),
      }),
    );
  },

  async generateVisitorPass(id: string): Promise<VisitorPass> {
    const current = evaluateVisitor(visitorStore.get(id) ?? ({} as Visitor));
    if (!current.id) return reject('Visitor request not found.');
    if (current.status !== VisitorStatus.APPROVED) return reject('A visitor pass can only be generated for approved requests.');
    const withPass = attachPass(current);
    const pass = toPass(withPass);
    return pass ? wait(pass) : reject('Unable to generate visitor pass.');
  },

  async getVisitorPass(id: string): Promise<VisitorPass> {
    const current = evaluateVisitor(visitorStore.get(id) ?? ({} as Visitor));
    if (!current.id) return reject('Visitor request not found.');
    const pass = toPass(current);
    if (!pass || current.status === VisitorStatus.EXPIRED) return reject('Invalid or expired visitor pass.');
    return wait(pass);
  },

  async verifyVisitorPass(code: string, propertyIds?: string[]): Promise<Visitor> {
    const visitor = visitorStore.findByCode(code);
    if (!visitor) return reject('Visitor pass not found.');
    if (propertyIds?.length && !propertyIds.includes(visitor.propertyId)) {
      return reject('This visitor pass is not valid at this property.');
    }
    const current = evaluateVisitor(visitor);
    const invalid = canVerifyVisitorPass(current);
    if (invalid) return reject(invalid);
    if (current.visitDate > localToday()) return reject('This visit is not scheduled yet.');
    return wait(current);
  },

  async checkInVisitor(id: string, actor: VisitorActor, propertyIds?: string[]): Promise<Visitor> {
    const current = evaluateVisitor(visitorStore.get(id) ?? ({} as Visitor));
    if (!current.id) return reject('Visitor request not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) {
      return reject('This visitor is not assigned to this property.');
    }
    const invalid = canVerifyVisitorPass(current);
    if (invalid) return reject(invalid);
    if (!canTransitionVisitorStatus(current.status, VisitorStatus.CHECKED_IN)) {
      return reject('This visitor cannot be checked in.');
    }
    const checkedInAt = nowIso();
    const updated = visitorStore.persist({
      ...current,
      status: VisitorStatus.CHECKED_IN,
      checkedInAt,
      updatedAt: checkedInAt,
    });
    entryExitStore.insert({
      id: `log-${Date.now().toString(36)}`,
      kind: EntryExitKind.VISITOR,
      passCode: updated.visitorCode,
      visitorId: updated.id,
      leaveId: null,
      tenantId: updated.tenantId,
      tenantName: updated.tenantName,
      propertyId: updated.propertyId,
      propertyName: updated.propertyName,
      roomNumber: updated.roomNumber,
      personName: updated.visitorName,
      entryAt: checkedInAt,
      exitAt: null,
      returnAt: null,
      status: EntryExitStatus.INSIDE,
      recordedBy: actor.id,
      recordedByName: actor.name,
      createdAt: checkedInAt,
    });
    notificationStore.push({
      title: 'Visitor checked in',
      description: `${updated.visitorName} checked in for ${updated.tenantName} · Room ${updated.roomNumber}.`,
      tone: 'success',
    });
    return wait(updated);
  },

  async checkOutVisitor(id: string, actor: VisitorActor, propertyIds?: string[]): Promise<Visitor> {
    const current = visitorStore.get(id);
    if (!current) return reject('Visitor request not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) {
      return reject('This visitor is not assigned to this property.');
    }
    if (!canTransitionVisitorStatus(current.status, VisitorStatus.CHECKED_OUT)) {
      return reject('Only checked-in visitors can be checked out.');
    }
    const checkedOutAt = nowIso();
    const updated = visitorStore.persist({
      ...current,
      status: VisitorStatus.CHECKED_OUT,
      checkedOutAt,
      updatedAt: checkedOutAt,
    });
    const openLog = entryExitStore.byVisitor(updated.id);
    if (openLog) {
      entryExitStore.persist({
        ...openLog,
        exitAt: checkedOutAt,
        status: EntryExitStatus.COMPLETED,
        recordedBy: actor.id,
        recordedByName: actor.name,
      });
    }
    notificationStore.push({
      title: 'Visitor checked out',
      description: `${updated.visitorName} left Room ${updated.roomNumber}.`,
      tone: 'success',
    });
    return wait(updated);
  },

  getCurrentlyInside(propertyIds?: string[]): Promise<Visitor[]> {
    return wait(scopedVisitors(propertyIds).filter((visitor) => visitor.status === VisitorStatus.CHECKED_IN));
  },

  getEntryExitLogs(filters: EntryExitFilters = emptyEntryExitFilters(), propertyIds?: string[]): Promise<EntryExitLog[]> {
    const logs = entryExitStore.list().filter((log) => !propertyIds?.length || propertyIds.includes(log.propertyId));
    return wait(filterEntryExitLogs(logs, filters));
  },

  emptyFilters: emptyVisitorFilters,
};
