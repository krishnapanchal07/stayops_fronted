import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, List, Map as MapIcon, X } from 'lucide-react';
import { PATHS } from '@/routes/paths';
import { usePGDiscovery } from '@/hooks/usePGDiscovery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { parseDiscoveryFilters, sortPublicPGs } from '@/utils/pgDiscovery';
import { parseDiscoveryBounds } from '@/utils/propertyLocations';
import type { DiscoveryBounds, DiscoverySort, PublicPG } from '@/types/discovery';
import {
  DiscoveryFilters,
  type UpdateDiscoveryFilter,
} from '@/components/discovery/DiscoveryFilters';
import { DiscoveryCarousel } from '@/components/discovery/DiscoveryCarousel';
import { PGListingCard } from '@/components/discovery/PGListingCard';
import { DiscoveryMapPanel } from '@/components/discovery/DiscoveryMapPanel';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';

const PAGE_SIZE = 4;
const EMPTY_PROPERTIES: PublicPG[] = [];

export default function PublicPGSearchPage() {
  const [params, setParams] = useSearchParams();
  // Pagination/map state do not invalidate filter/aggregation memoization.
  const filterKey = [...params.entries()]
    .filter(([key]) => !['page', 'bounds', 'sort'].includes(key))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const filters = useMemo(() => parseDiscoveryFilters(new URLSearchParams(filterKey)), [filterKey]);
  const query = useDebouncedValue(filters.query, 300);
  const requestParams=new URLSearchParams(params);requestParams.set('query',query);requestParams.set('limit',String(PAGE_SIZE));requestParams.set('offset',String((Math.max(1,Number(params.get('page'))||1)-1)*PAGE_SIZE));
  const {data,status,error,reload}=usePGDiscovery(requestParams.toString());
  const properties=data?.items??EMPTY_PROPERTIES;
  const total=data?.total??0;
  const areaValue = params.get('bounds');
  const area = useMemo(() => parseDiscoveryBounds(areaValue), [areaValue]);
  const sortValue = params.get('sort');
  const sort: DiscoverySort =
    sortValue === 'rent-asc' || sortValue === 'rent-desc' || sortValue === 'distance'
      ? sortValue
      : 'name';
  const [selection, setSelection] = useState<{ id: string | null; source: 'card' | 'map' }>({
    id: null,
    source: 'card',
  });
  const highlightedId = selection.id;
  const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceMessage, setDistanceMessage] = useState('');
  const locationRequest = useRef(0);
  useEffect(
    () => () => {
      locationRequest.current += 1;
    },
    [],
  );
  const [mobileMap, setMobileMap] = useState(false);
  const [mapRequested, setMapRequested] = useState(false);
  const filtered=useMemo(()=>sortPublicPGs(properties,sort,origin),[properties,sort,origin]);
  const maxPage=Math.max(1,Math.ceil(total/PAGE_SIZE));
  const page=Math.max(1,Math.min(maxPage,Number(params.get('page'))||1));
  const pageItems=filtered;
  const validHighlight =
    highlightedId && filtered.some((pg) => pg.id === highlightedId) ? highlightedId : null;
  const matchedBeds = useMemo(
    () => filtered.reduce((total, pg) => total + pg.availableBedCount, 0),
    [filtered],
  );
  const missingLocations = useMemo(() => filtered.filter((pg) => !pg.location).length, [filtered]);

  const update: UpdateDiscoveryFilter = useCallback(
    (key, value) => {
      setSelection({ id: null, source: 'card' });
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          const param = key === 'amenities' ? 'amenity' : key;
          next.delete(param);
          next.delete('page');
          if (Array.isArray(value)) value.forEach((item) => next.append(param, item));
          else if (value) next.set(param, value);
          return next;
        },
        { replace: key === 'query', preventScrollReset: true },
      );
    },
    [setParams],
  );
  const clear = useCallback(() => {
    locationRequest.current += 1;
    setDistanceMessage('');
    setParams({}, { preventScrollReset: true });
    setSelection({ id: null, source: 'card' });
  }, [setParams]);
  const highlight = useCallback((id: string | null, source: 'card' | 'map' = 'card') => {
    setSelection((current) => (!id && current.source !== source ? current : { id, source }));
  }, []);
  const highlightMap = useCallback((id: string | null) => highlight(id, 'map'), [highlight]);
  const changePage = useCallback(
    (nextPage: number) => {
      setSelection({ id: null, source: 'card' });
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('page', String(nextPage));
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setParams],
  );
  const searchArea = useCallback(
    (bounds: DiscoveryBounds) => {
      setSelection({ id: null, source: 'card' });
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(
            'bounds',
            [bounds.south, bounds.west, bounds.north, bounds.east]
              .map((value) => value.toFixed(6))
              .join(','),
          );
          next.delete('page');
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setParams],
  );
  const clearArea = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('bounds');
        next.delete('page');
        return next;
      },
      { preventScrollReset: true },
    );

  const changeSort = (value: DiscoverySort) => {
    const request = ++locationRequest.current;
    const applySort = () =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('sort', value);
          next.delete('page');
          return next;
        },
        { preventScrollReset: true },
      );
    if (value !== 'distance' || origin) {
      setDistanceMessage('');
      applySort();
      return;
    }
    if (!navigator.geolocation) {
      setDistanceMessage('Location access is unavailable. Choose a price or name sort.');
      return;
    }
    setDistanceMessage('Waiting for location access to sort by approximate distance…');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== locationRequest.current) return;
        setOrigin({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setDistanceMessage('');
        applySort();
      },
      () => {
        if (request !== locationRequest.current) return;
        setDistanceMessage(
          'Location could not be accessed. Your existing sort is unchanged; you can still sort by price or name.',
        );
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex items-center gap-2 text-xs text-text-secondary"
      >
        <Link to={PATHS.home} className="hover:text-primary">
          Home
        </Link>
        <ChevronRight size={12} />
        <span aria-current="page">Explore Rooms</span>
      </nav>
      <DiscoveryCarousel
        onExplore={(amenity) => {
          if (amenity) update('amenities', [...new Set([...filters.amenities, amenity])]);
          document.getElementById('discovery-results')?.scrollIntoView({ block: 'start' });
        }}
      />
      <DiscoveryFilters
        filters={filters}
        properties={properties}
        options={data?.options}
        onChange={update}
        onClear={clear}
        sort={sort}
        onSort={changeSort}
      />
      {(distanceMessage || sort === 'distance') && (
        <p role="status" className="mb-4 text-xs text-text-secondary">
          {distanceMessage ||
            (origin
              ? 'Sorted by approximate straight-line distance from your location using demo map pins; not travel distance.'
              : 'Choose Distance again to allow location access and sort nearby stays.')}
        </p>
      )}
      {area && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-xs text-primary">
          <span>
            Showing properties within the selected map area. Unmapped properties are excluded while
            this restriction is active.
          </span>
          <button
            onClick={clearArea}
            className="inline-flex min-h-8 items-center gap-1 font-semibold"
          >
            <X size={14} />
            Remove area restriction
          </button>
        </div>
      )}
      {status === 'loading' && <LoadingSpinner label="Finding available properties" />}
      {status === 'error' && <ErrorState description={error ?? undefined} onRetry={reload} />}
      {status === 'success' && (
        <>
          <div
            id="discovery-results"
            className="mb-5 flex scroll-mt-24 flex-wrap items-center justify-between gap-4"
          >
            <div aria-live="polite" aria-atomic="true">
              <h2 className="text-sm font-semibold">
                {total} {total === 1 ? 'property' : 'properties'}
                {filters.city ? ` in ${filters.city}` : ''}
                <span className="ml-2 font-normal text-text-secondary">
                  · {matchedBeds} matching available beds
                </span>
              </h2>
              <p className="mt-1 text-[11px] text-text-secondary">
                {query !== filters.query
                  ? 'Updating search…'
                  : 'Rents and counts reflect your current filters.'}
                {missingLocations > 0
                  ? ` ${missingLocations} properties have no map location.`
                  : ''}
                {filters.gender
                  ? ' Gender policies are demo assignments; confirm with the property team.'
                  : ''}
              </p>
            </div>
            <button
              onClick={clear}
              className="min-h-10 text-xs font-medium text-primary underline underline-offset-4"
            >
              Clear all filters
            </button>
          </div>
          <div
            className="mb-4 flex rounded-xl border border-border bg-surface p-1 lg:hidden"
            role="group"
            aria-label="Discovery view"
          >
            <button
              aria-pressed={!mobileMap}
              onClick={() => setMobileMap(false)}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm ${!mobileMap ? 'bg-primary text-white' : 'text-text-secondary'}`}
            >
              <List size={16} />
              List
            </button>
            <button
              aria-pressed={mobileMap}
              onClick={() => {
                setMapRequested(true);
                setMobileMap(true);
              }}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm ${mobileMap ? 'bg-primary text-white' : 'text-text-secondary'}`}
            >
              <MapIcon size={16} />
              Map
            </button>
          </div>
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section
              aria-label="Property results"
              aria-busy={query !== filters.query}
              className={`${mobileMap ? 'hidden lg:block' : ''} min-w-0`}
            >
              {!filtered.length ? (
                <div className="rounded-2xl border border-border bg-surface">
                  <EmptyState
                    title="No stays match just yet"
                    description={
                      filters.gender && !properties.some((pg) => pg.genderPolicy)
                        ? 'Gender policies have not been supplied for these properties yet. Clear the gender filter to see available stays.'
                        : 'Try a different city, budget, gender, or amenity, or remove the map-area restriction.'
                    }
                    actionLabel="Clear filters"
                    onAction={clear}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {pageItems.map((pg) => (
                      <PGListingCard
                        key={pg.id}
                        property={pg}
                        highlighted={selection.source === 'card' && pg.id === validHighlight}
                        onHighlight={highlight}
                      />
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-border bg-surface">
                    <Pagination
                      page={page}
                      pageSize={PAGE_SIZE}
                      total={total}
                      onPageChange={changePage}
                    />
                  </div>
                </>
              )}
            </section>
            <DiscoveryMapPanel
              properties={filtered}
              highlightedId={validHighlight}
              focusId={selection.source === 'card' ? validHighlight : null}
              onHighlight={highlightMap}
              onSearchArea={searchArea}
              area={area}
              mobileMap={mobileMap}
              mapRequested={mapRequested}
            />
          </div>
        </>
      )}
    </>
  );
}
