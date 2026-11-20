export const RoomStatus = {
  AVAILABLE: 'AVAILABLE',
  PARTIALLY_OCCUPIED: 'PARTIALLY_OCCUPIED',
  FULL: 'FULL',
  MAINTENANCE: 'MAINTENANCE',
  BLOCKED: 'BLOCKED',
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const BedStatus = {
  AVAILABLE: 'AVAILABLE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  MAINTENANCE: 'MAINTENANCE',
  BLOCKED: 'BLOCKED',
} as const;

export type BedStatus = (typeof BedStatus)[keyof typeof BedStatus];

export const RoomType = {
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
  DELUXE: 'DELUXE',
} as const;

export type RoomType = (typeof RoomType)[keyof typeof RoomType];

export const SharingType = {
  ONE_SHARING: '1_SHARING',
  TWO_SHARING: '2_SHARING',
  THREE_SHARING: '3_SHARING',
  FOUR_SHARING: '4_SHARING',
} as const;

export type SharingType = (typeof SharingType)[keyof typeof SharingType];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'Available',
  PARTIALLY_OCCUPIED: 'Partially Occupied',
  FULL: 'Full',
  MAINTENANCE: 'Maintenance',
  BLOCKED: 'Blocked',
};

export const BED_STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  MAINTENANCE: 'Maintenance',
  BLOCKED: 'Blocked',
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  DELUXE: 'Deluxe',
};

export const SHARING_TYPE_LABELS: Record<SharingType, string> = {
  '1_SHARING': '1 Sharing',
  '2_SHARING': '2 Sharing',
  '3_SHARING': '3 Sharing',
  '4_SHARING': '4 Sharing',
};

export const ROOM_AMENITIES = [
  'AC',
  'Attached Bathroom',
  'Wi-Fi',
  'Study Table',
  'Wardrobe',
  'Chair',
  'Fan',
  'Balcony',
] as const;

/** Temporary bed-assignment references until Phase 2 Part 3 tenant management. */
export interface TenantReference {
  id: string;
  name: string;
}

export interface RoomImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
  label?: string;
  tone?: 'primary' | 'info' | 'success' | 'warning';
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  label: string;
  status: BedStatus;
  tenantId: string | null;
  tenantName: string | null;
  rent: number;
  moveInDate: string | null;
}

export interface Room {
  id: string;
  propertyId: string;
  propertyName: string;
  buildingId: string;
  buildingName: string;
  floorId: string;
  floorName: string;
  roomNumber: string;
  roomType: RoomType;
  sharingType: SharingType;
  capacity: number;
  monthlyRent: number;
  securityDeposit: number;
  status: RoomStatus;
  amenities: string[];
  description: string;
  images: RoomImage[];
  beds: Bed[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomOccupancy {
  occupiedBeds: number;
  availableBeds: number;
  reservedBeds: number;
  unavailableBeds: number;
  occupancyPercent: number;
}

export interface RoomListItem extends Room, RoomOccupancy {}

export interface RoomFilters {
  query: string;
  propertyId: string;
  buildingId: string;
  floorId: string;
  roomType: RoomType | '';
  sharingType: SharingType | '';
  status: RoomStatus | '';
  availability: '' | 'HAS_AVAILABLE' | 'NO_AVAILABLE';
}

export interface RoomFormValues {
  propertyId: string;
  buildingId: string;
  floorId: string;
  roomNumber: string;
  roomType: RoomType;
  sharingType: SharingType;
  capacity: number;
  monthlyRent: number;
  securityDeposit: number;
  amenities: string[];
  description: string;
  status: RoomStatus;
  images: RoomImage[];
}

export interface RoomSummary {
  totalRooms: number;
  availableRooms: number;
  fullRooms: number;
  maintenanceRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercent: number;
}

export interface AssignBedInput {
  tenantId: string;
  tenantName: string;
  moveInDate: string;
  rent: number;
}
