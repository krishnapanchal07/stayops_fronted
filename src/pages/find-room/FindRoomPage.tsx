import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Select } from '@/components/forms/Select';
import { RoomListingCard } from '@/components/rooms/RoomListingCard';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { publicFindRoomDetailPath, tenantFindRoomDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { RENT_RANGE_LABELS, RentRange, type FindRoomFilters } from '@/types/inquiry';
import { ROOM_TYPE_LABELS, RoomType, SHARING_TYPE_LABELS, SharingType } from '@/types/room';
import { emptyFindRoomFilters } from '@/utils/roomListing';
import { Search } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PAGE_SIZE = 8;

export function FindRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isTenantPath = location.pathname.startsWith('/tenant');
  const [draft, setDraft] = useState<FindRoomFilters>(emptyFindRoomFilters());
  const [filters, setFilters] = useState<FindRoomFilters>(emptyFindRoomFilters());
  const [page, setPage] = useState(1);

  const listingsLoader = useCallback(() => roomService.getAvailablePage(filters,page,PAGE_SIZE), [filters,page]);
  const propertiesLoader = useCallback(() => propertyService.getPublicProperties(), []);
  const { data, status, error, reload } = useAsyncResource(listingsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);

  const listings = data?.items ?? [];
  const pageItems = listings;
  const detailPath = isTenantPath ? tenantFindRoomDetailPath : publicFindRoomDetailPath;

  const applySearch = () => {
    setPage(1);
    setFilters(draft);
  };

  return (
    <div>
      <PageHeader
        title="Find Room"
        description="Find your perfect room"
        breadcrumbs={
          isTenantPath
            ? [{ label: 'Home', href: '/tenant/dashboard' }, { label: 'Find Room' }]
            : [{ label: 'Find Room' }]
        }
      />

      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <Select
          label="Property"
          name="propertyId"
          value={draft.propertyId}
          options={[
            { value: '', label: 'All' },
            ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
          ]}
          onChange={(event) => setDraft((current) => ({ ...current, propertyId: event.target.value }))}
        />
        <Select
          label="Room Type"
          name="roomType"
          value={draft.roomType}
          options={[
            { value: '', label: 'All' },
            ...Object.values(RoomType).map((value) => ({ value, label: ROOM_TYPE_LABELS[value] })),
          ]}
          onChange={(event) =>
            setDraft((current) => ({ ...current, roomType: event.target.value as FindRoomFilters['roomType'] }))
          }
        />
        <Select
          label="Sharing Type"
          name="sharingType"
          value={draft.sharingType}
          options={[
            { value: '', label: 'All' },
            ...Object.values(SharingType).map((value) => ({ value, label: SHARING_TYPE_LABELS[value] })),
          ]}
          onChange={(event) =>
            setDraft((current) => ({ ...current, sharingType: event.target.value as FindRoomFilters['sharingType'] }))
          }
        />
        <Select
          label="Rent Range"
          name="rentRange"
          value={draft.rentRange}
          options={[
            { value: '', label: 'All' },
            ...Object.values(RentRange).map((value) => ({ value, label: RENT_RANGE_LABELS[value] })),
          ]}
          onChange={(event) =>
            setDraft((current) => ({ ...current, rentRange: event.target.value as FindRoomFilters['rentRange'] }))
          }
        />
        <div className="flex items-end">
          <Button leftIcon={<Search className="h-4 w-4" />} onClick={applySearch} fullWidth>
            Search
          </Button>
        </div>
      </div>

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load available rooms.'} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        listings.length === 0 ? (
          <EmptyState
            title="No rooms match these filters"
            description="Try a different property, sharing type, or rent range."
            actionLabel="Clear filters"
            onAction={() => {
              const reset = emptyFindRoomFilters();
              setDraft(reset);
              setFilters(reset);
              setPage(1);
            }}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium text-text">Available beds ({data?.total ?? 0})</p>
            {pageItems.map((listing) => (
              <RoomListingCard
                key={listing.id}
                listing={listing}
                onView={() => navigate(detailPath(listing.roomId, listing.bedId))}
              />
            ))}
            {(data?.total ?? 0) > PAGE_SIZE ? (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data?.total ?? 0}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        )
      ) : null}
    </div>
  );
}
