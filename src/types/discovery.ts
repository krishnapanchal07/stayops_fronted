import type { AvailableBedListing, FindRoomFilters } from '@/types/inquiry';
import type { Property, PropertyType } from '@/types/property';
import type { RoomImage } from '@/types/room';

export interface DiscoveryLocation {
  latitude: number;
  longitude: number;
  precision: 'approximate-locality';
  source: 'demo-fixture';
}

export interface DiscoveryBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export type DiscoveryGender = 'male' | 'female' | 'unisex';

export interface DiscoveryFilters extends FindRoomFilters {
  city: string;
  locality: string;
  gender: DiscoveryGender | '';
  propertyType: PropertyType | '';
  amenities: string[];
}

export interface DiscoveryRoom {
  roomId: string;
  roomNumber: string;
  buildingName: string;
  floorName: string;
  roomType: AvailableBedListing['roomType'];
  sharingType: AvailableBedListing['sharingType'];
  startingRent: number;
  images: RoomImage[];
  amenities: string[];
  beds: AvailableBedListing[];
}

/** Public projection: excludes revenue, staff contacts, and operational activity. */
export interface PublicPG extends Pick<
  Property,
  'id' | 'name' | 'address' | 'city' | 'state' | 'postalCode' | 'type' | 'description'
> {
  genderPolicy?: DiscoveryGender;
  location: DiscoveryLocation | null;
  propertyAmenities: string[];
  amenities: string[];
  image: RoomImage | undefined;
  startingRent: number;
  availableRoomCount: number;
  availableBedCount: number;
  rooms: DiscoveryRoom[];
  listings: AvailableBedListing[];
}

export type DiscoverySort = 'name' | 'rent-asc' | 'rent-desc' | 'distance';
