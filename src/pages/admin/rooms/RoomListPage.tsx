import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyIndicator } from '@/components/rooms/OccupancyIndicator';
import { RoomForm } from '@/components/rooms/RoomForm';
import { RoomStatusModal } from '@/components/rooms/RoomStatusModal';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS, roomDetailPath, wardenRoomDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import type { DataTableColumn } from '@/types/ui';
import {
  ROOM_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  RoomStatus,
  RoomType,
  SHARING_TYPE_LABELS,
  SharingType,
  type RoomFilters,
  type RoomFormValues,
  type RoomListItem,
} from '@/types/room';
import { formatINR } from '@/utils/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { emptyRoomFilters, toRoomFormValues } from '@/utils/roomValidation';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState, type SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function RoomListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.ROOM_CREATE);
  const canEdit = useHasPermission(Permission.ROOM_EDIT);
  const homeHref = isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;
  const detailPath = isWarden ? wardenRoomDetailPath : roomDetailPath;
  const allowedPropertyIds = isWarden ? user?.propertyIds : undefined;

  const [filters, storeFilters] = useState<RoomFilters>(emptyRoomFilters);
  const [page,setPage]=useState(1);
  const [sort,setSort]=useState({id:'roomNumber',direction:'asc' as 'asc'|'desc'});
  const setFilters=(next:SetStateAction<RoomFilters>)=>{storeFilters(next);setPage(1);};
  const query=useDebouncedValue(filters.query);
  const params=new URLSearchParams({...filters,query,offset:String((page-1)*10),limit:'10',sortBy:sort.id,sortDirection:sort.direction}).toString();
  const roomsLoader=useCallback(async()=>{
    const [result,summary]=await Promise.all([roomService.getPage(new URLSearchParams(params)),roomService.getRoomSummary()]);
    return {...result,summary};
  },[params]);
  const propertiesLoader = useCallback(async () => {
    const properties = await propertyService.getProperties();
    if (!isWarden) return properties;
    return properties.filter((property) => (allowedPropertyIds ?? []).includes(property.id));
  }, [allowedPropertyIds, isWarden]);
  const { data, status, error, reload } = useAsyncResource(roomsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<RoomListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<RoomListItem | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const rooms = useMemo(() => data?.items ?? [], [data]);
  const propertyOptions = properties ?? [];
  const filtered = rooms;
  const summary = data?.summary ?? {totalRooms:0,availableRooms:0,fullRooms:0,maintenanceRooms:0,occupiedBeds:0,totalBeds:0};
  const selectedProperty = propertyOptions.find((property) => property.id === filters.propertyId);
  const selectedBuilding = selectedProperty?.buildings.find((building) => building.id === filters.buildingId);
  const filtersActive = Object.values(filters).some(Boolean);

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = async (room: RoomListItem) => {
    try { const full=await roomService.getRoomById(room.id); setFormMode('edit');setEditing(full);setFormOpen(true); }
    catch(cause) {toast('error',cause instanceof Error?cause.message:'Unable to load room.');}
  };

  const handleSave = async (values: RoomFormValues) => {
    setSaving(true);
    try {
      if (formMode === 'edit' && editing) {
        await roomService.updateRoom(editing.id, values);
        toast('success', 'Room updated successfully.');
      } else {
        await roomService.createRoom(values);
        toast('success', 'Room created successfully.');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to save room.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: RoomListItem['status']) => {
    if (!statusTarget) return;
    setStatusSaving(true);
    try {
      await roomService.changeRoomStatus(statusTarget.id, nextStatus);
      toast('success', 'Room status updated successfully.');
      setStatusTarget(null);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update room status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const columns: DataTableColumn<RoomListItem>[] = [
    {
      id: 'roomNumber',
      header: 'Room',
      accessor: 'roomNumber',
      sortable: true,
      render: (row) => <span className="font-semibold text-text">{row.roomNumber}</span>,
    },
    { id: 'property', header: 'Property', accessor: 'propertyName', sortable: true },
    {
      id: 'location',
      header: 'Building / Floor',
      accessor: 'floorName',
      sortable: true,
      render: (row) => `${row.buildingName} / ${row.floorName}`,
    },
    {
      id: 'type',
      header: 'Type',
      accessor: 'roomType',
      sortable: true,
      render: (row) => ROOM_TYPE_LABELS[row.roomType],
    },
    {
      id: 'sharing',
      header: 'Sharing',
      accessor: 'sharingType',
      sortable: true,
      render: (row) => SHARING_TYPE_LABELS[row.sharingType],
    },
    {
      id: 'beds',
      header: 'Beds',
      accessor: 'occupiedBeds',
      sortable: false,
      render: (row) => `${row.occupiedBeds} / ${row.capacity}`,
    },
    {
      id: 'occupancy',
      header: 'Occupancy',
      accessor: 'occupancyPercent',
      sortable: false,
      render: (row) => (
        <div className="min-w-28">
          <OccupancyIndicator
            percent={row.occupancyPercent}
            occupied={row.occupiedBeds}
            capacity={row.capacity}
          />
        </div>
      ),
    },
    {
      id: 'rent',
      header: 'Rent',
      accessor: 'monthlyRent',
      sortable: true,
      render: (row) => formatINR(row.monthlyRent),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusPill value={ROOM_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <RoomActions
          room={row}
          canEdit={canEdit}
          onView={() => navigate(detailPath(row.id))}
          onEdit={() => openEdit(row)}
          onChangeStatus={() => setStatusTarget(row)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Rooms"
        description={
          isWarden
            ? 'Review occupancy, beds and maintenance status for your assigned properties.'
            : 'Manage room inventory, occupancy and bed availability.'
        }
        breadcrumbs={[
          { label: 'Home', href: homeHref },
          { label: 'Rooms' },
        ]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Room
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load rooms.'} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              metric={{ id: 'rooms', label: 'Total Rooms', value: String(summary.totalRooms), tone: 'primary' }}
            />
            <StatCard
              metric={{
                id: 'available',
                label: 'Available Rooms',
                value: String(summary.availableRooms),
                tone: 'success',
              }}
            />
            <StatCard
              metric={{ id: 'full', label: 'Occupied / Full', value: String(summary.fullRooms), tone: 'info' }}
            />
            <StatCard
              metric={{
                id: 'maintenance',
                label: 'Maintenance',
                value: String(summary.maintenanceRooms),
                tone: 'warning',
                hint: `${summary.occupiedBeds} / ${summary.totalBeds} beds occupied`,
              }}
            />
          </div>

          <Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SearchInput
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search room, property, building, floor"
                aria-label="Search rooms"
              />
              <Select
                name="propertyFilter"
                value={filters.propertyId}
                options={[
                  { label: 'All properties', value: '' },
                  ...propertyOptions.map((property) => ({ value: property.id, label: property.name })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    propertyId: event.target.value,
                    buildingId: '',
                    floorId: '',
                  }))
                }
              />
              <Select
                name="buildingFilter"
                value={filters.buildingId}
                options={[
                  { label: 'All buildings', value: '' },
                  ...(selectedProperty?.buildings ?? []).map((building) => ({
                    value: building.id,
                    label: building.name,
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, buildingId: event.target.value, floorId: '' }))
                }
              />
              <Select
                name="floorFilter"
                value={filters.floorId}
                options={[
                  { label: 'All floors', value: '' },
                  ...(selectedBuilding?.floors ?? []).map((floor) => ({ value: floor.id, label: floor.name })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, floorId: event.target.value }))}
              />
              <Select
                name="typeFilter"
                value={filters.roomType}
                options={[
                  { label: 'All room types', value: '' },
                  ...Object.values(RoomType).map((value) => ({ value, label: ROOM_TYPE_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    roomType: event.target.value as RoomFilters['roomType'],
                  }))
                }
              />
              <Select
                name="sharingFilter"
                value={filters.sharingType}
                options={[
                  { label: 'All sharing types', value: '' },
                  ...Object.values(SharingType).map((value) => ({
                    value,
                    label: SHARING_TYPE_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    sharingType: event.target.value as RoomFilters['sharingType'],
                  }))
                }
              />
              <Select
                name="statusFilter"
                value={filters.status}
                options={[
                  { label: 'All statuses', value: '' },
                  ...Object.values(RoomStatus).map((value) => ({ value, label: ROOM_STATUS_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as RoomFilters['status'],
                  }))
                }
              />
              <Select
                name="availabilityFilter"
                value={filters.availability}
                options={[
                  { label: 'All availability', value: '' },
                  { label: 'Has available beds', value: 'HAS_AVAILABLE' },
                  { label: 'No available beds', value: 'NO_AVAILABLE' },
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    availability: event.target.value as RoomFilters['availability'],
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <Button variant="outline" onClick={() => setFilters(emptyRoomFilters)} disabled={!filtersActive}>
                Clear Filters
              </Button>
            </div>
          </Card>

          {rooms.length === 0 ? (
            <EmptyState
              title="No rooms found."
              description="Try adjusting your filters or create a new room."
              actionLabel={canCreate ? 'Add Room' : undefined}
              onAction={canCreate ? openCreate : undefined}
            />
          ) : (
            <DataTable
              key={`${filters.propertyId}-${filters.buildingId}-${filters.floorId}-${filters.status}`}
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={false}
              pageSize={10}
              serverPagination={{page,pageSize:10,total:data?.total??0,onPageChange:setPage}}
              serverSorting={{...sort,onSort:(id,direction)=>{setSort({id,direction});setPage(1);}}}
              emptyTitle="No rooms found."
              emptyDescription="Try adjusting your filters or create a new room."
              renderMobile={(row) => (
                <RoomMobileCard
                  room={row}
                  canEdit={canEdit}
                  onView={() => navigate(detailPath(row.id))}
                  onEdit={() => openEdit(row)}
                  onChangeStatus={() => setStatusTarget(row)}
                />
              )}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title={formMode === 'create' ? 'Add Room' : 'Edit Room'}
        onClose={() => setFormOpen(false)}
        className="max-w-2xl"
      >
        <RoomForm
          key={editing?.id ?? 'create'}
          mode={formMode}
          properties={propertyOptions}
          rooms={rooms}
          editingId={editing?.id}
          initialValues={editing ? toRoomFormValues(editing) : undefined}
          submitting={saving}
          onSubmit={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <RoomStatusModal
        key={statusTarget?.id ?? 'room-status'}
        open={Boolean(statusTarget)}
        room={statusTarget}
        submitting={statusSaving}
        onClose={() => setStatusTarget(null)}
        onSubmit={handleStatusChange}
      />
    </div>
  );
}

interface RoomActionProps {
  room: RoomListItem;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
}

function RoomActions({ room, canEdit, onView, onEdit, onChangeStatus }: RoomActionProps) {
  const items = [
    { id: 'view', label: 'View', onSelect: onView },
    ...(canEdit
      ? [
          { id: 'edit', label: 'Edit', onSelect: onEdit },
          { id: 'status', label: 'Change Status', onSelect: onChangeStatus },
        ]
      : []),
  ];

  return (
    <Dropdown
      trigger={
        <IconButton label={`Actions for room ${room.roomNumber}`} size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      }
      items={items}
    />
  );
}

function RoomMobileCard({ room, canEdit, onView, onEdit, onChangeStatus }: RoomActionProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">Room {room.roomNumber}</p>
          <p className="typo-helper">{room.propertyName}</p>
        </div>
        <StatusPill value={ROOM_STATUS_LABELS[room.status]} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="typo-muted">Sharing</span>
          <span className="mt-0.5 block font-medium">{SHARING_TYPE_LABELS[room.sharingType]}</span>
        </p>
        <p>
          <span className="typo-muted">Occupancy</span>
          <span className="mt-0.5 block font-medium">
            {room.occupiedBeds} / {room.capacity} · {room.occupancyPercent}%
          </span>
        </p>
        <p>
          <span className="typo-muted">Rent</span>
          <span className="mt-0.5 block font-medium">{formatINR(room.monthlyRent)}</span>
        </p>
        <p>
          <span className="typo-muted">Location</span>
          <span className="mt-0.5 block font-medium">
            {room.buildingName} / {room.floorName}
          </span>
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button size="sm" onClick={onView}>
          View
        </Button>
        <RoomActions
          room={room}
          canEdit={canEdit}
          onView={onView}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
        />
      </div>
    </div>
  );
}
