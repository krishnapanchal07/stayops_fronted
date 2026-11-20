import { entryExitStore } from '@/services/entryExit/entryExitStore';
import { leaveStore } from '@/services/leave/leaveStore';
import { notificationStore } from '@/services/notification/notificationStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import { EntryExitKind, EntryExitStatus } from '@/types/entryExit';
import {
  GatePassStatus,
  LeaveStatus,
  type GatePass,
  type LeaveActor,
  type LeaveFilters,
  type LeaveFormValues,
  type LeaveRequest,
  type LeaveType,
} from '@/types/leave';
import {
  canTransitionLeaveStatus,
  canVerifyGatePass,
  emptyLeaveFilters,
  filterLeaveRequests,
  isApprovedLeaveOverlapping,
  isPendingLeaveOverlapping,
  isReturnOverdue,
  leaveReturn,
  leaveStart,
  summarizeLeaveRequests,
} from '@/utils/leaveRules';
import { validateLeaveForm } from '@/utils/leaveValidation';
import { validateRejectionReason } from '@/utils/visitorValidation';

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

function nextLeaveCode(values: string[]): string {
  const numbers = values.map((value) => Number.parseInt(value.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `LV-${(numbers.length ? Math.max(...numbers) : 2000) + 1}`;
}

function nextPassCode(values: string[]): string {
  const numbers = values.map((value) => Number.parseInt(value.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `GP-${(numbers.length ? Math.max(...numbers) : 2000) + 1}`;
}

function evaluatePass(pass: GatePass, now = new Date()): GatePass {
  if (pass.status !== GatePassStatus.ACTIVE) return pass;
  if (now.getTime() <= new Date(pass.expectedReturnDateTime).getTime()) return pass;
  const leave = leaveStore.get(pass.leaveId);
  if (leave?.status === LeaveStatus.APPROVED && !entryExitStore.byLeave(leave.id)) {
    const expired = leaveStore.persistPass({ ...pass, status: GatePassStatus.EXPIRED });
    if (canTransitionLeaveStatus(leave.status, LeaveStatus.EXPIRED)) {
      leaveStore.persist({ ...leave, status: LeaveStatus.EXPIRED, updatedAt: nowIso() });
    }
    return expired;
  }
  return pass;
}

function evaluateLeave(leave: LeaveRequest): LeaveRequest {
  if (leave.gatePassId) {
    const pass = leaveStore.getPass(leave.gatePassId);
    if (pass) evaluatePass(pass);
  }
  return leaveStore.get(leave.id) ?? leave;
}

function evaluateLeaves(propertyIds?: string[]): LeaveRequest[] {
  return leaveStore
    .list()
    .map((leave) => evaluateLeave(leave))
    .filter((leave) => !propertyIds?.length || propertyIds.includes(leave.propertyId));
}

function evaluatePasses(propertyIds?: string[]): GatePass[] {
  return leaveStore
    .listPasses()
    .map((pass) => evaluatePass(pass))
    .filter((pass) => !propertyIds?.length || propertyIds.includes(pass.propertyId));
}

function createPassForLeave(leave: LeaveRequest): GatePass {
  const existing = leave.gatePassId ? leaveStore.getPass(leave.gatePassId) : undefined;
  if (existing) return existing;
  const createdAt = nowIso();
  const pass = leaveStore.insertPass({
    id: `gp-${Date.now().toString(36)}`,
    passCode: nextPassCode(leaveStore.listPasses().map((item) => item.passCode)),
    leaveId: leave.id,
    tenantId: leave.tenantId,
    tenantName: leave.tenantName,
    propertyId: leave.propertyId,
    propertyName: leave.propertyName,
    roomNumber: leave.roomNumber,
    startDateTime: leaveStart(leave).toISOString(),
    expectedReturnDateTime: leaveReturn(leave).toISOString(),
    status: GatePassStatus.ACTIVE,
    createdAt,
  });
  leaveStore.persist({ ...leave, gatePassId: pass.id, updatedAt: createdAt });
  return pass;
}

export const leaveService = {
  getLeaveRequests(propertyIds?: string[]): Promise<LeaveRequest[]> {
    return wait(evaluateLeaves(propertyIds));
  },

  getLeaveById(id: string): Promise<LeaveRequest> {
    const leave = leaveStore.get(id);
    if (!leave) return reject('Leave request not found.');
    return wait(evaluateLeave(leave));
  },

  getMyLeaveRequests(tenantId: string): Promise<LeaveRequest[]> {
    return wait(evaluateLeaves().filter((leave) => leave.tenantId === tenantId));
  },

  getMyLeaveById(id: string, tenantId: string): Promise<LeaveRequest> {
    const leave = leaveStore.get(id);
    if (!leave || leave.tenantId !== tenantId) return reject('You can only view your own leave requests.');
    return wait(evaluateLeave(leave));
  },

  searchLeaveRequests(filters: LeaveFilters, propertyIds?: string[]): Promise<LeaveRequest[]> {
    return wait(filterLeaveRequests(evaluateLeaves(propertyIds), filters));
  },

  getLeaveSummary(tenantId?: string, propertyIds?: string[]) {
    let items = evaluateLeaves(propertyIds);
    if (tenantId) items = items.filter((leave) => leave.tenantId === tenantId);
    const summary = summarizeLeaveRequests(items);
    summary.currentlyOut = evaluatePasses(propertyIds).filter((pass) => pass.status === GatePassStatus.USED && Boolean(entryExitStore.byLeave(pass.leaveId))).length;
    return wait(summary);
  },

  async createLeaveRequest(tenantId: string, values: LeaveFormValues): Promise<LeaveRequest> {
    const tenant = tenantStore.get(tenantId);
    if (!tenant) return reject('Tenant profile not found.');
    if (!tenant.propertyId || !tenant.roomId || !tenant.roomNumber || !tenant.propertyName) {
      return reject('Leave requests require an active room allocation.');
    }
    const errors = validateLeaveForm(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to submit leave request.');
    const existing = evaluateLeaves();
    if (
      isApprovedLeaveOverlapping(
        existing,
        tenantId,
        values.startDate,
        values.startTime,
        values.expectedReturnDate,
        values.expectedReturnTime,
      )
    ) {
      return reject('This leave overlaps an already approved leave request.');
    }

    const createdAt = nowIso();
    const record: LeaveRequest = {
      id: `leave-${Date.now().toString(36)}`,
      leaveCode: nextLeaveCode(existing.map((item) => item.leaveCode)),
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      propertyId: tenant.propertyId,
      propertyName: tenant.propertyName,
      roomId: tenant.roomId,
      roomNumber: tenant.roomNumber,
      leaveType: values.leaveType as LeaveType,
      startDate: values.startDate,
      startTime: values.startTime,
      expectedReturnDate: values.expectedReturnDate,
      expectedReturnTime: values.expectedReturnTime,
      reason: values.reason.trim(),
      status: LeaveStatus.PENDING,
      approvedBy: null,
      approvedByName: null,
      approvedAt: null,
      rejectedReason: null,
      gatePassId: null,
      createdAt,
      updatedAt: createdAt,
    };
    leaveStore.insert(record);
    notificationStore.push({
      title: 'Leave submitted',
      description: `${record.leaveCode}: ${record.reason}`,
      tone: 'info',
    });
    return wait(record);
  },

  async updateLeaveRequest(id: string, data: Partial<LeaveFormValues>, tenantId?: string): Promise<LeaveRequest> {
    const current = leaveStore.get(id);
    if (!current) return reject('Leave request not found.');
    if (tenantId && current.tenantId !== tenantId) return reject('You can only update your own leave requests.');
    if (current.status !== LeaveStatus.PENDING) return reject('Only pending leave requests can be edited.');
    const merged: LeaveFormValues = {
      leaveType: data.leaveType ?? current.leaveType,
      startDate: data.startDate ?? current.startDate,
      startTime: data.startTime ?? current.startTime,
      expectedReturnDate: data.expectedReturnDate ?? current.expectedReturnDate,
      expectedReturnTime: data.expectedReturnTime ?? current.expectedReturnTime,
      reason: data.reason ?? current.reason,
    };
    const errors = validateLeaveForm(merged);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to update leave request.');
    return wait(
      leaveStore.persist({
        ...current,
        ...merged,
        leaveType: merged.leaveType as LeaveType,
        reason: merged.reason.trim(),
        updatedAt: nowIso(),
      }),
    );
  },

  async approveLeave(id: string, actor: LeaveActor): Promise<{ leave: LeaveRequest; gatePass: GatePass }> {
    const current = evaluateLeave(leaveStore.get(id) ?? ({} as LeaveRequest));
    if (!current.id) return reject('Leave request not found.');
    if (!canTransitionLeaveStatus(current.status, LeaveStatus.APPROVED)) {
      return reject('This leave request cannot be approved.');
    }
    if (
      isApprovedLeaveOverlapping(
        evaluateLeaves(),
        current.tenantId,
        current.startDate,
        current.startTime,
        current.expectedReturnDate,
        current.expectedReturnTime,
        current.id,
      )
    ) {
      return reject('This leave overlaps another approved leave for the same tenant.');
    }
    const approved = leaveStore.persist({
      ...current,
      status: LeaveStatus.APPROVED,
      approvedBy: actor.id,
      approvedByName: actor.name,
      approvedAt: nowIso(),
      rejectedReason: null,
      updatedAt: nowIso(),
    });
    const gatePass = createPassForLeave(approved);
    const leave = leaveStore.get(approved.id) ?? approved;
    notificationStore.push({
      title: 'Leave approved',
      description: `${leave.leaveCode} approved. Gate pass ${gatePass.passCode} generated.`,
      tone: 'success',
    });
    notificationStore.push({
      title: 'Gate pass generated',
      description: `${gatePass.passCode} for ${leave.tenantName} · Room ${leave.roomNumber}.`,
      tone: 'info',
    });
    notificationStore.push({
      title: 'Gate pass expected',
      description: `${leave.tenantName} may exit with ${gatePass.passCode}.`,
      tone: 'info',
    });
    return wait({ leave, gatePass });
  },

  async rejectLeave(id: string, reason: string, actor: LeaveActor): Promise<LeaveRequest> {
    const current = leaveStore.get(id);
    if (!current) return reject('Leave request not found.');
    const reasonError = validateRejectionReason(reason);
    if (reasonError) return reject(reasonError);
    if (!canTransitionLeaveStatus(current.status, LeaveStatus.REJECTED)) {
      return reject('This leave request cannot be rejected.');
    }
    const updated = leaveStore.persist({
      ...current,
      status: LeaveStatus.REJECTED,
      rejectedReason: reason.trim(),
      approvedBy: actor.id,
      approvedByName: actor.name,
      approvedAt: nowIso(),
      updatedAt: nowIso(),
    });
    notificationStore.push({
      title: 'Leave rejected',
      description: `${updated.leaveCode} was rejected.`,
      tone: 'warning',
    });
    return wait(updated);
  },

  async cancelLeave(id: string, tenantId?: string): Promise<LeaveRequest> {
    const current = leaveStore.get(id);
    if (!current) return reject('Leave request not found.');
    if (tenantId && current.tenantId !== tenantId) return reject('You can only cancel your own leave requests.');
    if (!canTransitionLeaveStatus(current.status, LeaveStatus.CANCELLED)) {
      return reject('This leave request cannot be cancelled.');
    }
    if (current.gatePassId) {
      const pass = leaveStore.getPass(current.gatePassId);
      if (pass && pass.status === GatePassStatus.ACTIVE) {
        leaveStore.persistPass({ ...pass, status: GatePassStatus.CANCELLED });
      }
    }
    return wait(leaveStore.persist({ ...current, status: LeaveStatus.CANCELLED, updatedAt: nowIso() }));
  },

  async createGatePass(id: string): Promise<GatePass> {
    const current = evaluateLeave(leaveStore.get(id) ?? ({} as LeaveRequest));
    if (!current.id) return reject('Leave request not found.');
    if (current.status !== LeaveStatus.APPROVED) return reject('A gate pass can only be created for approved leave.');
    const pass = createPassForLeave(current);
    notificationStore.push({
      title: 'Gate pass generated',
      description: `${pass.passCode} for ${current.tenantName}.`,
      tone: 'info',
    });
    return wait(pass);
  },

  async getGatePass(id: string): Promise<GatePass> {
    const pass = leaveStore.getPass(id) ?? leaveStore.findPassByCode(id);
    if (!pass) {
      const leave = leaveStore.get(id);
      if (leave?.gatePassId) {
        const linked = leaveStore.getPass(leave.gatePassId);
        if (linked) return wait(evaluatePass(linked));
      }
      return reject('Gate pass not found.');
    }
    return wait(evaluatePass(pass));
  },

  getGatePasses(propertyIds?: string[]): Promise<GatePass[]> {
    return wait(evaluatePasses(propertyIds));
  },

  async verifyGatePass(code: string, propertyIds?: string[]): Promise<GatePass> {
    const pass = leaveStore.findPassByCode(code);
    if (!pass) return reject('Gate pass not found.');
    if (propertyIds?.length && !propertyIds.includes(pass.propertyId)) {
      return reject('This gate pass is not valid at this property.');
    }
    const current = evaluatePass(pass);
    const invalid = canVerifyGatePass(current);
    if (invalid) return reject(invalid);
    return wait(current);
  },

  async recordExit(passId: string, actor: LeaveActor, propertyIds?: string[]): Promise<GatePass> {
    const pass = leaveStore.getPass(passId) ?? leaveStore.findPassByCode(passId);
    if (!pass) return reject('Gate pass not found.');
    if (propertyIds?.length && !propertyIds.includes(pass.propertyId)) {
      return reject('This gate pass is not valid at this property.');
    }
    const current = evaluatePass(pass);
    if (current.status !== GatePassStatus.ACTIVE) return reject('Only an active gate pass can be used to exit.');
    const leave = leaveStore.get(current.leaveId);
    if (!leave) return reject('Linked leave request was not found.');
    const exitAt = nowIso();
    const used = leaveStore.persistPass({ ...current, status: GatePassStatus.USED });
    entryExitStore.insert({
      id: `log-${Date.now().toString(36)}`,
      kind: EntryExitKind.LEAVE,
      passCode: used.passCode,
      visitorId: null,
      leaveId: leave.id,
      tenantId: leave.tenantId,
      tenantName: leave.tenantName,
      propertyId: leave.propertyId,
      propertyName: leave.propertyName,
      roomNumber: leave.roomNumber,
      personName: leave.tenantName,
      entryAt: null,
      exitAt,
      returnAt: null,
      status: EntryExitStatus.OUT,
      recordedBy: actor.id,
      recordedByName: actor.name,
      createdAt: exitAt,
    });
    return wait(used);
  },

  async recordReturn(passId: string, actor: LeaveActor, propertyIds?: string[]): Promise<{ leave: LeaveRequest; gatePass: GatePass }> {
    const pass = leaveStore.getPass(passId) ?? leaveStore.findPassByCode(passId);
    if (!pass) return reject('Gate pass not found.');
    if (propertyIds?.length && !propertyIds.includes(pass.propertyId)) {
      return reject('This gate pass is not valid at this property.');
    }
    if (pass.status !== GatePassStatus.USED) return reject('Record the exit before recording a return.');
    const leave = leaveStore.get(pass.leaveId);
    if (!leave) return reject('Linked leave request was not found.');
    if (!canTransitionLeaveStatus(leave.status, LeaveStatus.COMPLETED) && leave.status !== LeaveStatus.APPROVED) {
      return reject('This leave cannot be marked completed.');
    }
    const returnAt = nowIso();
    const openLog = entryExitStore.byLeave(leave.id);
    if (openLog) {
      entryExitStore.persist({
        ...openLog,
        returnAt,
        status: EntryExitStatus.COMPLETED,
        recordedBy: actor.id,
        recordedByName: actor.name,
      });
    }
    const completed = leaveStore.persist({
      ...leave,
      status: LeaveStatus.COMPLETED,
      updatedAt: returnAt,
    });
    notificationStore.push({
      title: 'Return recorded',
      description: `${completed.tenantName} returned from ${completed.leaveCode}.`,
      tone: 'success',
    });
    return wait({ leave: completed, gatePass: pass });
  },

  async markLeaveCompleted(id: string, actor: LeaveActor): Promise<LeaveRequest> {
    const current = leaveStore.get(id);
    if (!current) return reject('Leave request not found.');
    if (current.gatePassId) {
      const result = await this.recordReturn(current.gatePassId, actor);
      return result.leave;
    }
    if (!canTransitionLeaveStatus(current.status, LeaveStatus.COMPLETED)) {
      return reject('This leave cannot be marked completed.');
    }
    return wait(leaveStore.persist({ ...current, status: LeaveStatus.COMPLETED, updatedAt: nowIso() }));
  },

  getCurrentlyOut(propertyIds?: string[]): Promise<Array<GatePass & { overdue: boolean; exitAt: string | null }>> {
    const out = evaluatePasses(propertyIds)
      .filter((pass) => pass.status === GatePassStatus.USED)
      .map((pass) => {
        const log = entryExitStore.byLeave(pass.leaveId);
        return {
          ...pass,
          overdue: isReturnOverdue(pass),
          exitAt: log?.exitAt ?? null,
        };
      })
      .filter((pass) => Boolean(entryExitStore.byLeave(pass.leaveId)));
    return wait(out);
  },

  hasPendingOverlap(
    tenantId: string,
    values: Pick<LeaveFormValues, 'startDate' | 'startTime' | 'expectedReturnDate' | 'expectedReturnTime'>,
    ignoreId?: string,
  ): boolean {
    return isPendingLeaveOverlapping(
      leaveStore.list(),
      tenantId,
      values.startDate,
      values.startTime,
      values.expectedReturnDate,
      values.expectedReturnTime,
      ignoreId,
    );
  },

  emptyFilters: emptyLeaveFilters,
};
