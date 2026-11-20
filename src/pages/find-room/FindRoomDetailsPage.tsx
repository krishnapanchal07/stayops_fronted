import { Badge } from '@/components/common/Badge';
import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import { RoomGallery } from '@/components/rooms/RoomGallery';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { inquiryService } from '@/services/inquiry/inquiryService';
import { roomService } from '@/services/room/roomService';
import { BedStatus, SHARING_TYPE_LABELS } from '@/types/room';
import type { InquiryFormValues } from '@/types/inquiry';
import { formatINR } from '@/utils/format';
import { DEFAULT_ROOM_POLICIES, hasAmenity, listingTitle, roomSpecRows } from '@/utils/roomListing';
import { Bath, BookOpen, Fan, Shirt, Snowflake, Wifi } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const amenityIcons = [
  { match: 'AC', label: 'AC', icon: Snowflake },
  { match: 'Attached Bathroom', label: 'Attached Bathroom', icon: Bath },
  { match: 'Wi', label: 'WiFi', icon: Wifi },
  { match: 'Study Table', label: 'Study Table', icon: BookOpen },
  { match: 'Wardrobe', label: 'Wardrobe', icon: Shirt },
  { match: 'Chair', label: 'Chair', icon: Fan },
];

export function FindRoomDetailsPage() {
  const { roomId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const canCreateInquiry = useHasPermission(Permission.INQUIRY_CREATE) || !user;
  const isTenantPath = location.pathname.startsWith('/tenant');
  const listPath = isTenantPath ? PATHS.tenant.findRoom : PATHS.findRoom;
  const requestedBedId = searchParams.get('bed') ?? '';

  const loader = useCallback(() => roomService.getRoomById(roomId), [roomId]);
  const { data: room, status, error, reload } = useAsyncResource(loader);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bed = useMemo(() => {
    if (!room) return undefined;
    return room.beds.find((item) => item.id === requestedBedId) ?? room.beds.find((item) => item.status === BedStatus.AVAILABLE);
  }, [requestedBedId, room]);

  const available = bed?.status === BedStatus.AVAILABLE;
  const title = room && bed ? listingTitle(room.roomNumber, bed.bedNumber) : room?.roomNumber ?? 'Room';
  const visibleAmenities = amenityIcons.filter((item) => room && hasAmenity(room.amenities, item.match));

  const initialValues = useMemo(() => {
    if (!user) return undefined;
    const [firstName, ...rest] = user.name.split(' ');
    return {
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      email: user.email,
      message: room && bed ? `I would like to inquire about ${listingTitle(room.roomNumber, bed.bedNumber)}.` : '',
    };
  }, [bed, room, user]);

  const handleSubmit = async (values: InquiryFormValues) => {
    if (!room || !bed) return;
    setSubmitting(true);
    try {
      await inquiryService.submitInquiry({
        ...values,
        roomId: room.id,
        bedId: bed.id,
        userId: user?.id ?? null,
        actor: user?.name ?? `${values.firstName} ${values.lastName}`.trim(),
      });
      setFormOpen(false);
      toast('success', 'Inquiry submitted', 'The team will review this request and contact you shortly.');
      if (isTenantPath) {
        navigate(PATHS.tenant.inquiries);
      }
    } catch (cause) {
      toast('error', 'Unable to submit inquiry', cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={room?.propertyName}
        breadcrumbs={[
          { label: 'Find Room', href: listPath },
          { label: 'Room Details' },
        ]}
        actions={
          available && canCreateInquiry ? (
            <Button onClick={() => setFormOpen(true)}>Apply Now</Button>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this room.'} onRetry={reload} />
      ) : null}

      {status === 'success' && room ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="typo-secondary">{room.propertyName}</p>
              <Badge variant={available ? 'success' : 'warning'}>{available ? 'Available' : bed ? 'Unavailable' : 'No bed selected'}</Badge>
            </div>
            <p className="text-xl font-semibold text-text">
              {formatINR(bed?.rent || room.monthlyRent)} /month
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <div className="space-y-5">
              <RoomGallery images={room.images} roomNumber={room.roomNumber} />
              <Card>
                <CardHeader title="About This Room" />
                <p className="typo-secondary">{room.description}</p>
                <div className="mt-5">
                  <h3 className="typo-subtitle mb-3">Amenities</h3>
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {visibleAmenities.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.label} className="flex items-center gap-2 text-sm text-text">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          {item.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Card>
            </div>

            <div className="space-y-5">
              <Card>
                <CardHeader title="Room Details" />
                <dl className="space-y-3">
                  {roomSpecRows(room).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="font-medium text-text">{row.value}</dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-muted">Sharing</dt>
                    <dd className="font-medium text-text">{SHARING_TYPE_LABELS[room.sharingType]}</dd>
                  </div>
                </dl>
              </Card>
              <Card>
                <CardHeader title="Rules & Policies" />
                <ul className="list-disc space-y-2 pl-5 text-sm text-text-secondary">
                  {DEFAULT_ROOM_POLICIES.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      <Modal open={formOpen} title="Inquire Now" onClose={() => setFormOpen(false)} className="max-w-xl">
        {room && bed ? (
          <InquiryForm
            listingTitle={title}
            propertyName={room.propertyName}
            monthlyRent={bed.rent || room.monthlyRent}
            initialValues={initialValues}
            lockIdentity={Boolean(user)}
            submitting={submitting}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSubmit}
          />
        ) : null}
      </Modal>
    </div>
  );
}
