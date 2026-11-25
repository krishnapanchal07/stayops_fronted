import {
  BedStatus,
  RoomStatus,
  SharingType,
  type Bed,
  type Room,
  type RoomFilters,
  type RoomListItem,
  type RoomOccupancy,
  type RoomSummary,
  type SharingType as SharingTypeValue,
} from '@/types/room';


export function capacityFromSharing(sharingType: SharingTypeValue): number {
  if (sharingType === SharingType.FOUR_SHARING) return 4;
  if (sharingType === SharingType.THREE_SHARING) return 3;
  if (sharingType === SharingType.TWO_SHARING) return 2;
  return 1;
}

export function calculateRoomOccupancy(room: Pick<Room, 'beds' | 'capacity'>): RoomOccupancy {
  const occupiedBeds = room.beds.filter((bed) => bed.status === BedStatus.OCCUPIED).length;
  const availableBeds = room.beds.filter((bed) => bed.status === BedStatus.AVAILABLE).length;
  const reservedBeds = room.beds.filter((bed) => bed.status === BedStatus.RESERVED).length;
  const unavailableBeds = room.beds.length - occupiedBeds - availableBeds - reservedBeds;
  const occupancyPercent =
    room.capacity === 0 ? 0 : Math.round((occupiedBeds / room.capacity) * 100);

  return { occupiedBeds, availableBeds, reservedBeds, unavailableBeds, occupancyPercent };
}

export function deriveAllocatableStatus(room: Pick<Room, 'beds' | 'capacity' | 'status'>): RoomStatus {
  if (room.status === RoomStatus.MAINTENANCE || room.status === RoomStatus.BLOCKED) {
    return room.status;
  }

  const occupancy = calculateRoomOccupancy(room);
  if (occupancy.occupiedBeds === 0 && occupancy.availableBeds > 0) {
    return RoomStatus.AVAILABLE;
  }
  if (occupancy.occupiedBeds > 0 && occupancy.occupiedBeds < room.capacity && occupancy.availableBeds > 0) {
    return RoomStatus.PARTIALLY_OCCUPIED;
  }
  if (occupancy.occupiedBeds >= room.capacity || occupancy.availableBeds === 0) {
    return occupancy.occupiedBeds > 0 ? RoomStatus.FULL : RoomStatus.BLOCKED;
  }
  return RoomStatus.AVAILABLE;
}

export function toRoomListItem(room: Room): RoomListItem {
  const occupancy = calculateRoomOccupancy(room);
  return {
    ...room,
    ...occupancy,
    status: deriveAllocatableStatus(room),
  };
}

export function summarizeRooms(rooms: Room[]): RoomSummary {
  const items = rooms.map(toRoomListItem);
  const totalBeds = items.reduce((sum, room) => sum + room.beds.length, 0);
  const occupiedBeds = items.reduce((sum, room) => sum + room.occupiedBeds, 0);
  return {
    totalRooms: items.length,
    availableRooms: items.filter((room) => room.status === RoomStatus.AVAILABLE).length,
    fullRooms: items.filter((room) => room.status === RoomStatus.FULL).length,
    maintenanceRooms: items.filter((room) => room.status === RoomStatus.MAINTENANCE).length,
    totalBeds,
    occupiedBeds,
    availableBeds: items.reduce((sum, room) => sum + room.availableBeds, 0),
    occupancyPercent: totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100),
  };
}

export function filterRooms(rooms: RoomListItem[], filters: RoomFilters): RoomListItem[] {
  const query = filters.query.trim().toLowerCase();

  return rooms.filter((room) => {
    const matchesQuery =
      query.length === 0 ||
      room.roomNumber.toLowerCase().includes(query) ||
      room.propertyName.toLowerCase().includes(query) ||
      room.buildingName.toLowerCase().includes(query) ||
      room.floorName.toLowerCase().includes(query);

    const matchesProperty = !filters.propertyId || room.propertyId === filters.propertyId;
    const matchesBuilding = !filters.buildingId || room.buildingId === filters.buildingId;
    const matchesFloor = !filters.floorId || room.floorId === filters.floorId;
    const matchesType = !filters.roomType || room.roomType === filters.roomType;
    const matchesSharing = !filters.sharingType || room.sharingType === filters.sharingType;
    const matchesStatus = !filters.status || room.status === filters.status;
    const matchesAvailability =
      !filters.availability ||
      (filters.availability === 'HAS_AVAILABLE' && room.availableBeds > 0) ||
      (filters.availability === 'NO_AVAILABLE' && room.availableBeds === 0);

    return (
      matchesQuery &&
      matchesProperty &&
      matchesBuilding &&
      matchesFloor &&
      matchesType &&
      matchesSharing &&
      matchesStatus &&
      matchesAvailability
    );
  });
}

export function canAllocateRoom(room: Room): boolean {
  const status = deriveAllocatableStatus(room);
  return status === RoomStatus.AVAILABLE || status === RoomStatus.PARTIALLY_OCCUPIED;
}

export function canAssignBed(room: Room, bed: Bed): string | null {
  if (!canAllocateRoom(room)) {
    return 'This room is not available for allocation.';
  }
  if (bed.status !== BedStatus.AVAILABLE) {
    return 'Only available beds can be assigned.';
  }
  return null;
}

export function canReleaseBed(bed: Bed): string | null {
  if (bed.status !== BedStatus.OCCUPIED) {
    return 'Only occupied beds can be released.';
  }
  return null;
}

export function canMarkRoomAvailable(room: Room): string | null {
  const occupancy = calculateRoomOccupancy(room);
  if (occupancy.availableBeds === 0 && occupancy.occupiedBeds === 0) {
    return 'This room has no usable beds, so it cannot be marked available.';
  }
  return null;
}

export function roomKey(room: Pick<Room, 'propertyId' | 'buildingId' | 'floorId' | 'roomNumber'>): string {
  return `${room.propertyId}:${room.buildingId}:${room.floorId}:${room.roomNumber.trim().toLowerCase()}`;
}

export function duplicateRoomKey(room: Pick<Room, 'propertyId' | 'buildingId' | 'roomNumber'>): string {
  return `${room.propertyId}:${room.buildingId}:${room.roomNumber.trim().toLowerCase()}`;
}

export const getRoomOccupancy = calculateRoomOccupancy;
export const getTotalRooms = (rooms: Room[]): number => rooms.length;
export const getTotalBeds = (rooms: Room[]): number => rooms.reduce((sum, room) => sum + room.beds.length, 0);
export const getOccupiedBeds = (rooms: Room[]): number =>
  rooms.reduce((sum, room) => sum + calculateRoomOccupancy(room).occupiedBeds, 0);
export const getAvailableBeds = (rooms: Room[]): number =>
  rooms.reduce((sum, room) => sum + calculateRoomOccupancy(room).availableBeds, 0);
export const getMaintenanceRooms = (rooms: Room[]): number =>
  rooms.filter((room) => deriveAllocatableStatus(room) === RoomStatus.MAINTENANCE).length;

export function summarizeFloorRooms(rooms: Room[]): RoomSummary {
  return summarizeRooms(rooms);
}
