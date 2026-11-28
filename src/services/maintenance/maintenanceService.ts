/* eslint @typescript-eslint/no-unused-vars: ["error", {"argsIgnorePattern": "^_"}] -- Existing callers retain their arguments; the server derives identity. */
import { workflowList, workflowRequest } from '@/services/http/workflows';
import type { ComplaintActor } from '@/services/complaint/complaintService';
import type { CompleteTaskValues, MaintenanceStatus, MaintenanceSummary, MaintenanceTask } from '@/types/maintenance';

const base = '/maintenance/tasks';
const path = (id: string, action = '') => `${base}/${encodeURIComponent(id)}${action}`;
const get = (id: string) => workflowRequest<MaintenanceTask>('get', path(id));

export const maintenanceService = {
  getMaintenanceTasks: () => workflowList<MaintenanceTask>(base),
  getMaintenanceTaskById: get,
  getMaintenanceTasksByStaff: (staffId: string) => workflowList<MaintenanceTask>(`${base}?${new URLSearchParams({ assignedTo: staffId })}`),
  getMyTaskById: (id: string, _staffId: string) => get(id),
  getMaintenanceSummary: (_staffId?: string) => workflowRequest<MaintenanceSummary>('get', `${base}/summary`),
  getTasksByComplaint: (complaintId: string) => workflowList<MaintenanceTask>(`${base}?${new URLSearchParams({ complaintId })}`),
  changeMaintenanceTaskStatus: (id: string, status: MaintenanceStatus, _actor: ComplaintActor) =>
    workflowRequest<MaintenanceTask>('patch', path(id, '/status'), { status }),
  startTask: (id: string, _actor: ComplaintActor) => workflowRequest<MaintenanceTask>('post', path(id, '/start')),
  completeMaintenanceTask: (id: string, values: CompleteTaskValues, _actor: ComplaintActor) =>
    workflowRequest<MaintenanceTask>('post', path(id, '/complete'), values),
};
