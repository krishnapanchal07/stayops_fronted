import { Avatar } from '@/components/common/Avatar';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RoomGallery } from '@/components/rooms/RoomGallery';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import { BED_STATUS_LABELS, ROOM_TYPE_LABELS, SHARING_TYPE_LABELS } from '@/types/room';
import { TENANT_STATUS_LABELS } from '@/types/tenant';
import { formatINR, formatPhone, formatShortDate } from '@/utils/format';
import { calculateRoomOccupancy } from '@/utils/roomStats';
import { BedDouble, CalendarClock, CreditCard, MessageSquareWarning, UserPlus } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const actions = [
  { id: 'pay', label: 'Pay Rent', icon: CreditCard, path: PATHS.tenant.payments },
  { id: 'complaint', label: 'Raise Complaint', icon: MessageSquareWarning, path: PATHS.tenant.complaints },
  { id: 'visitor', label: 'Add Visitor', icon: UserPlus, path: PATHS.tenant.visitors },
  { id: 'leave', label: 'Apply Leave', icon: CalendarClock, path: PATHS.tenant.leave },
] as const;

export function MyRoomPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const tenantId = user?.id ?? '';

  const loader = useCallback(async () => {
    if (!tenantId) throw new Error('Unable to load room information.');
    const tenant = await tenantService.getTenantById(tenantId);
    const [room, bed, roommates, property, rules] = await Promise.all([
      tenantService.getTenantRoom(tenantId),
      tenantService.getTenantBed(tenantId),
      tenantService.getRoommates(tenantId),
      tenant.propertyId ? propertyService.getPropertyById(tenant.propertyId) : Promise.resolve(null),
      tenant.propertyId ? propertyService.getPropertyRules(tenant.propertyId) : Promise.resolve([]),
    ]);
    return { tenant, room, bed, roommates, property, rules };
  }, [tenantId]);

  const { data, status, error, reload } = useAsyncResource(loader);
  const occupancy = data?.room ? calculateRoomOccupancy(data.room) : null;

  return (
    <div>
      <PageHeader
        title="My Room"
        description="View your current room, bed, stay details and property information."
        breadcrumbs={[
          { label: 'Home', href: PATHS.tenant.dashboard },
          { label: 'My Room' },
        ]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Unable to load room information." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data && !data.tenant.roomId ? (
        <Card>
          <EmptyState
            icon={<BedDouble className="h-8 w-8" />}
            title="Room not assigned yet."
            description="Your onboarding is still in progress. Contact support if you need help with room assignment."
            actionLabel="View My Inquiry"
            onAction={() => navigate(PATHS.tenant.inquiries)}
          />
          <div className="flex justify-center pb-4">
            <Button variant="outline" onClick={() => navigate(PATHS.tenant.help)}>
              Contact Support
            </Button>
          </div>
        </Card>
      ) : null}

      {status === 'success' && data?.room && occupancy ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader title="Current stay" />
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label="Property" value={data.tenant.propertyName || data.property?.name || '—'} />
                <Info label="Building" value={data.room.buildingName} />
                <Info label="Floor" value={data.room.floorName} />
                <Info label="Room" value={data.room.roomNumber} />
                <Info label="Bed" value={data.bed?.label ?? 'Not assigned'} />
                <div>
                  <dt className="typo-muted">Tenant status</dt>
                  <dd className="mt-1">
                    <StatusPill value={TENANT_STATUS_LABELS[data.tenant.status]} />
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader title="Room photos" />
              <RoomGallery images={data.room.images} roomNumber={data.room.roomNumber} />
            </Card>

            <Card>
              <CardHeader title="Room information" />
              <dl className="grid gap-4 sm:grid-cols-2">
                <Info label="Room" value={data.room.roomNumber} />
                <Info label="Building" value={data.room.buildingName} />
                <Info label="Floor" value={data.room.floorName} />
                <Info label="Room type" value={ROOM_TYPE_LABELS[data.room.roomType]} />
                <Info label="Sharing" value={SHARING_TYPE_LABELS[data.room.sharingType]} />
                <Info label="Capacity" value={String(data.room.capacity)} />
                <Info label="Occupied" value={String(occupancy.occupiedBeds)} />
                <Info label="Available" value={String(occupancy.availableBeds)} />
                <Info label="Rent" value={`${formatINR(data.room.monthlyRent)}/month`} />
                <Info label="Deposit" value={formatINR(data.tenant.securityDeposit ?? data.room.securityDeposit)} />
              </dl>
            </Card>

            <Card>
              <CardHeader title="Amenities" />
              {data.room.amenities.length ? (
                <ul className="flex flex-wrap gap-2">
                  {data.room.amenities.map((amenity) => (
                    <li key={amenity} className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary">
                      {amenity}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="typo-secondary">No amenities listed for this room.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Room rules" />
              <ul className="list-disc space-y-2 pl-5 text-sm text-text">
                {data.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader title="My Bed" />
              {data.bed ? (
                <>
                  <p className="text-xl font-semibold">{data.bed.label}</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <StatusPill value={BED_STATUS_LABELS[data.bed.status]} />
                    <p>Move-in {formatShortDate(data.bed.moveInDate ?? data.tenant.moveInDate)}</p>
                    <p>Rent {formatINR(data.bed.rent)}</p>
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<BedDouble className="h-8 w-8" />}
                  title="Your room has not been assigned yet."
                  description="A room is reserved, but your bed assignment is still pending."
                />
              )}
            </Card>

            <Card>
              <CardHeader title="Roommate" />
              {data.roommates.length ? (
                <ul className="space-y-3">
                  {data.roommates.map((roommate) => (
                    <li key={roommate.id} className="flex items-center gap-3">
                      <Avatar src={roommate.profileImage} name={roommate.fullName} />
                      <p className="font-medium text-text">{roommate.fullName}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="typo-secondary">You are currently the only occupant.</p>
              )}
            </Card>

            <Card>
              <CardHeader title="Stay information" />
              <dl className="space-y-3">
                <Info label="Move-in date" value={formatShortDate(data.tenant.moveInDate)} />
                <Info label="Expected move-out" value={formatShortDate(data.tenant.expectedMoveOutDate)} />
                <Info label="Monthly rent" value={formatINR(data.tenant.roomRent ?? 0)} />
                <Info label="Security deposit" value={formatINR(data.tenant.securityDeposit ?? 0)} />
                <div>
                  <dt className="typo-muted">Tenant status</dt>
                  <dd className="mt-1">
                    <StatusPill value={TENANT_STATUS_LABELS[data.tenant.status]} />
                  </dd>
                </div>
              </dl>
            </Card>

            {data.property ? (
              <Card>
                <CardHeader title="Property information" />
                <p className="font-semibold">{data.property.name}</p>
                <p className="typo-secondary mt-1">
                  {data.property.address}, {data.property.city}, {data.property.state}
                </p>
                <p className="mt-3 text-sm">Management contact</p>
                <p className="typo-secondary">{formatPhone(data.property.contactNumber)}</p>
                <p className="typo-secondary">{data.property.email}</p>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Quick actions" />
              <div className="grid grid-cols-2 gap-3">
                {actions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.id}
                      to={action.path}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background px-3 py-4 text-center hover:border-primary hover:bg-primary-soft"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium text-text">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="typo-muted">{label}</dt>
      <dd className="mt-1 font-medium text-text">{value}</dd>
    </div>
  );
}
