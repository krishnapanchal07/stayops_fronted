import { BedEditor } from '@/components/rooms/BedEditor';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { OccupancyIndicator } from '@/components/rooms/OccupancyIndicator';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { BedAssignmentModal } from '@/components/rooms/BedAssignmentModal';
import { BedCard } from '@/components/rooms/BedCard';
import { RoomForm } from '@/components/rooms/RoomForm';
import { RoomGallery } from '@/components/rooms/RoomGallery';
import { RoomStatusModal } from '@/components/rooms/RoomStatusModal';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS, buildingDetailPath, propertyDetailPath, tenantDetailPath, wardenTenantDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { tenantService } from '@/services/tenant/tenantService';
import {
  BED_STATUS_LABELS,
  ROOM_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  SHARING_TYPE_LABELS,
  BedStatus,
  type AssignBedInput,
  type Bed,
  type RoomFormValues,
  type RoomListItem,
} from '@/types/room';
import { formatINR } from '@/utils/format';
import { canAllocateRoom } from '@/utils/roomStats';
import { toRoomFormValues } from '@/utils/roomValidation';
import { Pencil } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

export function RoomDetailsPage() {
  const { roomId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isWarden = location.pathname.startsWith('/warden');
  const canEdit = useHasPermission(Permission.ROOM_EDIT);
  const canAllocate = useHasPermission(Permission.ROOM_ALLOCATE);
  const homeHref = isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;
  const listHref = isWarden ? PATHS.warden.rooms : PATHS.admin.rooms;
  const tenantPath = isWarden ? wardenTenantDetailPath : tenantDetailPath;
  const roomLoader = useCallback(() => roomService.getRoomById(roomId), [roomId]);
  const roomsLoader = useCallback(() => roomService.getRooms(), []);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const tenantsLoader = useCallback(() => canAllocate ? roomService.getAssignableTenants() : Promise.resolve([]), [canAllocate]);
  const { data: room, status, error, reload } = useAsyncResource(roomLoader);
  const { data: rooms } = useAsyncResource(roomsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: tenants, reload: reloadTenants } = useAsyncResource(tenantsLoader);

  const [formOpen, setFormOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [assignBed, setAssignBed] = useState<Bed | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [releaseBed, setReleaseBed] = useState<Bed | null>(null);
  const [releasing, setReleasing] = useState(false);

  const handleSave = async (values: RoomFormValues) => {
    if (!room) return;
    setSaving(true);
    try {
      await roomService.updateRoom(room.id, values);
      toast('success', 'Room updated successfully.');
      setFormOpen(false);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to save room.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus: RoomListItem['status']) => {
    if (!room) return;
    setStatusSaving(true);
    try {
      await roomService.changeRoomStatus(room.id, nextStatus);
      toast('success', 'Room status updated successfully.');
      setStatusOpen(false);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update room status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleAssign = async (input: AssignBedInput) => {
    if (!room || !assignBed) return;
    setAssigning(true);
    try {
      await roomService.assignBed(room.id, assignBed.id, input);
      toast('success', 'Bed assigned successfully.');
      setAssignBed(null);
      reload();
      reloadTenants();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to assign this bed.');
    } finally {
      setAssigning(false);
    }
  };

  const handleRelease = async () => {
    if (!room || !releaseBed) return;
    setReleasing(true);
    try {
      await roomService.releaseBed(room.id, releaseBed.id);
      toast('success', `${releaseBed.label} is now available.`);
      setReleaseBed(null);
      reload();
      reloadTenants();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to release this bed.');
    } finally {
      setReleasing(false);
    }
  };

  const handleBedStatus = async (bed: Bed, nextStatus: Bed['status']) => {
    if (!room) return;
    try {
      await roomService.updateBed(room.id, bed.id, nextStatus);
      toast('success', `${bed.label} is now ${BED_STATUS_LABELS[nextStatus].toLowerCase()}.`);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update this bed.');
    }
  };

  return (
    <div>
      {status === 'loading' ? <DashboardSkeleton cards={6} /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this room.'} onRetry={reload} />
      ) : null}

      {status === 'success' && room && isWarden && !(user?.propertyIds ?? []).includes(room.propertyId) ? (
        <ErrorState
          title="Room not found."
          description="This room is outside your assigned properties."
        />
      ) : null}

      {status === 'success' && room && (!isWarden || (user?.propertyIds ?? []).includes(room.propertyId)) ? (
        <>
          <PageHeader
            title={`Room ${room.roomNumber}`}
            description={`${room.propertyName} · ${room.buildingName} · ${room.floorName}`}
            breadcrumbs={[
              { label: 'Home', href: homeHref },
              { label: 'Rooms', href: listHref },
              { label: `Room ${room.roomNumber}` },
            ]}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill value={ROOM_STATUS_LABELS[room.status]} />
                {canEdit ? (
                  <>
                    <Button variant="danger" onClick={async()=>{try{await roomService.archive(room.id);reload();}catch(cause){toast('error',cause instanceof Error?cause.message:'Unable to archive.');}}}>Archive Room</Button>
                    <Button variant="outline" onClick={() => setStatusOpen(true)}>
                      Change Status
                    </Button>
                    <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                      Edit
                    </Button>
                  </>
                ) : null}
              </div>
            }
            showBack
          />

          <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <RoomGallery
                key={room.images.map((image) => `${image.id}:${image.isPrimary}:${image.sortOrder}`).join('|')}
                images={room.images}
                roomNumber={room.roomNumber}
              />
              <Card>
                <CardHeader title="Room Summary" />
                <dl className="grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Room number" value={room.roomNumber} />
                  <InfoRow
                    label="Property"
                    value={
                      isWarden ? (
                        room.propertyName
                      ) : (
                        <Link className="text-primary hover:underline" to={propertyDetailPath(room.propertyId)}>
                          {room.propertyName}
                        </Link>
                      )
                    }
                  />
                  <InfoRow
                    label="Building"
                    value={
                      isWarden ? (
                        room.buildingName
                      ) : (
                        <Link
                          className="text-primary hover:underline"
                          to={buildingDetailPath(room.propertyId, room.buildingId)}
                        >
                          {room.buildingName}
                        </Link>
                      )
                    }
                  />
                  <InfoRow label="Floor" value={room.floorName} />
                  <InfoRow label="Room type" value={ROOM_TYPE_LABELS[room.roomType]} />
                  <InfoRow label="Sharing" value={SHARING_TYPE_LABELS[room.sharingType]} />
                  <InfoRow label="Monthly rent" value={`${formatINR(room.monthlyRent)}/month`} />
                  <InfoRow label="Security deposit" value={formatINR(room.securityDeposit)} />
                </dl>
              </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard metric={{ id: 'capacity', label: 'Capacity', value: String(room.capacity), tone: 'primary' }} />
              <StatCard
                metric={{ id: 'occupied', label: 'Occupied', value: String(room.occupiedBeds), tone: 'info' }}
              />
              <StatCard
                metric={{ id: 'available', label: 'Available', value: String(room.availableBeds), tone: 'success' }}
              />
              <StatCard
                metric={{
                  id: 'occupancy',
                  label: 'Occupancy',
                  value: `${room.occupancyPercent}%`,
                  tone: 'warning',
                  hint: `${room.occupiedBeds} / ${room.capacity} beds`,
                }}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <OccupancyChart
                percent={room.occupancyPercent}
                occupied={room.occupiedBeds}
                vacant={room.availableBeds}
                slices={[
                  { name: 'Occupied', value: room.occupiedBeds },
                  { name: 'Vacant', value: room.availableBeds },
                ]}
              />
              <Card>
                <CardHeader title="Occupancy" />
                <OccupancyIndicator
                  percent={room.occupancyPercent}
                  occupied={room.occupiedBeds}
                  capacity={room.capacity}
                />
                <p className="typo-secondary mt-4">{room.description || 'No description added yet.'}</p>
              </Card>
            </div>

            <Card>
              <CardHeader title="Amenities" />
              {room.amenities.length === 0 ? (
                <p className="typo-secondary">No amenities listed yet.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Beds" />
              {!canAllocateRoom(room) ? (
                <p className="typo-secondary mb-4">
                  This room is not available for allocation while it is {ROOM_STATUS_LABELS[room.status].toLowerCase()}.
                </p>
              ) : null}
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {room.beds.map((bed) => (
                  <li key={bed.id}>
                    {canEdit && <BedEditor key={`${bed.id}:${bed.rent}:${bed.status}`} bed={bed} onSaved={reload}/>}
                    <BedCard
                      bed={bed}
                      canAllocate={canAllocate}
                      roomAllocatable={canAllocateRoom(room)}
                      onAssign={() => setAssignBed(bed)}
                      onRelease={() => setReleaseBed(bed)}
                      onViewTenant={async () => {
                        if (!bed.tenantId) return;
                        try {
                          await tenantService.getTenantById(bed.tenantId);
                          navigate(tenantPath(bed.tenantId));
                        } catch {
                          toast(
                            'info',
                            bed.tenantName ?? 'Tenant',
                            'Unable to load this tenant profile. Refresh and try again.',
                          );
                        }
                      }}
                      onViewReservation={() =>
                        toast('info', 'Reservation', `${bed.label} is operationally reserved. No booking or tenant is implied.`)
                      }
                      onCancelReservation={() => handleBedStatus(bed, BedStatus.AVAILABLE)}
                      onViewMaintenance={() =>
                        toast('info', 'Maintenance', `${bed.label} is under maintenance and cannot be allocated.`)
                      }
                      onMarkAvailable={() => handleBedStatus(bed, BedStatus.AVAILABLE)}
                      onViewReason={() => toast('info', 'Blocked', `${bed.label} is blocked from allocation.`)}
                      onUnblock={() => handleBedStatus(bed, BedStatus.AVAILABLE)}
                    />
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Policies" />
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>Maintenance and blocked rooms cannot be allocated.</li>
                <li>Occupancy is calculated from occupied beds versus room capacity.</li>
                <li>Tenant checkout releases the allocation in PostgreSQL.</li>
              </ul>
            </Card>
          </div>

          <Modal open={formOpen} title="Edit Room" onClose={() => setFormOpen(false)} className="max-w-2xl">
            <RoomForm
              key={room.id}
              mode="edit"
              properties={properties ?? []}
              rooms={rooms ?? []}
              editingId={room.id}
              initialValues={toRoomFormValues(room)}
              submitting={saving}
              onSubmit={handleSave}
              onCancel={() => setFormOpen(false)}
            />
          </Modal>

          <RoomStatusModal
            key={`${room.id}-${room.status}`}
            open={statusOpen}
            room={room}
            submitting={statusSaving}
            onClose={() => setStatusOpen(false)}
            onSubmit={handleStatusChange}
          />

          <BedAssignmentModal
            key={assignBed?.id ?? 'assign-bed'}
            open={Boolean(assignBed)}
            bed={assignBed}
            tenants={tenants ?? []}
            submitting={assigning}
            onClose={() => setAssignBed(null)}
            onSubmit={handleAssign}
          />

          <Modal
            open={Boolean(releaseBed)}
            title={releaseBed ? `Release ${releaseBed.label}?` : 'Release Bed'}
            onClose={() => setReleaseBed(null)}
            footer={
              <>
                <Button variant="outline" onClick={() => setReleaseBed(null)} disabled={releasing}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleRelease} disabled={releasing}>
                  {releasing ? 'Releasing…' : 'Release Bed'}
                </Button>
              </>
            }
          >
            <p className="typo-secondary">
              {releaseBed
                ? `Release ${releaseBed.label} from ${releaseBed.tenantName ?? 'this tenant'}? This checks out the tenant and makes the bed available.`
                : 'This checks out the tenant and makes the bed available.'}
            </p>
          </Modal>
        </>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div>
      <dt className="typo-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text">{value}</dd>
    </div>
  );
}
