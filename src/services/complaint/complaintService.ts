/* eslint @typescript-eslint/no-unused-vars: ["error", {"argsIgnorePattern": "^_"}] -- Existing callers retain their arguments; the server derives identity. */
import { financeUrl, type FinancePage } from '@/services/finance/api';
import { workflowList, workflowRequest } from '@/services/http/workflows';
import { httpClient } from '@/services/http/client';
import type { Complaint, ComplaintComment, ComplaintEvent, ComplaintFormValues, ComplaintPriority, ComplaintStatus, ComplaintSummary, StaffOption } from '@/types/complaint';
import type { MaintenanceTask } from '@/types/maintenance';

export interface ComplaintActor { id: string; name: string; role: string }
export interface ComplaintTenantOption { id: string; name: string; propertyName: string; roomId: string; roomNumber: string }

const path = (id: string, suffix = '') => `/complaints/${encodeURIComponent(id)}${suffix}`;
const get = (id: string) => workflowRequest<Complaint>('get', path(id));
const getAttachment = async (id: string, attachmentId: string) =>
  (await httpClient.get<Blob>(path(id, `/attachments/${encodeURIComponent(attachmentId)}`), { responseType: 'blob' })).data;
const submissions = new WeakMap<ComplaintFormValues, string>();

export const complaintService = {
  getRecentComplaints: async () => (await workflowRequest<FinancePage<Complaint>>('get', '/complaints?limit=4&sortBy=updatedAt')).items,
  getComplaintById: get,
  getComplaintSummary: () =>
    workflowRequest<ComplaintSummary>('get', '/complaints/summary'),
  getComments: (id: string, _includeInternal: boolean) => workflowRequest<ComplaintComment[]>('get', path(id, '/comments')),
  getTimeline: (id: string) => workflowRequest<ComplaintEvent[]>('get', path(id, '/timeline')),
  getMaintenanceStaff: (propertyId = '') => workflowList<StaffOption>(
    `/complaints/options/staff?${new URLSearchParams({ propertyId })}`),
  getEligibleTenants: (options: { propertyId: string; buildingId: string; floorId: string; roomId: string }) =>
    workflowList<ComplaintTenantOption>(financeUrl('/complaints/options/tenants', options)),
  async createComplaint(values: ComplaintFormValues, _actor: ComplaintActor) {
    const { attachments, ...payload } = values;
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    for (const item of attachments) if (item.file) form.append('files', item.file);
    const key = submissions.get(values) ?? crypto.randomUUID();
    submissions.set(values, key);
    return workflowRequest<Complaint>('post', '/complaints', form, { 'Idempotency-Key': key, 'Content-Type': 'multipart/form-data' });
  },
  changeComplaintStatus: (id: string, status: ComplaintStatus, actor: ComplaintActor) => {
    if (status === 'CLOSED') return complaintService.closeComplaint(id, actor);
    return workflowRequest<Complaint>('patch', path(id, '/status'), { status });
  },
  assignComplaint: (id: string, staffId: string, { priority, dueAt, estimatedCost }: { priority?: ComplaintPriority; dueAt?: string; estimatedCost?: number | null; actor: ComplaintActor }) =>
    workflowRequest<{ complaint: Complaint; task: MaintenanceTask }>('post', path(id, '/assign'), { staffId, priority, dueAt, estimatedCost }),
  addComplaintComment: (id: string, message: string, _actor: ComplaintActor) =>
    workflowRequest<ComplaintComment>('post', path(id, '/comments'), { message, visibility: 'PUBLIC' }),
  addInternalNote: (id: string, message: string, _actor: ComplaintActor) =>
    workflowRequest<ComplaintComment>('post', path(id, '/comments'), { message, visibility: 'INTERNAL' }),
  escalateComplaint: (id: string, reason: string, _actor: ComplaintActor) =>
    workflowRequest<Complaint>('post', path(id, '/escalate'), { reason }),
  resolveComplaint: (id: string, resolutionNotes: string, _actor: ComplaintActor, actualCost?: number) =>
    workflowRequest<Complaint>('post', path(id, '/resolve'), { resolutionNotes, actualCost }),
  closeComplaint: (id: string, _actor: ComplaintActor) => workflowRequest<Complaint>('post', path(id, '/close')),
  reopenComplaint: (id: string, _actor: ComplaintActor) => workflowRequest<Complaint>('post', path(id, '/reopen')),
  getAttachment,
  async downloadAttachment(id: string, attachmentId: string, fileName: string) {
    const url = URL.createObjectURL(await getAttachment(id, attachmentId));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName.replace(/\.[^.]+$/, '') + '.webp';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
