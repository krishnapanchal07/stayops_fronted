import type { DiscoveryBounds, DiscoveryLocation } from '@/types/discovery';

/**
 * Deliberately coarse demo locality positions, manually chosen from locality names
 * in the existing mock addresses. These are NOT surveyed/geocoded buildings.
 * Two decimal places (~1 km) express the intended locality-level precision.
 * No address lookup, user location, distance or directions API is involved.
 * Replace this adapter with validated backend coordinates when available.
 */
const demoLocations: Record<string, readonly [number, number]> = {
  'prop-sunrise': [23.03, 72.51], // Satellite, Ahmedabad
  'prop-greenview': [23.04, 72.56], // Navrangpura, Ahmedabad
  'prop-oak': [23.01, 72.55], // Paldi, Ahmedabad
  'prop-lake': [23.04, 72.53], // Vastrapur, Ahmedabad
  'prop-maple': [23.04, 72.5], // Bodakdev, Ahmedabad
  'prop-horizon': [18.56, 73.78], // Baner, Pune
  'prop-palm': [23.0, 72.6], // Maninagar, Ahmedabad
};

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 85.05112878 &&
    Math.abs(longitude) <= 180
  );
}

export function getPropertyLocation(propertyId: string): DiscoveryLocation | null {
  const position = demoLocations[propertyId];
  if (!position || !isValidCoordinate(position[0], position[1])) return null;
  return {
    latitude: position[0],
    longitude: position[1],
    precision: 'approximate-locality',
    source: 'demo-fixture',
  };
}

export function locationWithinBounds(
  location: DiscoveryLocation | null,
  bounds: DiscoveryBounds,
): boolean {
  if (!location || !isValidCoordinate(location.latitude, location.longitude)) return false;
  const longitudeMatches =
    bounds.west <= bounds.east
      ? location.longitude >= bounds.west && location.longitude <= bounds.east
      : location.longitude >= bounds.west || location.longitude <= bounds.east;
  return location.latitude >= bounds.south && location.latitude <= bounds.north && longitudeMatches;
}

export function parseDiscoveryBounds(raw: string | null): DiscoveryBounds | null {
  if (!raw) return null;
  const parts = raw.split(',');
  if (parts.length !== 4 || parts.some((part) => !part.trim())) return null;
  const [south, west, north, east] = parts.map(Number);
  if (!isValidCoordinate(south, west) || !isValidCoordinate(north, east) || south > north)
    return null;
  return { south, west, north, east };
}
