import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, buildingDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  type PropertyFormValues,
} from '@/types/property';
import { formatINR, formatPhone } from '@/utils/format';
import { buildingTotals } from '@/utils/propertyStats';
import { toPropertyFormValues } from '@/utils/propertyValidation';
import { summarizeRooms } from '@/utils/roomStats';
import { Pencil } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function PropertyDetailsPage() {
  const { propertyId = '' } = useParams();
  const toast = useToast();
  const canEdit = useHasPermission(Permission.PROPERTY_EDIT);
  const loader = useCallback(() => propertyService.getPropertyById(propertyId), [propertyId]);
  const roomsLoader = useCallback(() => roomService.getRoomsByProperty(propertyId), [propertyId]);
  const { data: property, status, error, reload } = useAsyncResource(loader);
  const { data: rooms } = useAsyncResource(roomsLoader);
  const inventory = useMemo(() => (rooms ? summarizeRooms(rooms) : null), [rooms]);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: PropertyFormValues) => {
    if (!property) return;
    setSaving(true);
    try {
      await propertyService.updateProperty(property.id, values);
      toast('success', 'Property updated successfully.');
      setFormOpen(false);
      reload();
    } catch {
      toast('error', 'Unable to save property.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {status === 'loading' ? <DashboardSkeleton cards={6} /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this property.'} onRetry={reload} />
      ) : null}

      {status === 'success' && property ? (
        <>
          <PageHeader
            title={property.name}
            description={`${property.city}, ${property.state}`}
            breadcrumbs={[
              { label: 'Home', href: PATHS.admin.dashboard },
              { label: 'Properties', href: PATHS.admin.properties },
              { label: property.name },
            ]}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill value={PROPERTY_STATUS_LABELS[property.status]} />
                <Link to={PATHS.admin.rooms}>
                  <Button variant="outline">View Rooms</Button>
                </Link>
                {canEdit ? (
                  <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
                    Edit
                  </Button>
                ) : null}
              </div>
            }
            showBack
          />

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                metric={{
                  id: 'rooms',
                  label: 'Total Rooms',
                  value: String(inventory?.totalRooms ?? property.totalRooms),
                  tone: 'primary',
                }}
              />
              <StatCard
                metric={{
                  id: 'beds',
                  label: 'Total Beds',
                  value: String(inventory?.totalBeds ?? property.totalBeds),
                  tone: 'info',
                }}
              />
              <StatCard
                metric={{
                  id: 'occupancy',
                  label: 'Occupied',
                  value: String(inventory?.occupiedBeds ?? property.occupiedBeds),
                  tone: 'success',
                }}
              />
              <StatCard
                metric={{
                  id: 'available',
                  label: 'Available',
                  value: String(inventory?.availableBeds ?? property.availableBeds),
                  tone: 'warning',
                }}
              />
              <StatCard
                metric={{
                  id: 'occupancy',
                  label: 'Occupancy',
                  value: `${inventory?.occupancyPercent ?? property.occupancyPercent}%`,
                  tone: 'primary',
                  hint: `${inventory?.occupiedBeds ?? property.occupiedBeds} / ${inventory?.totalBeds ?? property.totalBeds} beds`,
                }}
              />
              <StatCard
                metric={{
                  id: 'revenue',
                  label: 'Monthly Revenue',
                  value: formatINR(property.monthlyRevenue),
                  tone: 'success',
                }}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <OccupancyChart
                percent={inventory?.occupancyPercent ?? property.occupancyPercent}
                occupied={inventory?.occupiedBeds ?? property.occupiedBeds}
                vacant={inventory?.availableBeds ?? property.availableBeds}
                slices={[
                  { name: 'Occupied', value: inventory?.occupiedBeds ?? property.occupiedBeds },
                  { name: 'Vacant', value: inventory?.availableBeds ?? property.availableBeds },
                ]}
              />
              <ActivityList title="Recent Activity" items={property.recentActivity} />
            </div>

            <Card>
              <CardHeader title="Property Information" />
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Property name" value={property.name} />
                <InfoRow label="Property type" value={PROPERTY_TYPE_LABELS[property.type]} />
                <InfoRow label="Address" value={property.address} />
                <InfoRow label="Location" value={`${property.city}, ${property.state} ${property.postalCode}`.trim()} />
                <InfoRow label="Contact number" value={formatPhone(property.contactNumber)} />
                <InfoRow label="Email" value={property.email || '—'} />
                <div className="sm:col-span-2">
                  <dt className="typo-muted">Description</dt>
                  <dd className="mt-1 text-sm text-text">{property.description || '—'}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <CardHeader title="Amenities" />
              {property.amenities.length === 0 ? (
                <p className="typo-secondary">No amenities listed yet.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {property.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Buildings" />
              {property.buildings.length === 0 ? (
                <EmptyState
                  title="No buildings yet"
                  description="Building and floor structure will expand in the next phase."
                />
              ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                  {property.buildings.map((building) => {
                    const roomTotals = rooms
                      ? summarizeRooms(rooms.filter((room) => room.buildingId === building.id))
                      : null;
                    const totals = roomTotals ?? buildingTotals(building);
                    return (
                      <li key={building.id} className="rounded-2xl border border-border bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-text">{building.name}</p>
                            <p className="typo-helper">
                              {building.floors.length} Floors · {totals.totalRooms} Rooms · {totals.totalBeds}{' '}
                              Beds
                            </p>
                          </div>
                          <StatusPill value={`${totals.occupancyPercent}% Occupied`} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link to={buildingDetailPath(property.id, building.id)}>
                            <Button size="sm" variant="outline">
                              View Building
                            </Button>
                          </Link>
                          <Link to={PATHS.admin.rooms}>
                            <Button size="sm" variant="ghost">
                              View Rooms
                            </Button>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>

          <Modal
            open={formOpen}
            title="Edit Property"
            onClose={() => setFormOpen(false)}
            className="max-w-2xl"
          >
            <PropertyForm
              key={property.id}
              mode="edit"
              initialValues={toPropertyFormValues(property)}
              submitting={saving}
              onSubmit={handleSave}
              onCancel={() => setFormOpen(false)}
            />
          </Modal>
        </>
      ) : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="typo-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text">{value}</dd>
    </div>
  );
}
