import type {
  DiscoveryFilters,
  DiscoverySort,
  PublicPG,
  DiscoveryRoom,
  DiscoveryGender,
} from '@/types/discovery';
import type { AvailableBedListing } from '@/types/inquiry';
import { RentRange } from '@/types/inquiry';
import type { Property } from '@/types/property';
import { PropertyStatus, PropertyType } from '@/types/property';
import { RoomType, SharingType } from '@/types/room';
import { filterAvailableListings, emptyFindRoomFilters } from '@/utils/roomListing';
import { getPropertyLocation } from '@/utils/propertyLocations';
import { discoveryGenderPolicies } from '@/config/discoveryGenderPolicies';

const compareId = (a: { id: string }, b: { id: string }) =>
  a.id.localeCompare(b.id, 'en', { numeric: true });
const unique = (items: string[]) => [...new Set(items)].sort((a, b) => a.localeCompare(b));
const amenityKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const startingRent = (beds: AvailableBedListing[]) =>
  beds.reduce((minimum, bed) => Math.min(minimum, bed.monthlyRent), Infinity);
type PublicPropertyData = Pick<
  Property,
  'id' | 'name' | 'address' | 'city' | 'state' | 'postalCode' | 'type' | 'description' | 'amenities'
> & { genderPolicy?: DiscoveryGender };

export function emptyDiscoveryFilters(): DiscoveryFilters {
  return {
    ...emptyFindRoomFilters(),
    city: '',
    locality: '',
    gender: '',
    propertyType: '',
    amenities: [],
  };
}

export function parseDiscoveryFilters(params: URLSearchParams): DiscoveryFilters {
  const enumValue = <T extends string>(key: string, values: T[]): T | '' => {
    const value = params.get(key);
    return values.includes(value as T) ? (value as T) : '';
  };
  return {
    query: params.get('query') ?? '',
    propertyId: params.get('propertyId') ?? '',
    city: params.get('city') ?? '',
    locality: params.get('locality') ?? '',
    gender: enumValue('gender', ['male', 'female', 'unisex']),
    roomType: enumValue('roomType', Object.values(RoomType)),
    sharingType: enumValue('sharingType', Object.values(SharingType)),
    rentRange: enumValue('rentRange', Object.values(RentRange)),
    propertyType: enumValue('propertyType', Object.values(PropertyType)),
    amenities: unique(params.getAll('amenity').filter(Boolean)),
  };
}

function projectProperty(property: PublicPropertyData, listings: AvailableBedListing[]): PublicPG {
  const roomBeds = new Map<string, AvailableBedListing[]>();
  for (const listing of listings) {
    const group = roomBeds.get(listing.roomId) ?? [];
    group.push(listing);
    roomBeds.set(listing.roomId, group);
  }
  const rooms: DiscoveryRoom[] = [...roomBeds.entries()].map(([roomId, beds]) => {
    const first = beds[0];
    return {
      roomId,
      roomNumber: first.roomNumber,
      buildingName: first.buildingName,
      floorName: first.floorName,
      roomType: first.roomType,
      sharingType: first.sharingType,
      images: first.images,
      amenities: first.amenities,
      beds,
      startingRent: startingRent(beds),
    };
  });
  // Deterministic image choice: room/bed order, then primary/sort order/id.
  const image = rooms
    .flatMap((room) =>
      [...room.images].sort(
        (a, b) =>
          Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder || compareId(a, b),
      ),
    )
    .find((candidate) => candidate.url);
  return {
    id: property.id,
    genderPolicy: property.genderPolicy ?? discoveryGenderPolicies[property.id],
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    postalCode: property.postalCode,
    type: property.type,
    description: property.description,
    location: getPropertyLocation(property.id),
    propertyAmenities: property.amenities,
    amenities: unique([...property.amenities, ...listings.flatMap((listing) => listing.amenities)]),
    image,
    startingRent: startingRent(listings),
    availableRoomCount: rooms.length,
    availableBedCount: listings.length,
    rooms,
    listings,
  };
}

export function aggregatePublicPGs(
  properties: Property[],
  availableBeds: AvailableBedListing[],
): PublicPG[] {
  const grouped = new Map<string, AvailableBedListing[]>();
  const seen = new Set<string>();
  for (const bed of [...availableBeds].sort(compareId)) {
    const key = `${bed.roomId}:${bed.bedId}`;
    if (seen.has(key) || !Number.isFinite(bed.monthlyRent) || bed.monthlyRent < 0) continue;
    seen.add(key);
    const group = grouped.get(bed.propertyId) ?? [];
    group.push(bed);
    grouped.set(bed.propertyId, group);
  }
  return properties
    .filter((property) => property.status === PropertyStatus.ACTIVE && grouped.has(property.id))
    .map((property) => projectProperty(property, grouped.get(property.id)!))
    .sort((a, b) => a.name.localeCompare(b.name) || compareId(a, b));
}

/** Room filters, rent and room amenities must match the SAME available bed. */
export function filterPublicPGs(properties: PublicPG[], filters: DiscoveryFilters): PublicPG[] {
  const query = filters.query.trim().toLowerCase();
  return properties.flatMap((pg) => {
    if (filters.locality && pg.address.split(',').at(-1)?.trim() !== filters.locality) return [];
    if (filters.gender && pg.genderPolicy !== filters.gender) return [];
    if (filters.city && pg.city !== filters.city) return [];
    if (filters.propertyType && pg.type !== filters.propertyType) return [];
    const propertyMatches = `${pg.name} ${pg.address} ${pg.city} ${pg.state}`
      .toLowerCase()
      .includes(query);
    const beds = filterAvailableListings(pg.listings, { ...filters, query: '' }).filter((bed) => {
      const amenities = new Set([...pg.propertyAmenities, ...bed.amenities].map(amenityKey));
      if (!filters.amenities.every((amenity) => amenities.has(amenityKey(amenity)))) return false;
      return (
        !query ||
        propertyMatches ||
        `${bed.title} ${bed.roomNumber} ${bed.amenities.join(' ')}`.toLowerCase().includes(query)
      );
    });
    if (!beds.length) return [];
    if (beds.length === pg.listings.length) return [pg];
    // Re-project only changed groups; retain stable objects for unaffected cards/markers.
    return [projectProperty({ ...pg, amenities: pg.propertyAmenities }, beds)];
  });
}

/** Great-circle distance is approximate because discovery coordinates are demo locality pins. */
export function discoveryDistance(
  location: PublicPG['location'],
  origin: { latitude: number; longitude: number },
): number {
  if (!location) return Infinity;
  const radians = (value: number) => (value * Math.PI) / 180;
  const lat = radians(location.latitude - origin.latitude);
  const lng = radians(location.longitude - origin.longitude);
  const a =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(origin.latitude)) *
      Math.cos(radians(location.latitude)) *
      Math.sin(lng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function sortPublicPGs(
  properties: PublicPG[],
  sort: DiscoverySort,
  origin?: { latitude: number; longitude: number } | null,
): PublicPG[] {
  return [...properties].sort(
    (a, b) =>
      (sort === 'distance' && origin
        ? discoveryDistance(a.location, origin) - discoveryDistance(b.location, origin)
        : sort === 'rent-asc'
          ? a.startingRent - b.startingRent
          : sort === 'rent-desc'
            ? b.startingRent - a.startingRent
            : 0) ||
      a.name.localeCompare(b.name) ||
      compareId(a, b),
  );
}
