import type {
  Property,
  PropertyBuilding,
  PropertyFilters,
  PropertyFloor,
  PropertyListItem,
  PropertySummary,
  PropertyTotals,
} from '@/types/property';

export function floorOccupancy(floor: PropertyFloor): number {
  if (floor.bedCount === 0) return 0;
  return Math.round((floor.occupiedBeds / floor.bedCount) * 100);
}

export function buildingTotals(building: PropertyBuilding): PropertyTotals {
  return summarizeUnits([building]);
}

export function propertyTotals(property: Property): PropertyTotals {
  return summarizeUnits(property.buildings);
}

export function toPropertyListItem(property: Property): PropertyListItem {
  return { ...property, ...propertyTotals(property) };
}

export function summarizeProperties(properties: Property[]): PropertySummary {
  const totals = summarizeUnits(properties.flatMap((property) => property.buildings));

  return {
    totalProperties: properties.length,
    activeProperties: properties.filter((property) => property.status === 'ACTIVE').length,
    totalRooms: totals.totalRooms,
    occupancyPercent: totals.occupancyPercent,
  };
}

export function filterProperties<T extends Property>(properties: T[], filters: PropertyFilters): T[] {
  const query = filters.query.trim().toLowerCase();

  return properties.filter((property) => {
    const matchesQuery =
      query.length === 0 ||
      property.name.toLowerCase().includes(query) ||
      property.city.toLowerCase().includes(query) ||
      property.address.toLowerCase().includes(query);

    const matchesStatus = !filters.status || property.status === filters.status;
    const matchesType = !filters.type || property.type === filters.type;
    const matchesCity = !filters.city || property.city === filters.city;

    return matchesQuery && matchesStatus && matchesType && matchesCity;
  });
}

export function uniqueCities(properties: Property[]): string[] {
  return [...new Set(properties.map((property) => property.city))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function summarizeUnits(buildings: PropertyBuilding[]): PropertyTotals {
  const floors = buildings.flatMap((building) => building.floors);
  const totalRooms = floors.reduce((sum, floor) => sum + floor.roomCount, 0);
  const totalBeds = floors.reduce((sum, floor) => sum + floor.bedCount, 0);
  const occupiedBeds = floors.reduce((sum, floor) => sum + floor.occupiedBeds, 0);

  return {
    totalBuildings: buildings.length,
    totalFloors: floors.length,
    totalRooms,
    totalBeds,
    occupiedBeds,
    availableBeds: Math.max(0, totalBeds - occupiedBeds),
    occupancyPercent: totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100),
  };
}
