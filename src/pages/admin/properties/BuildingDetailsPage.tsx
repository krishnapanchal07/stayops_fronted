import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, propertyDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { buildingTotals, floorOccupancy } from '@/utils/propertyStats';
import { summarizeRooms } from '@/utils/roomStats';
import { Pencil } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export function BuildingDetailsPage() {
  const { propertyId = '', buildingId = '' } = useParams();
  const toast = useToast();
  const canEdit = useHasPermission(Permission.PROPERTY_EDIT);
  const loader = useCallback(() => propertyService.getPropertyById(propertyId), [propertyId]);
  const roomsLoader = useCallback(() => roomService.getRoomsByBuilding(buildingId), [buildingId]);
  const { data: property, status, error, reload } = useAsyncResource(loader);
  const { data: rooms } = useAsyncResource(roomsLoader);
  const building = property?.buildings.find((item) => item.id === buildingId);
  const floorTotals = building ? buildingTotals(building) : null;
  const inventory = useMemo(() => (rooms ? summarizeRooms(rooms) : null), [rooms]);
  const totals = inventory ?? floorTotals;

  const [formOpen, setFormOpen] = useState(false);
  const [buildingName, setBuildingName] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    if (!building) return;
    setBuildingName(building.name);
    setNameError('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    const name = buildingName.trim();
    if (name.length < 2) {
      setNameError('Use at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      await propertyService.updateBuilding(propertyId, buildingId, name);
      toast('success', 'Building updated successfully.');
      setFormOpen(false);
      reload();
    } catch {
      toast('error', 'Unable to save building.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this building.'} onRetry={reload} />
      ) : null}

      {status === 'success' && property && !building ? (
        <ErrorState description="Building not found." onRetry={reload} />
      ) : null}

      {status === 'success' && property && building && totals ? (
        <>
          <PageHeader
            title={building.name}
            description={`${property.name} · ${property.city}`}
            breadcrumbs={[
              { label: 'Home', href: PATHS.admin.dashboard },
              { label: 'Properties', href: PATHS.admin.properties },
              { label: property.name, href: propertyDetailPath(property.id) },
              { label: building.name },
            ]}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <Link to={PATHS.admin.rooms}>
                  <Button variant="outline">View Rooms</Button>
                </Link>
                {canEdit ? (
                  <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={openEdit}>
                    Edit Building
                  </Button>
                ) : null}
              </div>
            }
            showBack
          />

          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                metric={{
                  id: 'floors',
                  label: 'Floors',
                  value: String(building.floors.length),
                  tone: 'primary',
                }}
              />
              <StatCard
                metric={{
                  id: 'rooms',
                  label: 'Rooms',
                  value: String(totals.totalRooms),
                  tone: 'info',
                }}
              />
              <StatCard
                metric={{
                  id: 'beds',
                  label: 'Beds',
                  value: String(totals.totalBeds),
                  tone: 'success',
                  hint: `${totals.occupiedBeds} occupied`,
                }}
              />
              <StatCard
                metric={{
                  id: 'occupancy',
                  label: 'Occupancy',
                  value: `${totals.occupancyPercent}%`,
                  tone: 'warning',
                }}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <OccupancyChart
                percent={totals.occupancyPercent}
                occupied={totals.occupiedBeds}
                vacant={totals.availableBeds}
                slices={[
                  { name: 'Occupied', value: totals.occupiedBeds },
                  { name: 'Vacant', value: totals.availableBeds },
                ]}
              />

              <Card>
                <CardHeader title="Floors" />
                {building.floors.length === 0 ? (
                  <EmptyState
                    title="No floors yet"
                    description="Add floors to this building to start mapping rooms."
                  />
                ) : (
                  <ul className="space-y-4">
                    {building.floors.map((floor) => {
                      const floorInventory = rooms
                        ? summarizeRooms(rooms.filter((room) => room.floorId === floor.id))
                        : null;
                      const percent = floorInventory?.occupancyPercent ?? floorOccupancy(floor);
                      const roomCount = floorInventory?.totalRooms ?? floor.roomCount;
                      const bedCount = floorInventory?.totalBeds ?? floor.bedCount;
                      const occupied = floorInventory?.occupiedBeds ?? floor.occupiedBeds;
                      const available = floorInventory?.availableBeds ?? Math.max(0, floor.bedCount - floor.occupiedBeds);
                      return (
                        <li key={floor.id} className="rounded-2xl border border-border bg-background p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-text">{floor.name}</p>
                              <p className="typo-helper">
                                {roomCount} Rooms · {bedCount} Beds · {occupied} Occupied · {available}{' '}
                                Available
                              </p>
                            </div>
                            <StatusPill value={`${percent}% Occupied`} />
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-soft">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          <Modal open={formOpen} title="Edit Building" onClose={() => setFormOpen(false)}>
            <div className="space-y-4">
              <TextInput
                label="Building name"
                name="buildingName"
                value={buildingName}
                onChange={(event) => setBuildingName(event.target.value)}
                error={nameError}
                required
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Update Building'}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : null}
    </div>
  );
}
