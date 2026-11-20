/** Set BOTH values when switching providers so the provider's licence stays visible. */
export const discoveryMapConfig = {
  tileUrl:
    import.meta.env.VITE_DISCOVERY_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    import.meta.env.VITE_DISCOVERY_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  minZoom: 4,
  maxZoom: 18,
};
