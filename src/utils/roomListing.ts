import { BedStatus, RoomStatus, SHARING_TYPE_LABELS, type Room } from '@/types/room';
import { RentRange, type AvailableBedListing, type FindRoomFilters } from '@/types/inquiry';

export const DEFAULT_ROOM_POLICIES: string[] = []; // Property policies have not been configured.

export const emptyFindRoomFilters = (): FindRoomFilters => ({
  query: '',
  propertyId: '',
  roomType: '',
  sharingType: '',
  rentRange: '',
});

export function listingTitle(roomNumber: string, bedNumber: string): string {
  return `${roomNumber} - ${bedNumber}`;
}

export function listingId(roomId: string, bedId: string): string {
  return `${roomId}:${bedId}`;
}

export function hasAmenity(amenities: string[], label: string): boolean {
  const needle = label.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return amenities.some((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, '').includes(needle));
}

export function roomSpecRows(room: Pick<Room, 'sharingType' | 'floorName' | 'amenities'>) {
  return [
    { label: 'Room Type', value: SHARING_TYPE_LABELS[room.sharingType] },
    { label: 'Floor', value: room.floorName },
    { label: 'Bathroom', value: hasAmenity(room.amenities, 'Attached Bathroom') ? 'Attached' : 'Common' },
    { label: 'AC', value: hasAmenity(room.amenities, 'AC') ? 'Yes' : 'No' },
    { label: 'WiFi', value: hasAmenity(room.amenities, 'Wi') ? 'Yes' : 'No' },
    { label: 'Balcony', value: hasAmenity(room.amenities, 'Balcony') ? 'Yes' : 'No' },
  ];
}

function matchesRent(rent: number, range: FindRoomFilters['rentRange']): boolean {
  if (!range) return true;
  if (range === RentRange.UNDER_6000) return rent < 6000;
  if (range === RentRange.RANGE_6000_8000) return rent >= 6000 && rent <= 8000;
  if (range === RentRange.RANGE_8000_10000) return rent > 8000 && rent <= 10000;
  return rent > 10000;
}

export function isListableRoom(room: Room): boolean {
  return room.status !== RoomStatus.MAINTENANCE && room.status !== RoomStatus.BLOCKED;
}

export function toAvailableListings(rooms: Room[], featuredRoomIds: Set<string> = new Set()): AvailableBedListing[] {
  const listings = rooms.flatMap((room) => {
    if (!isListableRoom(room)) return [];
    return room.beds
      .filter((bed) => bed.status === BedStatus.AVAILABLE)
      .map((bed) => ({
        id: listingId(room.id, bed.id),
        roomId: room.id,
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        title: listingTitle(room.roomNumber, bed.bedNumber),
        propertyId: room.propertyId,
        propertyName: room.propertyName,
        buildingName: room.buildingName,
        floorName: room.floorName,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        sharingType: room.sharingType,
        monthlyRent: bed.rent,
        securityDeposit: room.securityDeposit,
        amenities: room.amenities,
        description: room.description,
        images: room.images,
      }));
  });

  return listings.sort((left, right) => {
    const leftFeatured = featuredRoomIds.has(left.roomId) ? 0 : 1;
    const rightFeatured = featuredRoomIds.has(right.roomId) ? 0 : 1;
    if (leftFeatured !== rightFeatured) return leftFeatured - rightFeatured;
    return left.title.localeCompare(right.title, undefined, { numeric: true });
  });
}

export function filterAvailableListings(
  listings: AvailableBedListing[],
  filters: FindRoomFilters,
): AvailableBedListing[] {
  const query = filters.query.trim().toLowerCase();

  return listings.filter((listing) => {
    if (filters.propertyId && listing.propertyId !== filters.propertyId) return false;
    if (filters.roomType && listing.roomType !== filters.roomType) return false;
    if (filters.sharingType && listing.sharingType !== filters.sharingType) return false;
    if (!matchesRent(listing.monthlyRent, filters.rentRange)) return false;
    if (!query) return true;

    return (
      listing.title.toLowerCase().includes(query) ||
      listing.propertyName.toLowerCase().includes(query) ||
      listing.roomNumber.toLowerCase().includes(query) ||
      listing.amenities.some((amenity) => amenity.toLowerCase().includes(query))
    );
  });
}
