import { complaintService } from '@/services/complaint/complaintService';
import { financeService } from '@/services/finance/financeService';
import { leaveService } from '@/services/leave/leaveService';
import { visitorService } from '@/services/visitor/visitorService';
import { propertyService } from '@/services/property/propertyService';
import { tenantStore } from '@/services/tenant/tenantStore';
import { roomService } from '@/services/room/roomService';
import { BedStatus } from '@/types/room';
import type { RoommateInfo, TenantProfileFormValues } from '@/types/support';
import {
  TenantStatus,
  type Tenant,
  type TenantActivityEvent,
  type TenantComplaintsSummary,
  type TenantDocument,
  type TenantFilters,
  type TenantFormValues,
  type TenantLeaveSummary,
  type TenantPaymentsSummary,
  type TenantSummary,
  type TenantVisitorsSummary,
} from '@/types/tenant';
import { validateTenantProfileForm } from '@/utils/supportValidation';
import { emptyAllocation, filterTenants, summarizeTenants, tenantFullName } from '@/utils/tenantStats';
import { emptyTenantForm, validateTenantForm } from '@/utils/tenantValidation';

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function createId(prefix: string, value: string): string {
  return `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
}

function nextTenantCode(existing: Tenant[]): string {
  const numbers = existing.map((tenant) => Number.parseInt(tenant.tenantCode.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `TEN-${String(next).padStart(4, '0')}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildAddress(values: TenantFormValues) {
  if (!values.addressLine1.trim() && !values.city.trim()) return undefined;
  return {
    addressLine1: values.addressLine1.trim(),
    addressLine2: values.addressLine2.trim() || undefined,
    city: values.city.trim(),
    state: values.state.trim(),
    postalCode: values.postalCode.trim(),
    country: values.country.trim() || 'India',
  };
}

function buildEmergency(values: TenantFormValues) {
  if (!values.emergencyName.trim()) return undefined;
  return {
    name: values.emergencyName.trim(),
    relationship: values.emergencyRelationship.trim(),
    phone: values.emergencyPhone.replace(/\D/g, ''),
    email: values.emergencyEmail.trim() || undefined,
    address: values.emergencyAddress.trim() || undefined,
  };
}

async function locationFromForm(values: TenantFormValues) {
  if (values.roomId && values.bedId) {
    const room = await roomService.getRoomById(values.roomId);
    const bed = room.beds.find((item) => item.id === values.bedId);
    if (!bed) throw new Error('Selected bed was not found.');
    return {
      propertyId: room.propertyId,
      propertyName: room.propertyName,
      buildingId: room.buildingId,
      buildingName: room.buildingName,
      floorId: room.floorId,
      floorName: room.floorName,
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedId: bed.id,
      bedLabel: bed.label,
      roomRent: values.roomRent || bed.rent,
      moveInDate: values.moveInDate || today(),
    };
  }

  if (values.propertyId) {
    const property = await propertyService.getPropertyById(values.propertyId);
    const building = property.buildings.find((item) => item.id === values.buildingId);
    const floor = building?.floors.find((item) => item.id === values.floorId);
    return {
      ...emptyAllocation(),
      propertyId: property.id,
      propertyName: property.name,
      buildingId: building?.id ?? null,
      buildingName: building?.name ?? null,
      floorId: floor?.id ?? null,
      floorName: floor?.name ?? null,
    };
  }

  return emptyAllocation();
}

async function releaseOwnedBed(tenant: Tenant): Promise<void> {
  if (!tenant.roomId || !tenant.bedId) return;
  const bed = await roomService.findBed(tenant.roomId, tenant.bedId);
  if (!bed || bed.tenantId !== tenant.id) return;
  if (bed.status === BedStatus.OCCUPIED) {
    await roomService.releaseBed(tenant.roomId, tenant.bedId);
    return;
  }
  await roomService.updateBed(tenant.roomId, tenant.bedId, BedStatus.AVAILABLE);
}

async function occupyBed(tenant: Tenant): Promise<void> {
  if (!tenant.roomId || !tenant.bedId) return;
  const bed = await roomService.findBed(tenant.roomId, tenant.bedId);
  if (!bed) throw new Error('Selected bed was not found.');
  if (bed.tenantId === tenant.id && bed.status === BedStatus.OCCUPIED) return;
  if (bed.status !== BedStatus.AVAILABLE) {
    throw new Error('Selected bed is no longer available.');
  }
  await roomService.assignBed(tenant.roomId, tenant.bedId, {
    tenantId: tenant.id,
    tenantName: tenant.fullName,
    moveInDate: tenant.moveInDate ?? today(),
    rent: tenant.roomRent ?? bed.rent,
  });
}

async function syncBedAssignment(previous: Tenant | null, next: Tenant): Promise<void> {
  const allocationChanged = previous?.bedId !== next.bedId || previous?.roomId !== next.roomId;
  if (allocationChanged && previous) {
    await releaseOwnedBed(previous);
  }
  await occupyBed(next);
}

function toTenantRecord(id: string, tenantCode: string, values: TenantFormValues, allocation: Awaited<ReturnType<typeof locationFromForm>>, createdAt: string): Tenant {
  return {
    id,
    tenantCode,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    fullName: tenantFullName(values.firstName, values.lastName),
    email: values.email.trim(),
    phone: values.phone.replace(/\D/g, ''),
    dateOfBirth: values.dateOfBirth || undefined,
    gender: values.gender || undefined,
    profileImage: values.profileImage || undefined,
    ...allocation,
    securityDeposit: values.securityDeposit || null,
    expectedMoveOutDate: values.expectedMoveOutDate || null,
    actualMoveOutDate: values.status === TenantStatus.CHECKED_OUT ? today() : null,
    status: values.status,
    emergencyContact: buildEmergency(values),
    address: buildAddress(values),
    internalNotes: values.internalNotes.trim() || undefined,
    source: values.source,
    inquiryId: values.inquiryId.trim() || null,
    createdAt,
    updatedAt: today(),
  };
}

const featuredActivity: Record<string, TenantActivityEvent[]> = {
  'user-tenant': [
    {
      id: 'act-rahul-1',
      action: 'Tenant created',
      description: 'Rahul Sharma was added to Sunrise PG.',
      actor: 'John Doe',
      occurredAt: '2026-05-20T10:15:00',
    },
    {
      id: 'act-rahul-2',
      action: 'Room assigned',
      description: 'Assigned Room 205, Bed A.',
      actor: 'Suresh Nair',
      occurredAt: '2026-06-01T09:00:00',
    },
    {
      id: 'act-rahul-3',
      action: 'Rent payment recorded',
      description: '₹8,000 received for June rent.',
      actor: 'Meera Iyer',
      occurredAt: '2026-06-03T14:20:00',
    },
    {
      id: 'act-rahul-4',
      action: 'Complaint raised',
      description: 'Wi-Fi connectivity reported in Room 205.',
      actor: 'Rahul Sharma',
      occurredAt: '2026-07-12T18:40:00',
    },
    {
      id: 'act-rahul-5',
      action: 'Visitor approved',
      description: 'Weekend visitor pass approved for Sanjay Sharma.',
      actor: 'Suresh Nair',
      occurredAt: '2026-08-02T11:05:00',
    },
    {
      id: 'act-rahul-6',
      action: 'Notice published',
      description: 'Maintenance window shared with Floor 2 residents.',
      actor: 'Suresh Nair',
      occurredAt: '2026-08-20T08:30:00',
    },
  ],
};

function defaultActivity(tenant: Tenant): TenantActivityEvent[] {
  if (featuredActivity[tenant.id]) return featuredActivity[tenant.id];
  return [
    {
      id: `${tenant.id}-created`,
      action: 'Tenant created',
      description: `${tenant.fullName} was added to StayOps.`,
      actor: 'StayOps Admin',
      occurredAt: `${tenant.createdAt}T10:00:00`,
    },
    ...(tenant.roomId
      ? [
          {
            id: `${tenant.id}-assigned`,
            action: 'Room assigned',
            description: `Assigned Room ${tenant.roomNumber ?? ''}${tenant.bedLabel ? `, ${tenant.bedLabel}` : ''}.`,
            actor: 'StayOps Admin',
            occurredAt: `${tenant.moveInDate ?? tenant.updatedAt}T09:00:00`,
          },
        ]
      : []),
  ];
}

function defaultDocuments(tenant: Tenant): TenantDocument[] {
  return [
    {
      id: `${tenant.id}-id`,
      name: 'Identity Proof',
      type: 'Aadhaar / ID Proof',
      status: tenant.status === TenantStatus.PROSPECT ? 'PENDING' : 'VERIFIED',
      uploadedAt: tenant.createdAt,
    },
    {
      id: `${tenant.id}-agreement`,
      name: 'Rental Agreement',
      type: 'Rental Agreement',
      status: tenant.roomId ? 'UPLOADED' : 'PENDING',
      uploadedAt: tenant.moveInDate ?? tenant.createdAt,
    },
    {
      id: `${tenant.id}-address`,
      name: 'Address Proof',
      type: 'Address Proof',
      status: tenant.address ? 'VERIFIED' : 'PENDING',
      uploadedAt: tenant.createdAt,
    },
  ];
}

/**
 * Tenant reads/mutations go through this service so Phase 3 can
 * replace the in-memory store with Axios → FastAPI.
 */
function scopedTenants(propertyIds?: string[]): Tenant[] {
  const items = tenantStore.list();
  if (!propertyIds?.length) return items;
  return items.filter((tenant) => Boolean(tenant.propertyId && propertyIds.includes(tenant.propertyId)));
}

function requireTenant(id: string, propertyIds?: string[]): Tenant {
  const tenant = tenantStore.get(id);
  if (!tenant) throw new Error('Tenant not found.');
  if (propertyIds?.length && (!tenant.propertyId || !propertyIds.includes(tenant.propertyId))) {
    throw new Error('Tenant not found.');
  }
  return tenant;
}

export const tenantService = {
  getTenants(propertyIds?: string[]): Promise<Tenant[]> {
    return wait(scopedTenants(propertyIds));
  },

  getTenantById(id: string, propertyIds?: string[]): Promise<Tenant> {
    try {
      return wait(requireTenant(id, propertyIds));
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
  },

  searchTenants(filters: TenantFilters, propertyIds?: string[]): Promise<Tenant[]> {
    return wait(filterTenants(scopedTenants(propertyIds), filters));
  },

  getTenantSummary(propertyIds?: string[]): Promise<TenantSummary> {
    return wait(summarizeTenants(scopedTenants(propertyIds)));
  },

  getTenantActivity(id: string, propertyIds?: string[]): Promise<TenantActivityEvent[]> {
    try {
      return wait(defaultActivity(requireTenant(id, propertyIds)));
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
  },

  getTenantDocuments(id: string, propertyIds?: string[]): Promise<TenantDocument[]> {
    try {
      return wait(defaultDocuments(requireTenant(id, propertyIds)));
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
  },

  async getTenantPaymentsSummary(id: string, propertyIds?: string[]): Promise<TenantPaymentsSummary> {
    let tenant: Tenant;
    try {
      tenant = requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    const summary = await financeService.getTenantFinancialSummary(id);
    const month = new Date().toISOString().slice(0, 7);
    const monthOutstanding = summary.openInvoices
      .filter((invoice) => invoice.billingPeriod === month)
      .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
    return wait({
      monthlyRent: tenant.roomRent ?? 0,
      paidThisMonth: Math.max(0, summary.currentMonthCharges - monthOutstanding),
      outstanding: summary.currentDue,
      securityDeposit: summary.securityDeposit,
    });
  },

  async getTenantComplaintsSummary(id: string, propertyIds?: string[]): Promise<TenantComplaintsSummary> {
    try {
      requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    const summary = await complaintService.getComplaintSummary(id);
    const items = await complaintService.getComplaintsByTenant(id);
    const latest = [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    return wait({
      open: summary.open + summary.inProgress,
      resolved: summary.resolved,
      lastComplaint: latest?.title ?? null,
    });
  },

  async getTenantVisitorsSummary(id: string, propertyIds?: string[]): Promise<TenantVisitorsSummary> {
    try {
      requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    const [summary, items] = await Promise.all([
      visitorService.getVisitorSummary(id),
      visitorService.getVisitorsByTenant(id),
    ]);
    const latest = [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    return {
      total: items.length,
      upcoming: summary.upcoming,
      lastVisit: latest ? `${latest.visitorName} · ${latest.visitDate}` : null,
    };
  },

  async getTenantLeaveSummary(id: string, propertyIds?: string[]): Promise<TenantLeaveSummary> {
    try {
      requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    const [summary, items] = await Promise.all([
      leaveService.getLeaveSummary(id),
      leaveService.getMyLeaveRequests(id),
    ]);
    const latest = [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    return {
      pending: summary.pending,
      approved: summary.approved,
      lastLeave: latest ? `${latest.startDate} – ${latest.expectedReturnDate}` : null,
    };
  },

  getTenantRoom(id: string) {
    const tenant = tenantStore.get(id);
    if (!tenant) return reject('Tenant not found.');
    return tenant.roomId ? roomService.getRoomById(tenant.roomId) : wait(null);
  },

  getTenantBed(id: string) {
    const tenant = tenantStore.get(id);
    if (!tenant) return reject('Tenant not found.');
    if (!tenant.roomId || !tenant.bedId) return wait(null);
    return roomService.getBeds(tenant.roomId).then((beds) => beds.find((bed) => bed.id === tenant.bedId) ?? null);
  },

  getRoommates(id: string): Promise<RoommateInfo[]> {
    const tenant = tenantStore.get(id);
    if (!tenant) return reject('Tenant not found.');
    if (!tenant.roomId) return wait([]);
    const roommates = tenantStore
      .list()
      .filter(
        (item) =>
          item.id !== tenant.id &&
          item.roomId === tenant.roomId &&
          (item.status === TenantStatus.ACTIVE || item.status === TenantStatus.NOTICE_PERIOD),
      )
      .map((item) => ({
        id: item.id,
        fullName: item.fullName,
        profileImage: item.profileImage,
      }));
    return wait(roommates);
  },

  updateMyProfile(id: string, values: TenantProfileFormValues): Promise<Tenant> {
    const current = tenantStore.get(id);
    if (!current) return reject('Tenant not found.');
    const errors = validateTenantProfileForm(values);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to update profile.');
    }
    const next: Tenant = {
      ...current,
      phone: values.phone.replace(/\D/g, ''),
      profileImage: values.profileImage || undefined,
      address: {
        addressLine1: values.addressLine1.trim(),
        addressLine2: values.addressLine2.trim() || undefined,
        city: values.city.trim(),
        state: values.state.trim(),
        postalCode: values.postalCode.trim(),
        country: values.country.trim() || 'India',
      },
      emergencyContact: {
        name: values.emergencyName.trim(),
        relationship: values.emergencyRelationship.trim(),
        phone: values.emergencyPhone.replace(/\D/g, ''),
        email: values.emergencyEmail.trim() || undefined,
        address: values.emergencyAddress.trim() || undefined,
      },
      updatedAt: today(),
    };
    return wait(tenantStore.persist(next));
  },

  async createTenant(values: TenantFormValues): Promise<Tenant> {
    const current = tenantStore.list();
    const errors = validateTenantForm(values, current);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to save tenant.');
    }

    const allocation = await locationFromForm(values);
    const created = toTenantRecord(createId('tenant', values.email), nextTenantCode(current), values, allocation, today());
    tenantStore.insert(created);
    try {
      await syncBedAssignment(null, created);
    } catch (cause) {
      tenantStore.remove(created.id);
      throw cause;
    }
    return wait(tenantStore.persist(created));
  },

  createFromInquiry(input: {
    inquiryId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    propertyId: string;
    roomId?: string;
    bedId?: string;
    moveInDate?: string;
    roomRent?: number;
    securityDeposit?: number;
    notes?: string;
  }): Promise<Tenant> {
    const values: TenantFormValues = {
      ...emptyTenantForm(),
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      propertyId: input.propertyId,
      roomId: input.roomId ?? '',
      bedId: input.bedId ?? '',
      moveInDate: input.moveInDate ?? '',
      roomRent: input.roomRent ?? 0,
      securityDeposit: input.securityDeposit ?? 0,
      status: TenantStatus.ONBOARDING,
      source: 'INQUIRY',
      inquiryId: input.inquiryId,
      internalNotes: input.notes ?? `Converted from inquiry ${input.inquiryId}.`,
    };
    return this.createTenant(values);
  },

  async updateTenant(id: string, values: TenantFormValues, propertyIds?: string[]): Promise<Tenant> {
    let current: Tenant;
    try {
      current = requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    const errors = validateTenantForm(values, tenantStore.list(), id);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to save tenant.');
    }

    const allocation = await locationFromForm(values);
    const updated = toTenantRecord(id, current.tenantCode, values, allocation, current.createdAt);
    updated.inquiryId = values.inquiryId.trim() || current.inquiryId;
    try {
      await syncBedAssignment(current, updated);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Unable to save tenant.');
    }
    return wait(tenantStore.persist(updated));
  },

  activateTenant(id: string): Promise<Tenant> {
    return this.changeTenantStatus(id, TenantStatus.ACTIVE);
  },

  deactivateTenant(id: string): Promise<Tenant> {
    return this.changeTenantStatus(id, TenantStatus.INACTIVE);
  },

  async changeTenantStatus(id: string, status: TenantStatus, propertyIds?: string[]): Promise<Tenant> {
    let current: Tenant;
    try {
      current = requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    if (status === TenantStatus.ACTIVE && !current.bedId) {
      return reject('Assign a room and bed before marking this tenant active.');
    }

    const next: Tenant = {
      ...current,
      status,
      actualMoveOutDate: status === TenantStatus.CHECKED_OUT ? current.actualMoveOutDate ?? today() : current.actualMoveOutDate,
      updatedAt: today(),
    };

    if (status === TenantStatus.CHECKED_OUT && current.roomId && current.bedId) {
      await syncBedAssignment(current, { ...next, ...emptyAllocation() });
      return wait(tenantStore.persist({ ...next, ...emptyAllocation() }));
    }

    return wait(tenantStore.persist(next));
  },

  async assignTenant(
    id: string,
    input: { roomId: string; bedId: string; moveInDate: string; rent: number },
    propertyIds?: string[],
  ): Promise<Tenant> {
    let current: Tenant;
    try {
      current = requireTenant(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Tenant not found.');
    }
    const room = await roomService.getRoomById(input.roomId);
    const bed = room.beds.find((item) => item.id === input.bedId);
    if (!bed) return reject('Selected bed was not found.');
    const next: Tenant = {
      ...current,
      propertyId: room.propertyId,
      propertyName: room.propertyName,
      buildingId: room.buildingId,
      buildingName: room.buildingName,
      floorId: room.floorId,
      floorName: room.floorName,
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedId: bed.id,
      bedLabel: bed.label,
      roomRent: input.rent,
      moveInDate: input.moveInDate,
      status: current.status === TenantStatus.PROSPECT ? TenantStatus.ONBOARDING : current.status,
      updatedAt: today(),
    };
    await syncBedAssignment(current, next);
    return wait(tenantStore.persist(next));
  },

  checkoutTenant(): Promise<never> {
    return reject('Checkout workflow will include move-out date, dues, deposit settlement and room release in a later phase.');
  },
};

