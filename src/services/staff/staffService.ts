import { workflowList, workflowRequest } from '@/services/http/workflows';
import { StaffStatus, type Staff, type StaffFilters, type StaffFormValues, type StaffSummary } from '@/types/staff';

export interface StaffPage { items: Staff[]; total: number; offset: number; limit: number }
export interface StaffAccountCandidate { id: string; name: string; email: string; role: Staff['role'] }
export interface StaffPageOptions { offset?: number; limit?: number; sortBy?: string; sortDirection?: 'asc' | 'desc' }
function parameters(filters?: Partial<StaffFilters>, options?: StaffPageOptions) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...options })) {
    if (value !== '' && value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}
function normalized(values: StaffFormValues) {
  return { ...values, email: values.email.trim().toLowerCase(), phone: values.phone.replace(/\D/g, ''),
    emergencyPhone: values.emergencyPhone.replace(/\D/g, '') };
}
export const staffService = {
  getStaff(): Promise<Staff[]> { return workflowList('/staff'); },
  getStaffPage(filters: Partial<StaffFilters> = {}, options: StaffPageOptions = {}): Promise<StaffPage> {
    return workflowRequest('get', `/staff?${parameters(filters, options)}`);
  },
  getStaffById(id: string): Promise<Staff> { return workflowRequest('get', `/staff/${encodeURIComponent(id)}`); },
  searchStaff(filters: StaffFilters): Promise<Staff[]> { return workflowList(`/staff?${parameters(filters)}`); },
  getStaffSummary(): Promise<StaffSummary> { return workflowRequest('get', '/staff/summary'); },
  getAssignableProperties(): Promise<{ id: string; name: string }[]> { return workflowRequest('get', '/staff/properties'); },
  findExistingAccount(email: string): Promise<StaffAccountCandidate> {
    return workflowRequest('get', `/staff/account-candidate?${new URLSearchParams({ email: email.trim().toLowerCase() })}`);
  },
  createStaff(values: StaffFormValues): Promise<Staff> { return workflowRequest('post', '/staff', normalized(values)); },
  updateStaff(id: string, values: StaffFormValues): Promise<Staff> {
    const payload: Record<string, unknown> = normalized(values);
    // Identity role/email cannot be changed through generic staff editing.
    delete payload.email;
    delete payload.role;
    delete payload.existingUserId;
    return workflowRequest('patch', `/staff/${encodeURIComponent(id)}`, payload);
  },
  changeStaffStatus(id: string, status: StaffStatus): Promise<Staff> { return workflowRequest('patch', `/staff/${encodeURIComponent(id)}/status`, { status }); },
  activateStaff(id: string): Promise<Staff> { return this.changeStaffStatus(id, StaffStatus.ACTIVE); },
  deactivateStaff(id: string): Promise<Staff> { return this.changeStaffStatus(id, StaffStatus.INACTIVE); },
  updateAssignments(id: string, propertyIds: string[]): Promise<Staff> { return workflowRequest('patch', `/staff/${encodeURIComponent(id)}/assignments`, { propertyIds }); },
  resendInvitation(id: string): Promise<{ message: string }> { return workflowRequest('post', `/staff/${encodeURIComponent(id)}/resend-invite`); },
  acceptInvitation(token: string): Promise<{ message: string }> { return workflowRequest('post', '/staff/accept-invitation', { token }); },
};
