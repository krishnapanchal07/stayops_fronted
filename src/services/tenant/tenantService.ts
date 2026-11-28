import { financeService } from '@/services/finance/financeService';
/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }] -- Legacy arguments are retained for callers; authorization comes from the API. */
import { workflowList, workflowRequest } from '@/services/http/workflows';
import { roomService } from '@/services/room/roomService';
import type { RoommateInfo, TenantProfileFormValues } from '@/types/profile';
import { TenantStatus, type Tenant, type TenantActivityEvent, type TenantFilters,
  type TenantFormValues, type TenantSummary, type TenantPaymentsSummary, type TenantComplaintsSummary } from '@/types/tenant';
import { filterTenants } from '@/utils/tenantStats';

function formPayload(values: TenantFormValues) {
  const { inquiryId: _inquiryId, ...data } = values;
  return { ...data, phone: data.phone.replace(/\D/g, ''), emergencyPhone: data.emergencyPhone.replace(/\D/g, ''),
    propertyId: data.propertyId || null, buildingId: data.buildingId || null, floorId: data.floorId || null,
    roomId: data.roomId || null, bedId: data.bedId || null, dateOfBirth: data.dateOfBirth || null,
    moveInDate: data.moveInDate || null, expectedMoveOutDate: data.expectedMoveOutDate || null };
}

export const tenantService = {
  async getAllocationRooms() {
    return roomService.getRooms();
  },
  getTenants(_propertyIds?: string[]): Promise<Tenant[]> { return workflowList('/tenants'); },
  getTenantById(id: string, _propertyIds?: string[]): Promise<Tenant> { return workflowRequest('get', `/tenants/${encodeURIComponent(id)}`); },
  getMyTenant(): Promise<Tenant | null> { return workflowRequest('get', '/tenants/me'); },
  async searchTenants(filters: TenantFilters, _propertyIds?: string[]): Promise<Tenant[]> {
    const items = await workflowList<Tenant>(`/tenants?${new URLSearchParams({ query: filters.query, propertyId: filters.propertyId, status: filters.status, roomId: filters.roomId })}`);
    return filterTenants(items, filters);
  },
  getTenantSummary(_propertyIds?: string[]): Promise<TenantSummary> { return workflowRequest('get', '/tenants/summary'); },
  getTenantActivity(id: string, _propertyIds?: string[]): Promise<TenantActivityEvent[]> { return workflowRequest('get', `/tenants/${encodeURIComponent(id)}/activity`); },
  async getTenantPaymentsSummary(id: string, _propertyIds?: string[]): Promise<TenantPaymentsSummary> { const [tenant, summary] = await Promise.all([this.getTenantById(id),financeService.getTenantFinancialSummary(id)]); return {monthlyRent:tenant.roomRent ?? 0,paidThisMonth:summary.currentMonthPaid,outstanding:summary.currentDue,securityDeposit:summary.securityDeposit}; },
  async getTenantComplaintsSummary(id: string): Promise<TenantComplaintsSummary> {
    const summary = await workflowRequest<{open: number; inProgress: number; resolved: number; lastComplaint: string | null}>(
      'get', `/complaints/summary?${new URLSearchParams({tenantId: id})}`);
    return { open: summary.open + summary.inProgress, resolved: summary.resolved, lastComplaint: summary.lastComplaint?.slice(0, 10) ?? null };
  },
  async getTenantRoom(_id: string) {
    const tenant = await this.getMyTenant();
    if (!tenant?.roomId) return null;
    const room = await roomService.getRoomById(tenant.roomId);
    return { ...room, monthlyRent: tenant.roomRent ?? room.monthlyRent };
  },
  async getTenantBed(_id: string) {
    const tenant = await this.getMyTenant();
    if (!tenant?.bedId || !tenant.roomId) return null;
    const room = await roomService.getRoomById(tenant.roomId);
    const bed = room.beds.find((item) => item.id === tenant.bedId);
    return bed ? { ...bed, status: 'OCCUPIED' as const, tenantId: tenant.id, tenantName: tenant.fullName,
      moveInDate: tenant.moveInDate, rent: tenant.roomRent ?? bed.rent } : null;
  },
  getRoommates(_id: string): Promise<RoommateInfo[]> { return Promise.resolve([]); },
  updateMyProfile(_id: string, values: TenantProfileFormValues): Promise<Tenant> {
    return workflowRequest('patch', '/tenants/me', { ...values, phone: values.phone.replace(/\D/g, ''), emergencyPhone: values.emergencyPhone.replace(/\D/g, '') });
  },
  createTenant(values: TenantFormValues): Promise<Tenant> { return workflowRequest('post', '/tenants', formPayload(values)); },
  updateTenant(id: string, values: TenantFormValues, _propertyIds?: string[]): Promise<Tenant> { return workflowRequest('patch', `/tenants/${encodeURIComponent(id)}`, formPayload(values)); },
  activateTenant(id: string): Promise<Tenant> { return this.changeTenantStatus(id, TenantStatus.ACTIVE); },
  deactivateTenant(id: string): Promise<Tenant> { return this.changeTenantStatus(id, TenantStatus.INACTIVE); },
  changeTenantStatus(id: string, status: TenantStatus, _propertyIds?: string[]): Promise<Tenant> { return workflowRequest('patch', `/tenants/${encodeURIComponent(id)}/status`, { status }); },
  assignTenant(id: string, input: { roomId: string; bedId: string; moveInDate: string; rent: number }, _propertyIds?: string[]): Promise<Tenant> {
    return workflowRequest('post', `/tenants/${encodeURIComponent(id)}/allocate`, { roomId: input.roomId, bedId: input.bedId, moveInDate: input.moveInDate });
  },
  checkoutTenant(id: string, moveOutDate: string): Promise<Tenant> { return workflowRequest('post', `/tenants/${encodeURIComponent(id)}/checkout`, { moveOutDate }); },
  inviteTenant(id: string): Promise<{ message: string }> { return workflowRequest('post', `/tenants/${encodeURIComponent(id)}/invite`); },
  acceptInvitation(token: string): Promise<Tenant> { return workflowRequest('post', '/tenants/accept-invitation', { token }); },
};
