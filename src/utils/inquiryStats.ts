import {
  InquiryStatus,
  OPEN_INQUIRY_STATUSES,
  type Inquiry,
  type InquiryFilters,
  type InquiryStatusEvent,
  type InquirySummary,
} from '@/types/inquiry';

export function inquiryFullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim();
}

export function isOpenInquiry(inquiry: Inquiry): boolean {
  return OPEN_INQUIRY_STATUSES.includes(inquiry.status);
}

export function emptyInquiryFilters(): InquiryFilters {
  return {
    query: '',
    propertyId: '',
    status: '',
  };
}

export function filterInquiries(inquiries: Inquiry[], filters: InquiryFilters): Inquiry[] {
  const query = filters.query.trim().toLowerCase();

  return inquiries.filter((inquiry) => {
    if (filters.propertyId && inquiry.propertyId !== filters.propertyId) return false;
    if (filters.status && inquiry.status !== filters.status) return false;
    if (!query) return true;

    return (
      inquiry.fullName.toLowerCase().includes(query) ||
      inquiry.email.toLowerCase().includes(query) ||
      inquiry.phone.includes(query) ||
      inquiry.listingTitle.toLowerCase().includes(query) ||
      inquiry.propertyName.toLowerCase().includes(query) ||
      inquiry.id.toLowerCase().includes(query)
    );
  });
}

export function summarizeInquiries(inquiries: Inquiry[]): InquirySummary {
  return {
    total: inquiries.length,
    submitted: inquiries.filter((item) => item.status === InquiryStatus.SUBMITTED).length,
    contacted: inquiries.filter((item) => item.status === InquiryStatus.CONTACTED).length,
    shortlisted: inquiries.filter((item) => item.status === InquiryStatus.SHORTLISTED).length,
    approved: inquiries.filter((item) => item.status === InquiryStatus.APPROVED).length,
    converted: inquiries.filter((item) => item.status === InquiryStatus.CONVERTED).length,
    rejected: inquiries.filter((item) => item.status === InquiryStatus.REJECTED).length,
  };
}

export function allowedInquiryTransitions(status: InquiryStatus): InquiryStatus[] {
  if (status === InquiryStatus.SUBMITTED) {
    return [InquiryStatus.CONTACTED, InquiryStatus.REJECTED, InquiryStatus.WITHDRAWN];
  }
  if (status === InquiryStatus.CONTACTED) {
    return [InquiryStatus.SHORTLISTED, InquiryStatus.REJECTED, InquiryStatus.WITHDRAWN];
  }
  if (status === InquiryStatus.SHORTLISTED) {
    return [InquiryStatus.APPROVED, InquiryStatus.REJECTED, InquiryStatus.WITHDRAWN];
  }
  if (status === InquiryStatus.APPROVED) {
    return [InquiryStatus.REJECTED, InquiryStatus.WITHDRAWN];
  }
  return [];
}

export function canChangeInquiryStatus(from: InquiryStatus, to: InquiryStatus): boolean {
  return allowedInquiryTransitions(from).includes(to);
}

export function appendStatusHistory(
  inquiry: Inquiry,
  to: InquiryStatus,
  actor: string,
  note?: string,
): InquiryStatusEvent[] {
  return [
    ...inquiry.statusHistory,
    {
      id: `${inquiry.id}-h${inquiry.statusHistory.length + 1}`,
      from: inquiry.status,
      to,
      note,
      actor,
      occurredAt: new Date().toISOString().slice(0, 19),
    },
  ];
}

export function inquiryMatchesOwner(inquiry: Inquiry, email: string, userId?: string | null): boolean {
  if (userId && inquiry.userId === userId) return true;
  return inquiry.email.toLowerCase() === email.trim().toLowerCase();
}

export function hasOpenInquiryForBed(inquiries: Inquiry[], email: string, roomId: string, bedId: string | null): boolean {
  const normalized = email.trim().toLowerCase();
  return inquiries.some(
    (inquiry) =>
      isOpenInquiry(inquiry) &&
      inquiry.email.toLowerCase() === normalized &&
      inquiry.roomId === roomId &&
      inquiry.bedId === bedId,
  );
}
