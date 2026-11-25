import type { Room, RoomFilters, RoomFormValues } from '@/types/room';
import { RoomStatus } from '@/types/room';
import { normalizeRoomImages } from '@/utils/roomImages';
import { canMarkRoomAvailable, capacityFromSharing, duplicateRoomKey } from '@/utils/roomStats';

export const emptyRoomFilters: RoomFilters = {
  query: '',
  propertyId: '',
  buildingId: '',
  floorId: '',
  roomType: '',
  sharingType: '',
  status: '',
  availability: '',
};

export type RoomFormErrors = Partial<Record<keyof RoomFormValues, string>>;

export function emptyRoomForm(): RoomFormValues {
  return {
    propertyId: '',
    buildingId: '',
    floorId: '',
    roomNumber: '',
    roomType: 'STANDARD',
    sharingType: '2_SHARING',
    capacity: 2,
    monthlyRent: 0,
    securityDeposit: 0,
    amenities: [],
    description: '',
    status: RoomStatus.AVAILABLE,
    images: [],
  };
}

export function toRoomFormValues(room: Room): RoomFormValues {
  return {
    propertyId: room.propertyId,
    buildingId: room.buildingId,
    floorId: room.floorId,
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    sharingType: room.sharingType,
    capacity: room.capacity,
    monthlyRent: room.monthlyRent,
    securityDeposit: room.securityDeposit,
    amenities: [...room.amenities],
    description: room.description,
    status: room.status === 'MAINTENANCE' || room.status === 'BLOCKED' ? room.status : RoomStatus.AVAILABLE,
    images: normalizeRoomImages(room.images),
  };
}

export function validateRoomForm(
  values: RoomFormValues,
  rooms: Room[],
  editingId?: string,
): RoomFormErrors {
  const errors: RoomFormErrors = {};
  const roomNumber = values.roomNumber.trim();

  if (!values.propertyId) errors.propertyId = 'Property is required.';
  if (!values.buildingId) errors.buildingId = 'Building is required.';
  if (!values.floorId) errors.floorId = 'Floor is required.';

  if (!roomNumber) {
    errors.roomNumber = 'Room number is required.';
  } else if (roomNumber.length > 10) {
    errors.roomNumber = 'Keep the room number under 10 characters.';
  }

  if (!values.sharingType) {
    errors.sharingType = 'Sharing type is required.';
  }

  if (!Number.isFinite(values.capacity) || values.capacity < 1) {
    errors.capacity = 'Capacity must be at least 1.';
  } else if (values.capacity > 6) {
    errors.capacity = 'Capacity cannot exceed 6.';
  } else if (values.capacity !== capacityFromSharing(values.sharingType)) {
    errors.capacity = 'Capacity must match the selected sharing type.';
  }

  if (!Number.isFinite(values.monthlyRent) || values.monthlyRent <= 0) {
    errors.monthlyRent = 'Enter a valid monthly rent.';
  }

  if (!Number.isFinite(values.securityDeposit) || values.securityDeposit < 0) {
    errors.securityDeposit = 'Enter a valid security deposit.';
  }

  if (values.description.trim().length > 500) {
    errors.description = 'Keep the description under 500 characters.';
  }

  if (
    values.propertyId &&
    values.buildingId &&
    values.floorId &&
    roomNumber &&
    rooms.some(
      (room) =>
        room.id !== editingId &&
        duplicateRoomKey(room) ===
          duplicateRoomKey({
            propertyId: values.propertyId,
            buildingId: values.buildingId,
            roomNumber,
          }),
    )
  ) {
    errors.roomNumber = 'This room number already exists in this building.';
  }

  return errors;
}

export function validateRoomStatusChange(room: Room, nextStatus: Room['status']): string | null {
  if (nextStatus === RoomStatus.AVAILABLE) {
    return canMarkRoomAvailable(room);
  }
  return null;
}
