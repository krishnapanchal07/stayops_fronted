import { memo, useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { divIcon, type Marker as LeafletMarker, type LeafletKeyboardEvent } from 'leaflet';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import type { PublicPG } from '@/types/discovery';
import { formatINR } from '@/utils/format';

interface Props {
  property: PublicPG;
  highlighted: boolean;
  onHighlight: (id: string | null) => void;
  onOpen: (id: string) => void;
}
export const PGMapMarker = memo(function PGMapMarker({
  property: pg,
  highlighted,
  onHighlight,
  onOpen,
}: Props) {
  const marker = useRef<LeafletMarker>(null);
  const map = useMap();
  const subscribeZoom = useCallback(
    (notify: () => void) => {
      map.on('zoomend', notify);
      return () => {
        map.off('zoomend', notify);
      };
    },
    [map],
  );
  const compact = useSyncExternalStore(subscribeZoom, () => map.getZoom() < 10);
  const icons = useMemo(() => {
    const create = (active: boolean, small = false) =>
      divIcon({
        className: `stayops-price-marker${active ? ' is-highlighted' : ''}${small ? ' is-compact' : ''}`,
        html: `<span>${(Number.isFinite(pg.startingRent) ? formatINR(pg.startingRent) : 'Rooms coming soon')}</span><svg viewBox="0 0 12 8" aria-hidden="true"><path d="M0 0h12L6 8z"/></svg>`,
        iconSize: small ? [44, 44] : [86, 38],
        iconAnchor: small ? [22, 22] : [43, 38],
        tooltipAnchor: [0, -40],
      });
    return { normal: create(false), active: create(true), compact: create(false, true) };
  }, [pg.startingRent]);
  const handlers = useMemo(
    () => ({
      mouseover: () => onHighlight(pg.id),
      mouseout: () => onHighlight(null),
      click: () => onOpen(pg.id),
      keydown: (event: LeafletKeyboardEvent) => {
        if (event.originalEvent.key === 'Enter' || event.originalEvent.key === ' ') {
          event.originalEvent.preventDefault();
          onOpen(pg.id);
        }
      },
    }),
    [pg.id, onHighlight, onOpen],
  );
  useEffect(() => {
    const element = marker.current?.getElement();
    if (!element) return;
    const focus = () => onHighlight(pg.id);
    const blur = () => onHighlight(null);
    const activate = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      onOpen(pg.id);
    };
    element.setAttribute('role', 'link');
    element.setAttribute(
      'aria-label',
      `View ${pg.name}, from ${(Number.isFinite(pg.startingRent) ? formatINR(pg.startingRent) : 'Rooms coming soon')} per bed per month. Property location.`,
    );
    element.addEventListener('focus', focus);
    element.addEventListener('blur', blur);
    element.addEventListener('keydown', activate);
    return () => {
      element.removeEventListener('focus', focus);
      element.removeEventListener('blur', blur);
      element.removeEventListener('keydown', activate);
    };
  }, [pg.id, pg.name, pg.startingRent, highlighted, compact, onHighlight, onOpen]);
  if (!pg.location) return null;
  return (
    <Marker
      ref={marker}
      position={[pg.location.latitude, pg.location.longitude]}
      icon={highlighted ? icons.active : compact ? icons.compact : icons.normal}
      zIndexOffset={highlighted ? 1000 : 0}
      eventHandlers={handlers}
      title={`View ${pg.name}`}
      keyboard
      autoPanOnFocus={false}
    >
      <Tooltip direction="top" opacity={1}>
        {pg.name}
        <br />
        From {(Number.isFinite(pg.startingRent) ? formatINR(pg.startingRent) : 'Rooms coming soon')} / bed / month
        <br />
        {pg.city} · property location
      </Tooltip>
    </Marker>
  );
});
