import seedTenants from '@/mock/tenants.json';
import type { Tenant, TenantAllocationPatch } from '@/types/tenant';
import { TenantStatus } from '@/types/tenant';
import { emptyAllocation, isUnassignedTenant } from '@/utils/tenantStats';

let tenants = structuredClone(seedTenants) as Tenant[];

function clone<T>(value: T): T {
  return structuredClone(value);
}

export const tenantStore = {
  list(): Tenant[] {
    return clone(tenants);
  },

  get(id: string): Tenant | undefined {
    const tenant = tenants.find((item) => item.id === id);
    return tenant ? clone(tenant) : undefined;
  },

  insert(tenant: Tenant): Tenant {
    tenants = [tenant, ...tenants];
    return clone(tenant);
  },

  persist(next: Tenant): Tenant {
    tenants = tenants.map((tenant) => (tenant.id === next.id ? next : tenant));
    return clone(next);
  },

  remove(id: string): void {
    tenants = tenants.filter((tenant) => tenant.id !== id);
  },

  unassigned(): Tenant[] {
    return clone(tenants.filter(isUnassignedTenant));
  },

  applyAllocation(tenantId: string, patch: TenantAllocationPatch): Tenant | undefined {
    const current = tenants.find((tenant) => tenant.id === tenantId);
    if (!current) return undefined;

    const next: Tenant = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    if (
      patch.bedId &&
      (current.status === TenantStatus.PROSPECT || current.status === TenantStatus.ONBOARDING)
    ) {
      next.status = TenantStatus.ACTIVE;
    }
    tenants = tenants.map((tenant) => (tenant.id === tenantId ? next : tenant));
    return clone(next);
  },

  clearAllocation(tenantId: string): Tenant | undefined {
    const current = tenants.find((tenant) => tenant.id === tenantId);
    if (!current) return undefined;
    const next: Tenant = {
      ...current,
      ...emptyAllocation(),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    tenants = tenants.map((tenant) => (tenant.id === tenantId ? next : tenant));
    return clone(next);
  },
};
