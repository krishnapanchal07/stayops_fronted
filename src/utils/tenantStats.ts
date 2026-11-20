import { TenantStatus, type Tenant, type TenantFilters, type TenantSummary } from '@/types/tenant';

export function tenantFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim();
}

export function summarizeTenants(tenants: Tenant[]): TenantSummary {
  return {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((tenant) => tenant.status === TenantStatus.ACTIVE).length,
    onboardingTenants: tenants.filter((tenant) => tenant.status === TenantStatus.ONBOARDING).length,
    noticePeriodTenants: tenants.filter((tenant) => tenant.status === TenantStatus.NOTICE_PERIOD).length,
    checkedOutTenants: tenants.filter((tenant) => tenant.status === TenantStatus.CHECKED_OUT).length,
  };
}

export function filterTenants(tenants: Tenant[], filters: TenantFilters): Tenant[] {
  const query = filters.query.trim().toLowerCase();
  const now = new Date();
  const cutoff =
    filters.moveInPeriod === '30'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      : filters.moveInPeriod === '90'
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
        : filters.moveInPeriod === 'YEAR'
          ? new Date(now.getFullYear(), 0, 1)
          : null;

  return tenants.filter((tenant) => {
    const matchesQuery =
      !query ||
      tenant.fullName.toLowerCase().includes(query) ||
      tenant.tenantCode.toLowerCase().includes(query) ||
      tenant.phone.replace(/\D/g, '').includes(query.replace(/\D/g, '')) ||
      tenant.email.toLowerCase().includes(query) ||
      (tenant.roomNumber ?? '').toLowerCase().includes(query);

    const matchesProperty = !filters.propertyId || tenant.propertyId === filters.propertyId;
    const matchesBuilding = !filters.buildingId || tenant.buildingId === filters.buildingId;
    const matchesFloor = !filters.floorId || tenant.floorId === filters.floorId;
    const matchesRoom = !filters.roomId || tenant.roomId === filters.roomId;
    const matchesStatus = !filters.status || tenant.status === filters.status;
    const matchesMoveIn =
      !cutoff ||
      (Boolean(tenant.moveInDate) && new Date(`${tenant.moveInDate}T00:00:00`) >= cutoff);

    return (
      matchesQuery &&
      matchesProperty &&
      matchesBuilding &&
      matchesFloor &&
      matchesRoom &&
      matchesStatus &&
      matchesMoveIn
    );
  });
}

export function isUnassignedTenant(tenant: Tenant): boolean {
  return !tenant.bedId && tenant.status !== TenantStatus.CHECKED_OUT && tenant.status !== TenantStatus.INACTIVE;
}

export function emptyAllocation() {
  return {
    propertyId: null,
    propertyName: null,
    buildingId: null,
    buildingName: null,
    floorId: null,
    floorName: null,
    roomId: null,
    roomNumber: null,
    bedId: null,
    bedLabel: null,
    roomRent: null,
    moveInDate: null,
  };
}
