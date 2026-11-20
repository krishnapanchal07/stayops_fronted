export const PropertyStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const PropertyType = {
  PG: 'PG',
  HOSTEL: 'HOSTEL',
  CO_LIVING: 'CO_LIVING',
} as const;

export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Maintenance',
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  PG: 'PG',
  HOSTEL: 'Hostel',
  CO_LIVING: 'Co-living',
};

export const PROPERTY_AMENITIES = [
  'Wi-Fi',
  'AC',
  'Laundry',
  'Study Table',
  'Parking',
  'CCTV',
  'Housekeeping',
  'Power Backup',
  'Mess',
  'Hot Water',
] as const;

export type PropertyAmenity = (typeof PROPERTY_AMENITIES)[number];

export interface PropertyFloor {
  id: string;
  name: string;
  roomCount: number;
  bedCount: number;
  occupiedBeds: number;
}

export interface PropertyBuilding {
  id: string;
  name: string;
  floors: PropertyFloor[];
}

export interface PropertyActivityItem {
  id: string;
  title: string;
  detail: string;
  time: string;
}

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  contactNumber: string;
  email: string;
  status: PropertyStatus;
  description: string;
  amenities: string[];
  monthlyRevenue: number;
  buildings: PropertyBuilding[];
  recentActivity: PropertyActivityItem[];
}

export interface PropertyFormValues {
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  contactNumber: string;
  email: string;
  description: string;
  amenities: string[];
  status: PropertyStatus;
}

export interface PropertyFilters {
  query: string;
  status: PropertyStatus | '';
  type: PropertyType | '';
  city: string;
}

export interface PropertyTotals {
  totalBuildings: number;
  totalFloors: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercent: number;
}

export interface PropertySummary {
  totalProperties: number;
  activeProperties: number;
  totalRooms: number;
  occupancyPercent: number;
}

export interface PropertyListItem extends Property, PropertyTotals {}
