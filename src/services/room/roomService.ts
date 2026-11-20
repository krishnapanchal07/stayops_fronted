import seedProperties from '@/mock/properties.json';
import featuredRooms from '@/mock/rooms.json';
import { tenantStore } from '@/services/tenant/tenantStore';
import type { Property } from '@/types/property';
import {
  BedStatus,
  RoomStatus,
  RoomType,
  type AssignBedInput,
  type Bed,
  type Room,
  type RoomFilters,
  type RoomFormValues,
  type RoomListItem,
  type RoomSummary,
  type TenantReference,
} from '@/types/room';
import {
  assignBedToRoom,
  calculateRoomOccupancy,
  canAssignBed,
  canReleaseBed,
  capacityFromSharing,
  createBedsForCapacity,
  deriveAllocatableStatus,
  filterRooms,
  occupiedTenantIds,
  releaseBedFromRoom,
  rentForSharing,
  roomKey,
  sharingTypeFromCapacity,
  summarizeRooms,
  toRoomListItem,
  updateBedStatus,
} from '@/utils/roomStats';
import type { AvailableBedListing, FindRoomFilters } from '@/types/inquiry';
import { normalizeRoomImages } from '@/utils/roomImages';
import { filterAvailableListings, toAvailableListings } from '@/utils/roomListing';
import { validateRoomForm, validateRoomStatusChange } from '@/utils/roomValidation';

const featuredRoomIds = new Set((featuredRooms as Room[]).map((room) => room.id));

const properties = seedProperties as Property[];

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function createId(prefix: string, value: string): string {
  return `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
}

function generateInventory(overrides: Room[]): Room[] {
  const overrideKeys = new Set(overrides.map((room) => roomKey(room)));
  const generated: Room[] = [];
  const directory = tenantStore.list();
  let tenantCursor = 0;

  for (const property of properties) {
    for (const building of property.buildings) {
      for (const floor of building.floors) {
        const capacity = Math.max(1, Math.round(floor.bedCount / Math.max(1, floor.roomCount)));
        const sharingType = sharingTypeFromCapacity(capacity);
        const rent = rentForSharing(sharingType);
        let remainingOccupied = floor.occupiedBeds;
        const floorNumber = Number.parseInt(floor.name.replace(/\D/g, ''), 10) || 1;

        for (let index = 1; index <= floor.roomCount; index += 1) {
          const roomNumber = String(floorNumber * 100 + index);
          const key = roomKey({
            propertyId: property.id,
            buildingId: building.id,
            floorId: floor.id,
            roomNumber,
          });
          if (overrideKeys.has(key)) {
            remainingOccupied = Math.max(0, remainingOccupied - capacity);
            continue;
          }

          const occupyCount = Math.min(capacity, Math.max(0, remainingOccupied));
          remainingOccupied -= occupyCount;
          const roomId = `room-${property.id}-${building.id}-${floor.id}-${roomNumber}`;
          const beds = createBedsForCapacity(roomId, capacity, rent).map((bed, bedIndex) => {
            if (bedIndex >= occupyCount) return bed;
            const tenant = directory[tenantCursor % Math.max(1, directory.length)];
            tenantCursor += 1;
            return {
              ...bed,
              status: BedStatus.OCCUPIED,
              tenantId: tenant ? `${tenant.id}-gen-${roomNumber}-${bed.bedNumber}` : `gen-${roomNumber}-${bed.bedNumber}`,
              tenantName: tenant?.fullName ?? 'Resident',
              moveInDate: '2026-06-01',
            };
          });

          const draft: Room = {
            id: roomId,
            propertyId: property.id,
            propertyName: property.name,
            buildingId: building.id,
            buildingName: building.name,
            floorId: floor.id,
            floorName: floor.name,
            roomNumber,
            roomType: RoomType.STANDARD,
            sharingType,
            capacity,
            monthlyRent: rent,
            securityDeposit: rent,
            status: RoomStatus.AVAILABLE,
            amenities: ['Wi-Fi', 'Fan', 'Wardrobe'],
            description: `${sharingType.replace('_', ' ').toLowerCase()} room on ${floor.name}, ${building.name}.`,
            images: normalizeRoomImages([{ id: `${roomId}-img`, label: 'Room view', tone: 'primary' }]),
            beds,
            createdAt: '2026-01-15',
            updatedAt: '2026-06-01',
          };

          generated.push({ ...draft, status: deriveAllocatableStatus(draft) });
        }
      }
    }
  }

  return [
    ...overrides.map((room) => ({
      ...room,
      images: normalizeRoomImages(room.images),
      status: deriveAllocatableStatus(room),
    })),
    ...generated,
  ];
}

let rooms = generateInventory(featuredRooms as Room[]);

function lookup(id: string): Room | undefined {
  return rooms.find((room) => room.id === id);
}

function persist(next: Room): RoomListItem {
  rooms = rooms.map((room) => (room.id === next.id ? next : room));
  return toRoomListItem(clone(next));
}

function locationNames(values: RoomFormValues) {
  const property = properties.find((item) => item.id === values.propertyId);
  const building = property?.buildings.find((item) => item.id === values.buildingId);
  const floor = building?.floors.find((item) => item.id === values.floorId);
  return {
    propertyName: property?.name ?? 'Unknown property',
    buildingName: building?.name ?? 'Unknown building',
    floorName: floor?.name ?? 'Unknown floor',
  };
}

/**
 * Room and bed reads/mutations go through this service so Phase 3 can
 * replace the in-memory store with Axios → FastAPI.
 */
export const roomService = {
  getRooms(): Promise<RoomListItem[]> {
    return wait(rooms.map((room) => toRoomListItem(clone(room))));
  },

  getRoomById(id: string): Promise<RoomListItem> {
    const room = lookup(id);
    return room ? wait(toRoomListItem(clone(room))) : reject('Room not found.');
  },

  getRoomsByProperty(propertyId: string): Promise<RoomListItem[]> {
    return wait(
      rooms.filter((room) => room.propertyId === propertyId).map((room) => toRoomListItem(clone(room))),
    );
  },

  getRoomsByBuilding(buildingId: string): Promise<RoomListItem[]> {
    return wait(
      rooms.filter((room) => room.buildingId === buildingId).map((room) => toRoomListItem(clone(room))),
    );
  },

  getRoomsByFloor(floorId: string): Promise<RoomListItem[]> {
    return wait(rooms.filter((room) => room.floorId === floorId).map((room) => toRoomListItem(clone(room))));
  },

  searchRooms(filters: RoomFilters): Promise<RoomListItem[]> {
    return wait(filterRooms(rooms.map((room) => toRoomListItem(room)), filters).map((room) => clone(room)));
  },

  listAvailableListings(filters: FindRoomFilters): Promise<AvailableBedListing[]> {
    return wait(filterAvailableListings(toAvailableListings(rooms, featuredRoomIds), filters).map((listing) => clone(listing)));
  },

  getRoomSummary(): Promise<RoomSummary> {
    return wait(summarizeRooms(rooms));
  },

  getTenantReferences(): Promise<TenantReference[]> {
    return wait(tenantStore.list().map((tenant) => ({ id: tenant.id, name: tenant.fullName })));
  },

  getAssignableTenants(): Promise<TenantReference[]> {
    const occupied = occupiedTenantIds(rooms);
    return wait(
      tenantStore
        .unassigned()
        .filter((tenant) => !occupied.has(tenant.id))
        .map((tenant) => ({ id: tenant.id, name: tenant.fullName })),
    );
  },

  createRoom(values: RoomFormValues): Promise<RoomListItem> {
    const errors = validateRoomForm(values, rooms);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to save room.');
    }

    const capacity = capacityFromSharing(values.sharingType);
    const names = locationNames(values);
    const id = createId('room', `${values.propertyId}-${values.roomNumber}`);
    const created: Room = {
      id,
      propertyId: values.propertyId,
      buildingId: values.buildingId,
      floorId: values.floorId,
      roomNumber: values.roomNumber.trim(),
      roomType: values.roomType,
      sharingType: values.sharingType,
      capacity,
      monthlyRent: values.monthlyRent,
      securityDeposit: values.securityDeposit,
      amenities: values.amenities,
      description: values.description.trim(),
      status: values.status === RoomStatus.MAINTENANCE || values.status === RoomStatus.BLOCKED
        ? values.status
        : RoomStatus.AVAILABLE,
      images: normalizeRoomImages(values.images),
      beds: createBedsForCapacity(id, capacity, values.monthlyRent),
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
      ...names,
    };

    rooms = [created, ...rooms];
    return wait(toRoomListItem(clone(created)));
  },

  updateRoom(id: string, values: RoomFormValues): Promise<RoomListItem> {
    const current = lookup(id);
    if (!current) return reject('Room not found.');

    const errors = validateRoomForm(values, rooms, id);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to save room.');
    }

    const capacity = capacityFromSharing(values.sharingType);
    const occupied = current.beds.filter((bed) => bed.status === BedStatus.OCCUPIED).length;
    const removableCount = current.beds.length - capacity;
    const availableCount = current.beds.filter((bed) => bed.status === BedStatus.AVAILABLE).length;
    if (capacity < occupied) {
      return reject('Capacity cannot be lower than the number of occupied beds.');
    }
    if (removableCount > 0 && availableCount < removableCount) {
      return reject('Free or remove unused beds before lowering capacity.');
    }

    let beds = current.beds.map((bed) => ({ ...bed, rent: values.monthlyRent }));
    if (capacity > beds.length) {
      beds = [
        ...beds,
        ...createBedsForCapacity(id, capacity, values.monthlyRent).slice(beds.length),
      ];
    } else if (capacity < beds.length) {
      const removable = beds.filter((bed) => bed.status === BedStatus.AVAILABLE);
      const keepCount = beds.length - capacity;
      const removeIds = new Set(removable.slice(0, keepCount).map((bed) => bed.id));
      beds = beds.filter((bed) => !removeIds.has(bed.id));
    }

    const names = locationNames(values);
    const updated: Room = {
      ...current,
      ...values,
      ...names,
      roomNumber: values.roomNumber.trim(),
      capacity,
      description: values.description.trim(),
      beds,
      images: normalizeRoomImages(values.images),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    updated.status =
      values.status === RoomStatus.MAINTENANCE || values.status === RoomStatus.BLOCKED
        ? values.status
        : deriveAllocatableStatus(updated);

    return wait(persist(updated));
  },

  changeRoomStatus(id: string, status: Room['status']): Promise<RoomListItem> {
    const current = lookup(id);
    if (!current) return reject('Room not found.');
    const blocked = validateRoomStatusChange(current, status);
    if (blocked) return reject(blocked);

    const updated: Room = {
      ...current,
      status,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    if (status !== RoomStatus.MAINTENANCE && status !== RoomStatus.BLOCKED) {
      updated.status = deriveAllocatableStatus({ ...updated, status: RoomStatus.AVAILABLE });
    }
    return wait(persist(updated));
  },

  getBeds(roomId: string): Promise<Bed[]> {
    const room = lookup(roomId);
    return room ? wait(clone(room.beds)) : reject('Room not found.');
  },

  findBed(roomId: string, bedId: string): Promise<Bed | null> {
    const room = lookup(roomId);
    const bed = room?.beds.find((item) => item.id === bedId);
    return wait(bed ? clone(bed) : null);
  },

  updateBed(roomId: string, bedId: string, status: Bed['status']): Promise<RoomListItem> {
    const current = lookup(roomId);
    if (!current) return reject('Room not found.');
    const bed = current.beds.find((item) => item.id === bedId);
    if (!bed) return reject('Bed not found.');
    const previousTenantId = bed.tenantId;
    const updated = persist(updateBedStatus(current, bedId, status));
    if (status === BedStatus.AVAILABLE && previousTenantId) {
      tenantStore.clearAllocation(previousTenantId);
    }
    return wait(updated);
  },

  assignBed(roomId: string, bedId: string, input: AssignBedInput): Promise<RoomListItem> {
    const current = lookup(roomId);
    if (!current) return reject('Room not found.');
    const bed = current.beds.find((item) => item.id === bedId);
    if (!bed) return reject('Bed not found.');
    const blocked = canAssignBed(current, bed);
    if (blocked) return reject(blocked);
    const updated = persist(assignBedToRoom(current, bedId, input));
    tenantStore.applyAllocation(input.tenantId, {
      propertyId: updated.propertyId,
      propertyName: updated.propertyName,
      buildingId: updated.buildingId,
      buildingName: updated.buildingName,
      floorId: updated.floorId,
      floorName: updated.floorName,
      roomId: updated.id,
      roomNumber: updated.roomNumber,
      bedId,
      bedLabel: updated.beds.find((item) => item.id === bedId)?.label ?? bed.label,
      roomRent: input.rent,
      moveInDate: input.moveInDate,
    });
    return wait(updated);
  },

  releaseBed(roomId: string, bedId: string): Promise<RoomListItem> {
    const current = lookup(roomId);
    if (!current) return reject('Room not found.');
    const bed = current.beds.find((item) => item.id === bedId);
    if (!bed) return reject('Bed not found.');
    const blocked = canReleaseBed(bed);
    if (blocked) return reject(blocked);
    const previousTenantId = bed.tenantId;
    const updated = persist(releaseBedFromRoom(current, bedId));
    if (previousTenantId) {
      tenantStore.clearAllocation(previousTenantId);
    }
    return wait(updated);
  },

  occupancyFor(room: Room) {
    return calculateRoomOccupancy(room);
  },
};
