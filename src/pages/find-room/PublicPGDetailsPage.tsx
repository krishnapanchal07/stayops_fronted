import { PropertyGallery } from '@/components/properties/PropertyGallery';
import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BedDouble, Check, ChevronRight, MapPin } from 'lucide-react';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { aggregatePublicPGs } from '@/utils/pgDiscovery';
import { toAvailableListings } from '@/utils/roomListing';
import { workflowRequest } from '@/services/http/workflows';
import { PROPERTY_TYPE_LABELS, PropertyStatus } from '@/types/property';
import { ROOM_TYPE_LABELS, SHARING_TYPE_LABELS } from '@/types/room';
import type { DiscoveryRoom } from '@/types/discovery';
import { publicFindRoomDetailPath, PATHS } from '@/routes/paths';
import { formatINR } from '@/utils/format';
import { DiscoveryImage } from '@/components/discovery/DiscoveryImage';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Pagination } from '@/components/common/Pagination';

function AvailableRoom({ room }: { room: DiscoveryRoom }) {
  const [selectedBedId, setSelectedBedId] = useState(room.beds[0].bedId);
  const bed = room.beds.find((item) => item.bedId === selectedBedId) ?? room.beds[0];
  const image = useMemo(
    () =>
      [...room.images]
        .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
        .find((candidate) => candidate.url),
    [room.images],
  );
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface sm:flex-row">
      <DiscoveryImage
        image={image}
        name={`Room ${room.roomNumber}`}
        className="h-44 shrink-0 sm:h-auto sm:w-48"
      />
      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">Room {room.roomNumber}</h3>
          <span className="rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-semibold text-green-800">
            {room.beds.length} available {room.beds.length === 1 ? 'bed' : 'beds'}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          {room.buildingName} · {room.floorName} · {ROOM_TYPE_LABELS[room.roomType]} ·{' '}
          {SHARING_TYPE_LABELS[room.sharingType]}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-md bg-background px-2 py-1 text-[10px] text-text-secondary"
            >
              {amenity}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <label className="min-w-40 text-xs font-medium">
            Available bed
            <select
              value={bed.bedId}
              onChange={(event) => setSelectedBedId(event.target.value)}
              className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-background px-3 text-xs"
            >
              {room.beds.map((item) => (
                <option value={item.bedId} key={item.bedId}>
                  Bed {item.bedNumber} · {formatINR(item.monthlyRent)}/month
                </option>
              ))}
            </select>
          </label>
          <Link
            to={publicFindRoomDetailPath(room.roomId, bed.bedId)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            View Room Details <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function PublicPGDetailsPage() {
  const { propertyId = '' } = useParams();
  return <PublicPGDetails key={propertyId} propertyId={propertyId} />;
}

function PublicPGDetails({ propertyId }: { propertyId: string }) {
  const [page, setPage] = useState(1);
  const loader = useCallback(async () => {
    const [property, rooms, discovery] = await Promise.all([
      propertyService.getPublicPropertyById(propertyId),
      roomService.getPublicPage(propertyId,page),
      workflowRequest<{counts:Record<string,{availableRoomCount:number;availableBedCount:number;startingRent:number}>}>('get',`/public/discovery?propertyId=${encodeURIComponent(propertyId)}`),
    ]);
    if (property.status !== PropertyStatus.ACTIVE) return { property: null, pg: null, total:0 };
    const pg=aggregatePublicPGs([property], toAvailableListings(rooms.items))[0] ?? null;
    return { property, pg:pg ? {...pg,...discovery.counts[propertyId]} : null, total:rooms.total };
  }, [propertyId,page]);
  const { data, status, error, reload } = useAsyncResource(loader);
  if (status === 'loading') return <LoadingSpinner label="Loading property" />;
  if (status === 'error')
    return (
      <>
        <Link to={PATHS.findRoom} className="text-sm text-primary">
          ← Back to search
        </Link>
        <ErrorState
          title="Property unavailable"
          description={error ?? 'This property could not be loaded.'}
          onRetry={reload}
        />
      </>
    );
  if (!data?.property || data.property.id !== propertyId)
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <h1 className="text-2xl font-bold">Property unavailable</h1>
        <p className="mt-3 text-sm text-text-secondary">
          This property is not currently available for public discovery.
        </p>
        <Link className="mt-5 inline-block text-sm font-semibold text-primary" to={PATHS.findRoom}>
          Explore available properties
        </Link>
      </div>
    );
  const { property, pg } = data;
  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-secondary"
      >
        <Link to={PATHS.home}>Home</Link>
        <ChevronRight size={12} />
        <Link to={PATHS.findRoom}>Explore Rooms</Link>
        <ChevronRight size={12} />
        <span aria-current="page">{property.name}</span>
      </nav>
      <Link
        to={PATHS.findRoom}
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-primary"
      >
        <ArrowLeft size={15} />
        Back to all properties
      </Link>
      {property.isDemo && <p className="mb-4 rounded-xl bg-warning-soft p-3">DEMO — development accommodation, not a real listing.</p>}
      <PropertyGallery propertyId={property.id} images={property.images ?? []} editable={false} onChange={reload} />
      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
            {PROPERTY_TYPE_LABELS[property.type]}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{property.name}</h1>
          <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-text-secondary">
            <MapPin size={17} className="mt-1 shrink-0" />
            {property.address}, {property.city}, {property.state} {property.postalCode}
          </p>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-text-secondary">
            {property.description}
          </p>
          <h2 className="mt-8 text-lg font-bold">Property amenities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {property.amenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs"
              >
                <Check size={13} className="text-primary" />
                {amenity}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-text-secondary">
            Room amenities can differ. Check each room before submitting an inquiry.
          </p>
        </div>
        <div>
          <DiscoveryImage
            image={pg?.image}
            name={property.name}
            className="aspect-4/3 rounded-2xl border border-border"
          />
          <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs text-text-secondary">Starting monthly rent per bed</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {pg && Number.isFinite(pg.startingRent) ? formatINR(pg.startingRent) : 'Rooms coming soon'}
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
              <BedDouble size={16} />
              {pg?.availableRoomCount ?? 0} available rooms · {pg?.availableBedCount ?? 0} available
              beds
            </p>
            <p className="mt-3 text-[11px] leading-5 text-text-secondary">
              {pg?.location
                ? 'Map positions use property coordinates supplied by the property team.'
                : 'A map location is not currently available for this property.'}
            </p>
          </div>
        </div>
      </div>
      <section className="mt-12" aria-labelledby="available-rooms">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="available-rooms" className="text-2xl font-bold tracking-tight">
              Available rooms
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Choose an available bed, review its room, and send an inquiry to the property team.
            </p>
          </div>
          <span className="text-xs text-text-secondary">
            Inquiries are requests, not confirmed bookings.
          </span>
        </div>
        {!pg ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-sm text-text-secondary">
            There are no available beds at this property right now.{' '}
            <Link to={PATHS.findRoom} className="font-semibold text-primary">
              Explore other stays.
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {pg.rooms.map((room) => (
                <AvailableRoom key={room.roomId} room={room} />
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-border bg-surface">
              <Pagination
                page={page}
                pageSize={6}
                total={data.total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </section>
    </>
  );
}
