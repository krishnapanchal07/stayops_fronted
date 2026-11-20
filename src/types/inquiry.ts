import type { RoomImage, RoomType, SharingType } from '@/types/room';

export const InquiryStatus = {
  SUBMITTED: 'SUBMITTED',
  CONTACTED: 'CONTACTED',
  SHORTLISTED: 'SHORTLISTED',
  APPROVED: 'APPROVED',
  CONVERTED: 'CONVERTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type InquiryStatus = (typeof InquiryStatus)[keyof typeof InquiryStatus];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  SUBMITTED: 'Submitted',
  CONTACTED: 'Contacted',
  SHORTLISTED: 'Shortlisted',
  APPROVED: 'Approved',
  CONVERTED: 'Converted',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const OPEN_INQUIRY_STATUSES: InquiryStatus[] = [
  InquiryStatus.SUBMITTED,
  InquiryStatus.CONTACTED,
  InquiryStatus.SHORTLISTED,
  InquiryStatus.APPROVED,
];

export const RentRange = {
  UNDER_6000: 'UNDER_6000',
  RANGE_6000_8000: '6000_8000',
  RANGE_8000_10000: '8000_10000',
  ABOVE_10000: 'ABOVE_10000',
} as const;

export type RentRange = (typeof RentRange)[keyof typeof RentRange];

export const RENT_RANGE_LABELS: Record<RentRange, string> = {
  UNDER_6000: 'Under ₹6,000',
  '6000_8000': '₹6,000 – ₹8,000',
  '8000_10000': '₹8,000 – ₹10,000',
  ABOVE_10000: 'Above ₹10,000',
};

export interface InquiryStatusEvent {
  id: string;
  from: InquiryStatus | null;
  to: InquiryStatus;
  note?: string;
  actor: string;
  occurredAt: string;
}

export interface Inquiry {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  userId: string | null;
  propertyId: string;
  propertyName: string;
  roomId: string;
  roomNumber: string;
  bedId: string | null;
  bedNumber: string | null;
  listingTitle: string;
  sharingType: SharingType;
  monthlyRent: number;
  preferredMoveIn: string | null;
  message: string;
  status: InquiryStatus;
  statusHistory: InquiryStatusEvent[];
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryFilters {
  query: string;
  propertyId: string;
  status: InquiryStatus | '';
}

export interface InquiryFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredMoveIn: string;
  message: string;
}

export interface InquirySummary {
  total: number;
  submitted: number;
  contacted: number;
  shortlisted: number;
  approved: number;
  converted: number;
  rejected: number;
}

export interface FindRoomFilters {
  query: string;
  propertyId: string;
  roomType: RoomType | '';
  sharingType: SharingType | '';
  rentRange: RentRange | '';
}

export interface AvailableBedListing {
  id: string;
  roomId: string;
  bedId: string;
  bedNumber: string;
  title: string;
  propertyId: string;
  propertyName: string;
  buildingName: string;
  floorName: string;
  roomNumber: string;
  roomType: RoomType;
  sharingType: SharingType;
  monthlyRent: number;
  securityDeposit: number;
  amenities: string[];
  description: string;
  images: RoomImage[];
}

export interface ConvertInquiryOptions {
  allocateBed: boolean;
  actor: string;
}
