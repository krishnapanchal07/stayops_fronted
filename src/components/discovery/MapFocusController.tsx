import { useEffect, useRef } from 'react';
import { latLngBounds } from 'leaflet';
import { useMap, useMapEvents } from 'react-leaflet';
import type { DiscoveryBounds, PublicPG } from '@/types/discovery';

interface Props {
  properties: PublicPG[];
  highlightedId: string | null;
  visible: boolean;
  area: DiscoveryBounds | null;
  onManualBounds: (bounds: DiscoveryBounds) => void;
}

export function MapFocusController({
  properties,
  highlightedId,
  visible,
  area,
  onManualBounds,
}: Props) {
  const map = useMap();
  const manual = useRef(false);
  const previousBoundsKey = useRef('');
  const lastFocus = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundsKey = properties
    .map((pg) => `${pg.id}:${pg.location?.latitude}:${pg.location?.longitude}`)
    .sort()
    .join('|');
  const areaKey = area ? `${area.south},${area.west},${area.north},${area.east}` : '';
  const focusedLocation = properties.find((pg) => pg.id === highlightedId)?.location;
  const latitude = focusedLocation?.latitude;
  const longitude = focusedLocation?.longitude;

  useMapEvents({
    dragstart() {
      manual.current = true;
    },
    moveend() {
      if (!manual.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const bounds = map.getBounds();
        onManualBounds({
          south: Math.max(-85, bounds.getSouth()),
          north: Math.min(85, bounds.getNorth()),
          west: Math.max(-180, bounds.getWest()),
          east: Math.min(180, bounds.getEast()),
        });
        manual.current = false;
      }, 250);
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    const markManual = () => {
      manual.current = true;
    };
    // Captures wheel, touch, keyboard, and native zoom-control interactions.
    container.addEventListener('wheel', markManual, { passive: true });
    container.addEventListener('pointerdown', markManual, { passive: true });
    container.addEventListener('keydown', markManual);
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);
    return () => {
      observer.disconnect();
      container.removeEventListener('wheel', markManual);
      container.removeEventListener('pointerdown', markManual);
      container.removeEventListener('keydown', markManual);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [map]);

  useEffect(() => {
    if (visible) map.invalidateSize({ pan: false });
  }, [map, visible]);

  useEffect(() => {
    const key = `${boundsKey}#${areaKey}`;
    if (!visible || previousBoundsKey.current === key) return;
    previousBoundsKey.current = key;
    manual.current = false;
    if (timer.current) clearTimeout(timer.current);
    map.stop();
    if (area) {
      map.fitBounds(
        [
          [area.south, area.west],
          [area.north, area.east],
        ],
        { animate: false, padding: [20, 20], maxZoom: 14 },
      );
    } else {
      const positions = properties.flatMap((pg): [number, number][] =>
        pg.location ? [[pg.location.latitude, pg.location.longitude]] : [],
      );
      if (positions.length)
        map.fitBounds(latLngBounds(positions), {
          animate: false,
          padding: [55, 55],
          maxZoom: positions.length === 1 ? 13 : 14,
        });
    }
    // Ordinary rerenders and pagination never reset the viewport.
  }, [map, boundsKey, areaKey, area, properties, visible]);

  useEffect(() => {
    if (!visible || !highlightedId || lastFocus.current === highlightedId) return;
    if (latitude === undefined || longitude === undefined) return;
    lastFocus.current = highlightedId;
    const task = setTimeout(() => {
      manual.current = false;
      if (timer.current) clearTimeout(timer.current);
      map.stop();
      const destination: [number, number] = [latitude, longitude];
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        map.setView(destination, Math.max(12, map.getZoom()), { animate: false });
      else map.flyTo(destination, Math.max(12, map.getZoom()), { duration: 0.65 });
    }, 120);
    return () => {
      clearTimeout(task);
      lastFocus.current = null;
    };
  }, [map, latitude, longitude, highlightedId, visible]);
  return null;
}
