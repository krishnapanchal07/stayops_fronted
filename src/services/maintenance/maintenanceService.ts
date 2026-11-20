import { complaintService, type ComplaintActor } from '@/services/complaint/complaintService';
import { complaintStore } from '@/services/complaint/complaintStore';
import { maintenanceStore } from '@/services/maintenance/maintenanceStore';
import { notificationStore } from '@/services/notification/notificationStore';
import { ComplaintStatus } from '@/types/complaint';
import { MaintenanceStatus, type CompleteTaskValues, type MaintenanceFilters, type MaintenanceTask } from '@/types/maintenance';
import { canTransitionComplaintStatus } from '@/utils/complaintRules';
import {
  canCompleteMaintenanceTask,
  canStartMaintenanceTask,
  canTransitionMaintenanceStatus,
  filterMaintenanceTasks,
  summarizeMaintenanceTasks,
} from '@/utils/maintenanceRules';
import { validateCompleteTask } from '@/utils/complaintValidation';

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

export const maintenanceService = {
  getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    return wait(maintenanceStore.list());
  },

  getMaintenanceTaskById(id: string): Promise<MaintenanceTask> {
    const task = maintenanceStore.get(id);
    return task ? wait(task) : reject('Maintenance task not found.');
  },

  getMaintenanceTasksByStaff(staffId: string): Promise<MaintenanceTask[]> {
    return wait(maintenanceStore.list().filter((task) => task.assignedTo === staffId));
  },

  getMyTaskById(id: string, staffId: string): Promise<MaintenanceTask> {
    const task = maintenanceStore.get(id);
    if (!task || task.assignedTo !== staffId) return reject('You can only view tasks assigned to you.');
    return wait(task);
  },

  searchMaintenanceTasks(filters: MaintenanceFilters): Promise<MaintenanceTask[]> {
    return wait(filterMaintenanceTasks(maintenanceStore.list(), filters));
  },

  getMaintenanceSummary(staffId?: string) {
    const tasks = staffId ? maintenanceStore.list().filter((task) => task.assignedTo === staffId) : maintenanceStore.list();
    return wait(summarizeMaintenanceTasks(tasks));
  },

  getTasksByComplaint(complaintId: string): Promise<MaintenanceTask[]> {
    return wait(maintenanceStore.byComplaint(complaintId));
  },

  async changeMaintenanceTaskStatus(id: string, status: MaintenanceStatus, actor: ComplaintActor): Promise<MaintenanceTask> {
    const current = maintenanceStore.get(id);
    if (!current) return reject('Maintenance task not found.');
    if (!canTransitionMaintenanceStatus(current.status, status)) {
      return reject('This status change is not allowed.');
    }
    const updated = maintenanceStore.persist({
      ...current,
      status,
      updatedAt: nowIso(),
      completedAt: status === MaintenanceStatus.COMPLETED ? nowIso() : current.completedAt,
    });
    if (status === MaintenanceStatus.IN_PROGRESS) {
      const complaint = complaintStore.get(current.complaintId);
      if (
        complaint &&
        complaint.status !== ComplaintStatus.IN_PROGRESS &&
        canTransitionComplaintStatus(complaint.status, ComplaintStatus.IN_PROGRESS)
      ) {
        await complaintService.changeComplaintStatus(complaint.id, ComplaintStatus.IN_PROGRESS, actor);
      }
      notificationStore.push({
        title: 'Maintenance started',
        description: `${updated.taskCode} is now in progress.`,
        tone: 'info',
      });
    }
    return wait(updated);
  },

  async startTask(id: string, actor: ComplaintActor): Promise<MaintenanceTask> {
    const current = maintenanceStore.get(id);
    if (!current) return reject('Maintenance task not found.');
    if (!canStartMaintenanceTask(current.status)) return reject('This task cannot be started.');
    const next = current.status === MaintenanceStatus.PENDING ? MaintenanceStatus.ASSIGNED : MaintenanceStatus.IN_PROGRESS;
    if (current.status === MaintenanceStatus.PENDING) {
      await this.changeMaintenanceTaskStatus(id, MaintenanceStatus.ASSIGNED, actor);
    }
    return this.changeMaintenanceTaskStatus(id, next === MaintenanceStatus.ASSIGNED ? MaintenanceStatus.IN_PROGRESS : next, actor);
  },

  async completeMaintenanceTask(id: string, values: CompleteTaskValues, actor: ComplaintActor): Promise<MaintenanceTask> {
    const current = maintenanceStore.get(id);
    if (!current) return reject('Maintenance task not found.');
    if (!canCompleteMaintenanceTask(current.status)) return reject('Start the task before marking it complete.');
    const errors = validateCompleteTask(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to complete task.');

    const updated = maintenanceStore.persist({
      ...current,
      status: MaintenanceStatus.COMPLETED,
      resolutionNotes: values.resolutionNotes.trim(),
      actualCost: values.actualCost,
      partsUsed: values.partsUsed.trim(),
      completedAt: values.completedAt || nowIso(),
      updatedAt: nowIso(),
    });
    await complaintService.resolveComplaint(current.complaintId, values.resolutionNotes, actor, values.actualCost);
    notificationStore.push({
      title: 'Task completed',
      description: `${updated.taskCode} marked complete. Linked complaint is resolved.`,
      tone: 'success',
    });
    return wait(updated);
  },
};
