import usersData from '@/mock/users.json';
import { complaintStore } from '@/services/complaint/complaintStore';
import { maintenanceStore } from '@/services/maintenance/maintenanceStore';
import { notificationStore } from '@/services/notification/notificationStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import {
  ComplaintSource,
  ComplaintStatus,
  COMPLAINT_STATUS_LABELS,
  type Complaint,
  type ComplaintComment,
  type ComplaintEvent,
  type ComplaintFilters,
  type ComplaintFormValues,
  type ComplaintPriority,
  type StaffOption,
} from '@/types/complaint';
import { MaintenanceStatus, type MaintenanceTask } from '@/types/maintenance';
import type { MockUserRecord } from '@/types/user';
import {
  calculateComplaintDueDate,
  canAssignComplaint,
  canEscalateComplaint,
  canTenantComment,
  canTenantConfirmResolution,
  canTransitionComplaintStatus,
  filterComplaints,
  summarizeComplaints,
} from '@/utils/complaintRules';
import { validateComplaintForm, validateAssignment, validateEscalation } from '@/utils/complaintValidation';

export interface ComplaintActor {
  id: string;
  name: string;
  role: string;
}

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

function nextCode(prefix: string, values: string[]): string {
  const numbers = values.map((value) => Number.parseInt(value.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `${prefix}-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`;
}

function addEvent(complaintId: string, type: string, message: string, actor: ComplaintActor): ComplaintEvent {
  return complaintStore.insertEvent({
    id: `evt-${Date.now().toString(36)}`,
    complaintId,
    type,
    message,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    createdAt: nowIso(),
  });
}

export const complaintService = {
  getComplaints(): Promise<Complaint[]> {
    return wait(complaintStore.list());
  },

  getComplaintById(id: string): Promise<Complaint> {
    const complaint = complaintStore.get(id);
    return complaint ? wait(complaint) : reject('Complaint not found.');
  },

  getComplaintsByTenant(tenantId: string): Promise<Complaint[]> {
    return wait(complaintStore.list().filter((complaint) => complaint.tenantId === tenantId));
  },

  getMyComplaintById(id: string, tenantId: string): Promise<Complaint> {
    const complaint = complaintStore.get(id);
    if (!complaint || complaint.tenantId !== tenantId) return reject('You can only view your own complaints.');
    return wait(complaint);
  },

  searchComplaints(filters: ComplaintFilters, propertyIds?: string[]): Promise<Complaint[]> {
    const scoped = propertyIds?.length
      ? complaintStore.list().filter((complaint) => propertyIds.includes(complaint.propertyId))
      : complaintStore.list();
    return wait(filterComplaints(scoped, filters));
  },

  getComplaintSummary(tenantId?: string, propertyIds?: string[]) {
    let items = complaintStore.list();
    if (tenantId) items = items.filter((complaint) => complaint.tenantId === tenantId);
    if (propertyIds?.length) items = items.filter((complaint) => propertyIds.includes(complaint.propertyId));
    return wait(summarizeComplaints(items));
  },

  async getTotalComplaints(propertyIds?: string[]) {
    const summary = await this.getComplaintSummary(undefined, propertyIds);
    return summary.total;
  },

  async getOpenComplaints(propertyIds?: string[]) {
    const summary = await this.getComplaintSummary(undefined, propertyIds);
    return summary.open;
  },

  async getInProgressComplaints(propertyIds?: string[]) {
    const summary = await this.getComplaintSummary(undefined, propertyIds);
    return summary.inProgress;
  },

  async getResolvedComplaints(propertyIds?: string[]) {
    const summary = await this.getComplaintSummary(undefined, propertyIds);
    return summary.resolved;
  },

  async getOverdueComplaints(propertyIds?: string[]) {
    const summary = await this.getComplaintSummary(undefined, propertyIds);
    return summary.overdue;
  },

  async getUrgentComplaints(propertyIds?: string[]) {
    const summary = await this.getComplaintSummary(undefined, propertyIds);
    return summary.urgent;
  },

  getComments(complaintId: string, includeInternal: boolean): Promise<ComplaintComment[]> {
    const items = complaintStore
      .listComments(complaintId)
      .filter((comment) => includeInternal || comment.visibility === 'PUBLIC');
    return wait(items);
  },

  getTimeline(complaintId: string): Promise<ComplaintEvent[]> {
    return wait(complaintStore.listEvents(complaintId));
  },

  getMaintenanceStaff(): Promise<StaffOption[]> {
    const staff = (usersData as MockUserRecord[])
      .filter((user) => user.roleId === 'MAINTENANCE' && user.status === 'ACTIVE')
      .map((user) => ({ id: user.id, name: user.name, roleId: user.roleId }));
    return wait(staff);
  },

  async createComplaint(values: ComplaintFormValues, actor: ComplaintActor): Promise<Complaint> {
    const tenant = tenantStore.get(actor.id);
    const requireRoom = Boolean(tenant?.roomId);
    const errors = validateComplaintForm(values, requireRoom);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to create complaint.');
    }
    const createdAt = nowIso();
    const roomId = values.roomId || tenant?.roomId || '';
    const record: Complaint = {
      id: `cmp-${Date.now().toString(36)}`,
      complaintCode: nextCode(
        'CMP',
        complaintStore.list().map((item) => item.complaintCode),
      ),
      tenantId: tenant?.id ?? actor.id,
      tenantName: tenant?.fullName ?? actor.name,
      propertyId: tenant?.propertyId ?? '',
      propertyName: tenant?.propertyName ?? 'Unassigned',
      roomId,
      roomNumber: tenant?.roomNumber ?? '',
      category: values.category as Complaint['category'],
      title: values.title.trim(),
      description: values.description.trim(),
      priority: values.priority,
      status: ComplaintStatus.OPEN,
      assignedTo: null,
      assignedToName: null,
      createdAt,
      updatedAt: createdAt,
      dueAt: calculateComplaintDueDate(createdAt, values.priority),
      resolvedAt: null,
      closedAt: null,
      resolutionNotes: '',
      estimatedCost: null,
      actualCost: null,
      escalationLevel: 0,
      source: ComplaintSource.TENANT,
      attachments: values.attachments.map((item) => ({ ...item, complaintId: item.complaintId || `pending` })),
    };
    record.attachments = record.attachments.map((item) => ({ ...item, complaintId: record.id }));
    complaintStore.insert(record);
    addEvent(record.id, 'CREATED', `${actor.name} created complaint`, actor);
    notificationStore.push({
      title:
        record.priority === 'URGENT' || record.priority === 'HIGH'
          ? 'High priority complaint received'
          : 'Complaint created',
      description: `${record.complaintCode}: ${record.title}`,
      tone: record.priority === 'URGENT' || record.priority === 'HIGH' ? 'warning' : 'info',
    });
    return wait(record);
  },

  async changeComplaintStatus(id: string, status: ComplaintStatus, actor: ComplaintActor): Promise<Complaint> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canTransitionComplaintStatus(current.status, status)) {
      return reject(`Cannot change ${COMPLAINT_STATUS_LABELS[current.status]} to ${COMPLAINT_STATUS_LABELS[status]}.`);
    }
    const updated = complaintStore.persist({
      ...current,
      status,
      updatedAt: nowIso(),
      resolvedAt: status === ComplaintStatus.RESOLVED ? nowIso() : current.resolvedAt,
      closedAt: status === ComplaintStatus.CLOSED ? nowIso() : current.closedAt,
    });
    addEvent(id, 'STATUS', `Status changed to ${COMPLAINT_STATUS_LABELS[status]}`, actor);
    return wait(updated);
  },

  async assignComplaint(
    id: string,
    staffId: string,
    options: { dueAt?: string; priority?: ComplaintPriority; actor: ComplaintActor },
  ): Promise<{ complaint: Complaint; task: MaintenanceTask }> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canAssignComplaint(current.status)) return reject('This complaint cannot be assigned in its current status.');
    const staff = (usersData as MockUserRecord[]).find((user) => user.id === staffId && user.roleId === 'MAINTENANCE');
    if (!staff) return reject('Select a valid maintenance staff member.');
    const errors = validateAssignment(staffId, options.dueAt ?? current.dueAt);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to assign complaint.');

    const nextStatus = current.status === ComplaintStatus.IN_PROGRESS ? ComplaintStatus.IN_PROGRESS : ComplaintStatus.ASSIGNED;
    if (nextStatus !== current.status && !canTransitionComplaintStatus(current.status, nextStatus)) {
      return reject('This complaint cannot be assigned from the current status.');
    }
    const updated = complaintStore.persist({
      ...current,
      assignedTo: staff.id,
      assignedToName: staff.name,
      priority: options.priority ?? current.priority,
      dueAt: options.dueAt ?? current.dueAt,
      status: nextStatus,
      updatedAt: nowIso(),
    });
    addEvent(id, 'ASSIGNED', `Assigned to ${staff.name}`, options.actor);

    const existing = maintenanceStore.byComplaint(id).find((task) => task.status !== MaintenanceStatus.COMPLETED && task.status !== MaintenanceStatus.CANCELLED);
    const task =
      existing ??
      maintenanceStore.insert({
        id: `task-${Date.now().toString(36)}`,
        taskCode: nextCode(
          'MT',
          maintenanceStore.list().map((item) => item.taskCode),
        ),
        complaintId: updated.id,
        complaintCode: updated.complaintCode,
        title: updated.title,
        description: updated.description,
        propertyId: updated.propertyId,
        propertyName: updated.propertyName,
        roomId: updated.roomId,
        roomNumber: updated.roomNumber,
        assignedTo: staff.id,
        assignedToName: staff.name,
        priority: updated.priority,
        status: MaintenanceStatus.ASSIGNED,
        scheduledDate: nowIso().slice(0, 10),
        dueDate: updated.dueAt,
        estimatedCost: updated.estimatedCost,
        actualCost: null,
        partsUsed: '',
        resolutionNotes: '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        completedAt: null,
      });
    const assignedTask = existing
      ? maintenanceStore.persist({
          ...existing,
          assignedTo: staff.id,
          assignedToName: staff.name,
          priority: updated.priority,
          dueDate: updated.dueAt,
          status: existing.status === MaintenanceStatus.PENDING ? MaintenanceStatus.ASSIGNED : existing.status,
          updatedAt: nowIso(),
        })
      : task;

    notificationStore.push({
      title: 'Complaint assigned',
      description: `Your complaint ${updated.complaintCode} has been assigned.`,
      tone: 'info',
    });
    notificationStore.push({
      title: 'New maintenance task assigned to you',
      description: `${assignedTask.taskCode} · ${updated.title}`,
      tone: 'warning',
    });
    return wait({ complaint: updated, task: assignedTask });
  },

  async addComplaintComment(id: string, message: string, actor: ComplaintActor): Promise<ComplaintComment> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canTenantComment(current.status) && actor.role === 'TENANT') {
      return reject('Comments are closed for this complaint.');
    }
    if (!message.trim()) return reject('Enter a comment.');
    const comment = complaintStore.insertComment({
      id: `cmt-${Date.now().toString(36)}`,
      complaintId: id,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      message: message.trim(),
      visibility: 'PUBLIC',
      createdAt: nowIso(),
    });
    addEvent(id, 'COMMENT', 'Comment added', actor);
    complaintStore.persist({ ...current, updatedAt: nowIso() });
    return wait(comment);
  },

  async addInternalNote(id: string, note: string, actor: ComplaintActor): Promise<ComplaintComment> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!note.trim()) return reject('Enter an internal note.');
    const comment = complaintStore.insertComment({
      id: `cmt-${Date.now().toString(36)}`,
      complaintId: id,
      authorId: actor.id,
      authorName: actor.name,
      authorRole: actor.role,
      message: note.trim(),
      visibility: 'INTERNAL',
      createdAt: nowIso(),
    });
    addEvent(id, 'INTERNAL', 'Internal note added', actor);
    return wait(comment);
  },

  async escalateComplaint(id: string, reason: string, actor: ComplaintActor): Promise<Complaint> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canEscalateComplaint(current.status)) return reject('This complaint cannot be escalated.');
    const reasonError = validateEscalation(reason);
    if (reasonError) return reject(reasonError);
    if (!canTransitionComplaintStatus(current.status, ComplaintStatus.ESCALATED)) {
      return reject('This complaint cannot be escalated from the current status.');
    }
    const updated = complaintStore.persist({
      ...current,
      status: ComplaintStatus.ESCALATED,
      escalationLevel: current.escalationLevel + 1,
      updatedAt: nowIso(),
    });
    addEvent(id, 'ESCALATED', `Escalated: ${reason.trim()}`, actor);
    notificationStore.push({
      title: 'Complaint escalated',
      description: `${updated.complaintCode} was escalated.`,
      tone: 'warning',
    });
    return wait(updated);
  },

  async resolveComplaint(id: string, resolution: string, actor: ComplaintActor, actualCost?: number): Promise<Complaint> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canTransitionComplaintStatus(current.status, ComplaintStatus.RESOLVED)) {
      return reject('This complaint cannot be resolved yet.');
    }
    const updated = complaintStore.persist({
      ...current,
      status: ComplaintStatus.RESOLVED,
      resolutionNotes: resolution.trim(),
      actualCost: actualCost ?? current.actualCost,
      resolvedAt: nowIso(),
      updatedAt: nowIso(),
    });
    addEvent(id, 'RESOLVED', 'Issue resolved', actor);
    notificationStore.push({
      title: 'Complaint resolved',
      description: `${updated.complaintCode} is marked as resolved.`,
      tone: 'success',
    });
    return wait(updated);
  },

  async closeComplaint(id: string, actor: ComplaintActor): Promise<Complaint> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canTenantConfirmResolution(current.status) && current.status !== ComplaintStatus.RESOLVED) {
      return reject('Only resolved complaints can be closed.');
    }
    if (!canTransitionComplaintStatus(current.status, ComplaintStatus.CLOSED)) {
      return reject('This complaint cannot be closed yet.');
    }
    const updated = complaintStore.persist({
      ...current,
      status: ComplaintStatus.CLOSED,
      closedAt: nowIso(),
      updatedAt: nowIso(),
    });
    addEvent(id, 'CLOSED', 'Tenant confirmed closure', actor);
    notificationStore.push({
      title: 'Complaint closed',
      description: `${updated.complaintCode} was closed.`,
      tone: 'success',
    });
    return wait(updated);
  },

  async reopenComplaint(id: string, actor: ComplaintActor): Promise<Complaint> {
    const current = complaintStore.get(id);
    if (!current) return reject('Complaint not found.');
    if (!canTransitionComplaintStatus(current.status, ComplaintStatus.IN_PROGRESS)) {
      return reject('This complaint cannot be reopened.');
    }
    const updated = complaintStore.persist({
      ...current,
      status: ComplaintStatus.IN_PROGRESS,
      resolvedAt: null,
      closedAt: null,
      updatedAt: nowIso(),
    });
    addEvent(id, 'REOPENED', 'Tenant reported the issue is not fixed', actor);
    return wait(updated);
  },
};
