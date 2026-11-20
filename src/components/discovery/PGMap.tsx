import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import type { TileLayer as LeafletTileLayer } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { LocateFixed, RefreshCw, Info } from 'lucide-react';
import type { DiscoveryBounds, PublicPG } from '@/types/discovery';
import { publicPropertyDetailPath } from '@/routes/paths';
import { discoveryMapConfig } from '@/config/discoveryMap';
import { PGMapMarker } from './PGMapMarker';
import { MapFocusController } from './MapFocusController';
import 'leaflet/dist/leaflet.css';
import '@/styles/discovery-map.css';

export interface PGMapProps {
  properties: PublicPG[];
  highlightedId: string | null;
  focusId: string | null;
  onHighlight: (id: string | null) => void;
  onSearchArea: (bounds: DiscoveryBounds) => void;
  visible: boolean;
  area: DiscoveryBounds | null;
}

export default memo(function PGMap({
  properties,
  highlightedId,
  focusId,
  onHighlight,
  onSearchArea,
  visible,
  area,
}: PGMapProps) {
  const navigate = useNavigate();
  const [pendingBounds, setPendingBounds] = useState<DiscoveryBounds | null>(null);
  const [tileError, setTileError] = useState(false);
  const tiles = useRef<LeafletTileLayer>(null);
  const openProperty = useCallback(
    (id: string) => navigate(publicPropertyDetailPath(id)),
    [navigate],
  );
  const mapped = useMemo(() => properties.filter((pg) => pg.location), [properties]);
  const tileEvents = useMemo(() => ({ tileerror: () => setTileError(true) }), []);
  const handleManualBounds = useCallback((bounds: DiscoveryBounds) => setPendingBounds(bounds), []);
  return (
    <div className="stayops-discovery-map relative isolate overflow-hidden rounded-2xl border border-border bg-primary-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <h2 className="text-sm font-semibold">Explore the neighbourhood</h2>
        <span className="text-[10px] text-text-secondary">{mapped.length} mapped properties</span>
      </div>
      <div className="relative h-[min(65svh,680px)] min-h-96">
        <MapContainer
          center={[22.5, 73]}
          zoom={6}
          minZoom={discoveryMapConfig.minZoom}
          maxZoom={discoveryMapConfig.maxZoom}
          maxBounds={[
            [-85, -180],
            [85, 180],
          ]}
          maxBoundsViscosity={1}
          scrollWheelZoom={true}
          dragging
          touchZoom
          doubleClickZoom
          zoomControl={false}
          className="h-full w-full"
          aria-label="Available properties map. Demo locations are approximate."
        >
          <TileLayer
            ref={tiles}
            url={discoveryMapConfig.tileUrl}
            attribution={discoveryMapConfig.attribution}
            maxZoom={18}
            noWrap
            keepBuffer={1}
            eventHandlers={tileEvents}
          />
          <ZoomControl position="bottomright" />
          <MapFocusController
            properties={mapped}
            highlightedId={focusId}
            visible={visible}
            area={area}
            onManualBounds={handleManualBounds}
          />
          {mapped.map((pg) => (
            <PGMapMarker
              key={pg.id}
              property={pg}
              highlighted={highlightedId === pg.id}
              onHighlight={onHighlight}
              onOpen={openProperty}
            />
          ))}
        </MapContainer>
        {pendingBounds && (
          <button
            className="absolute top-4 left-1/2 z-[1000] inline-flex min-h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-primary shadow-lg"
            onClick={() => {
              onSearchArea(pendingBounds);
              setPendingBounds(null);
            }}
          >
            <LocateFixed size={15} />
            Search in this area
          </button>
        )}
        {tileError && (
          <div
            role="status"
            className="absolute right-3 bottom-16 left-3 z-[1000] rounded-xl border border-border bg-white/95 p-3 text-xs text-text-secondary shadow-sm"
          >
            Some map tiles could not load. Listings and property markers remain available.
            <button
              onClick={() => {
                setTileError(false);
                tiles.current?.redraw();
              }}
              className="mt-2 flex items-center gap-1 font-semibold text-primary"
            >
              <RefreshCw size={13} />
              Retry tiles
            </button>
          </div>
        )}
        {!mapped.length && (
          <div className="pointer-events-none absolute inset-x-6 top-24 z-[1000] rounded-xl bg-white/95 p-4 text-center text-xs text-text-secondary shadow-sm">
            No mapped properties match these filters. Properties without coordinates still appear in
            the list unless an area filter is active.
          </div>
        )}
      </div>
      <div className="flex items-start gap-2 border-t border-border bg-surface p-3 text-[10px] leading-5 text-text-secondary">
        <Info size={14} className="mt-0.5 shrink-0" />
        <p>
          Demo pins show approximate localities, not verified buildings. Prices are per bed per
          month. The map shows all filtered properties, across listing pages.
        </p>
      </div>
    </div>
  );
});
