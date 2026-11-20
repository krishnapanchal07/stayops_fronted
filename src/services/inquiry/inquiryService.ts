import { inquiryStore } from '@/services/inquiry/inquiryStore';
import { roomService } from '@/services/room/roomService';
import { tenantService } from '@/services/tenant/tenantService';
import { BedStatus } from '@/types/room';
import {
  InquiryStatus,
  type ConvertInquiryOptions,
  type Inquiry,
  type InquiryFilters,
  type InquiryFormValues,
  type InquirySummary,
} from '@/types/inquiry';
import type { Tenant } from '@/types/tenant';
import {
  appendStatusHistory,
  canChangeInquiryStatus,
  filterInquiries,
  hasOpenInquiryForBed,
  inquiryFullName,
  inquiryMatchesOwner,
  summarizeInquiries,
} from '@/utils/inquiryStats';
import { listingTitle } from '@/utils/roomListing';
import { validateInquiryForm } from '@/utils/inquiryValidation';

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string, value: string): string {
  return `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
}

export interface SubmitInquiryInput extends InquiryFormValues {
  roomId: string;
  bedId?: string;
  userId?: string | null;
  actor?: string;
}

/**
 * Inquiry reads/mutations go through this service so Phase 3 can
 * replace the in-memory store with Axios → FastAPI.
 */
function scopedInquiries(propertyIds?: string[]): Inquiry[] {
  const items = inquiryStore.list();
  if (!propertyIds?.length) return items;
  return items.filter((inquiry) => Boolean(inquiry.propertyId) && propertyIds.includes(inquiry.propertyId));
}

function requireInquiry(id: string, propertyIds?: string[]): Inquiry {
  const inquiry = inquiryStore.get(id);
  if (!inquiry) throw new Error('Inquiry not found.');
  if (propertyIds?.length && (!inquiry.propertyId || !propertyIds.includes(inquiry.propertyId))) {
    throw new Error('Inquiry not found.');
  }
  return inquiry;
}

export const inquiryService = {
  getInquiries(propertyIds?: string[]): Promise<Inquiry[]> {
    return wait(scopedInquiries(propertyIds));
  },

  getInquiryById(id: string, propertyIds?: string[]): Promise<Inquiry> {
    try {
      return wait(requireInquiry(id, propertyIds));
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Inquiry not found.');
    }
  },

  searchInquiries(filters: InquiryFilters, propertyIds?: string[]): Promise<Inquiry[]> {
    return wait(filterInquiries(scopedInquiries(propertyIds), filters));
  },

  getInquirySummary(propertyIds?: string[]): Promise<InquirySummary> {
    return wait(summarizeInquiries(scopedInquiries(propertyIds)));
  },

  getMyInquiries(email: string, userId?: string | null): Promise<Inquiry[]> {
    return wait(inquiryStore.list().filter((inquiry) => inquiryMatchesOwner(inquiry, email, userId)));
  },

  getMyInquiryById(id: string, email: string, userId?: string | null): Promise<Inquiry> {
    const inquiry = inquiryStore.get(id);
    if (!inquiry || !inquiryMatchesOwner(inquiry, email, userId)) {
      return reject('Inquiry not found.');
    }
    return wait(inquiry);
  },

  async submitInquiry(input: SubmitInquiryInput): Promise<Inquiry> {
    const errors = validateInquiryForm(input);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to submit inquiry.');
    }

    const room = await roomService.getRoomById(input.roomId);
    const bed = input.bedId ? room.beds.find((item) => item.id === input.bedId) : undefined;
    if (input.bedId && !bed) {
      return reject('Selected bed was not found.');
    }
    if (bed && bed.status !== BedStatus.AVAILABLE) {
      return reject('This bed is no longer available.');
    }

    const email = input.email.trim();
    const existing = inquiryStore.list();
    if (hasOpenInquiryForBed(existing, email, room.id, bed?.id ?? null)) {
      return reject('You already have an open inquiry for this bed.');
    }

    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const fullName = inquiryFullName(firstName, lastName);
    const id = createId('inq', email);
    const created: Inquiry = {
      id,
      firstName,
      lastName,
      fullName,
      email,
      phone: input.phone.replace(/\D/g, ''),
      userId: input.userId ?? null,
      propertyId: room.propertyId,
      propertyName: room.propertyName,
      roomId: room.id,
      roomNumber: room.roomNumber,
      bedId: bed?.id ?? null,
      bedNumber: bed?.bedNumber ?? null,
      listingTitle: bed ? listingTitle(room.roomNumber, bed.bedNumber) : room.roomNumber,
      sharingType: room.sharingType,
      monthlyRent: bed?.rent || room.monthlyRent,
      preferredMoveIn: input.preferredMoveIn || null,
      message: input.message.trim(),
      status: InquiryStatus.SUBMITTED,
      statusHistory: [
        {
          id: `${id}-h1`,
          from: null,
          to: InquiryStatus.SUBMITTED,
          actor: input.actor?.trim() || fullName,
          occurredAt: new Date().toISOString().slice(0, 19),
        },
      ],
      tenantId: null,
      createdAt: today(),
      updatedAt: today(),
    };

    return wait(inquiryStore.insert(created));
  },

  changeInquiryStatus(
    id: string,
    status: InquiryStatus,
    actor: string,
    note?: string,
    propertyIds?: string[],
  ): Promise<Inquiry> {
    let current: Inquiry;
    try {
      current = requireInquiry(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Inquiry not found.');
    }
    if (current.status === status) return wait(current);
    if (!canChangeInquiryStatus(current.status, status)) {
      return reject('This status change is not allowed.');
    }

    return wait(
      inquiryStore.persist({
        ...current,
        status,
        statusHistory: appendStatusHistory(current, status, actor, note),
        updatedAt: today(),
      }),
    );
  },

  async withdrawInquiry(id: string, email: string, userId?: string | null, actor?: string): Promise<Inquiry> {
    const current = inquiryStore.get(id);
    if (!current || !inquiryMatchesOwner(current, email, userId)) {
      return reject('Inquiry not found.');
    }
    return this.changeInquiryStatus(id, InquiryStatus.WITHDRAWN, actor?.trim() || current.fullName, 'Withdrawn by the inquirer.');
  },

  async convertInquiryToTenant(
    id: string,
    options: ConvertInquiryOptions,
    propertyIds?: string[],
  ): Promise<{ inquiry: Inquiry; tenant: Tenant }> {
    let current: Inquiry;
    try {
      current = requireInquiry(id, propertyIds);
    } catch (cause) {
      return reject(cause instanceof Error ? cause.message : 'Inquiry not found.');
    }
    if (current.status === InquiryStatus.CONVERTED || current.tenantId) {
      return reject('This inquiry has already been converted.');
    }
    if (current.status !== InquiryStatus.APPROVED) {
      return reject('Only approved inquiries can be converted to a tenant.');
    }

    const room = await roomService.getRoomById(current.roomId);
    const shouldAllocate = options.allocateBed && Boolean(current.bedId);
    if (shouldAllocate) {
      const bed = room.beds.find((item) => item.id === current.bedId);
      if (!bed || bed.status !== BedStatus.AVAILABLE) {
        return reject('Selected bed is no longer available. Convert without allocating, then assign a bed later.');
      }
    }

    const tenant = await tenantService.createFromInquiry({
      inquiryId: current.id,
      firstName: current.firstName,
      lastName: current.lastName,
      email: current.email,
      phone: current.phone,
      propertyId: current.propertyId,
      roomId: shouldAllocate ? current.roomId : undefined,
      bedId: shouldAllocate ? current.bedId ?? undefined : undefined,
      moveInDate: current.preferredMoveIn ?? undefined,
      roomRent: current.monthlyRent,
      securityDeposit: room.securityDeposit,
      notes: `Converted from inquiry ${current.id} for ${current.listingTitle}.`,
    });

    const inquiry = inquiryStore.persist({
      ...current,
      status: InquiryStatus.CONVERTED,
      tenantId: tenant.id,
      statusHistory: appendStatusHistory(
        current,
        InquiryStatus.CONVERTED,
        options.actor,
        shouldAllocate ? 'Converted to an onboarding tenant with bed allocation.' : 'Converted to an onboarding tenant.',
      ),
      updatedAt: today(),
    });

    return wait({ inquiry, tenant });
  },
};
