import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, propertyDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import type { DataTableColumn } from '@/types/ui';
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  PropertyStatus,
  PropertyType,
  type PropertyFilters,
  type PropertyFormValues,
  type PropertyListItem,
} from '@/types/property';
import { formatINR } from '@/utils/format';
import { filterProperties, summarizeProperties, uniqueCities } from '@/utils/propertyStats';
import { toPropertyFormValues } from '@/utils/propertyValidation';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const emptyFilters: PropertyFilters = {
  query: '',
  status: '',
  type: '',
  city: '',
};

export function PropertyListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const canCreate = useHasPermission(Permission.PROPERTY_CREATE);
  const canEdit = useHasPermission(Permission.PROPERTY_EDIT);
  const loader = useCallback(() => propertyService.getProperties(), []);
  const { data, status, error, reload } = useAsyncResource(loader);

  const [filters, setFilters] = useState<PropertyFilters>(emptyFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<PropertyListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<PropertyListItem | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const properties = data ?? [];
  const filtered = useMemo(() => filterProperties(properties, filters), [filters, properties]);
  const summary = useMemo(() => summarizeProperties(properties), [properties]);
  const cities = useMemo(() => uniqueCities(properties), [properties]);
  const filtersActive = Boolean(filters.query || filters.status || filters.type || filters.city);

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (property: PropertyListItem) => {
    setFormMode('edit');
    setEditing(property);
    setFormOpen(true);
  };

  const handleSave = async (values: PropertyFormValues) => {
    setSaving(true);
    try {
      if (formMode === 'edit' && editing) {
        await propertyService.updateProperty(editing.id, values);
        toast('success', 'Property updated successfully.');
      } else {
        await propertyService.createProperty(values);
        toast('success', 'Property created successfully.');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch {
      toast('error', 'Unable to save property.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    setStatusSaving(true);
    try {
      const updated = await propertyService.togglePropertyStatus(statusTarget.id);
      toast(
        'success',
        updated.status === PropertyStatus.ACTIVE
          ? 'Property activated successfully.'
          : 'Property deactivated successfully.',
      );
      setStatusTarget(null);
      reload();
    } catch {
      toast('error', 'Unable to update property status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const columns: DataTableColumn<PropertyListItem>[] = [
    {
      id: 'name',
      header: 'Property',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-text">{row.name}</p>
          <p className="typo-helper">{row.address}</p>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessor: 'type',
      sortable: true,
      render: (row) => PROPERTY_TYPE_LABELS[row.type],
    },
    {
      id: 'city',
      header: 'Location',
      accessor: 'city',
      sortable: true,
      render: (row) => `${row.city}, ${row.state}`,
    },
    { id: 'buildings', header: 'Buildings', accessor: 'totalBuildings', sortable: true },
    { id: 'rooms', header: 'Rooms', accessor: 'totalRooms', sortable: true },
    { id: 'occupied', header: 'Occupied Beds', accessor: 'occupiedBeds', sortable: true },
    {
      id: 'occupancy',
      header: 'Occupancy',
      accessor: 'occupancyPercent',
      sortable: true,
      render: (row) => `${row.occupancyPercent}%`,
    },
    {
      id: 'revenue',
      header: 'Monthly Revenue',
      accessor: 'monthlyRevenue',
      sortable: true,
      render: (row) => formatINR(row.monthlyRevenue),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusPill value={PROPERTY_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <PropertyActions
          property={row}
          canEdit={canEdit}
          onView={() => navigate(propertyDetailPath(row.id))}
          onEdit={() => openEdit(row)}
          onToggleStatus={() => setStatusTarget(row)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Manage your PG and hostel properties."
        breadcrumbs={[
          { label: 'Home', href: PATHS.admin.dashboard },
          { label: 'Properties' },
        ]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Property
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load properties.'} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              metric={{
                id: 'properties',
                label: 'Total Properties',
                value: String(summary.totalProperties),
                tone: 'primary',
              }}
            />
            <StatCard
              metric={{
                id: 'active',
                label: 'Active Properties',
                value: String(summary.activeProperties),
                tone: 'success',
              }}
            />
            <StatCard
              metric={{
                id: 'rooms',
                label: 'Total Rooms',
                value: String(summary.totalRooms),
                tone: 'info',
              }}
            />
            <StatCard
              metric={{
                id: 'occupancy',
                label: 'Overall Occupancy',
                value: `${summary.occupancyPercent}%`,
                tone: 'warning',
              }}
            />
          </div>

          <Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SearchInput
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search property name"
                aria-label="Search property name"
              />
              <Select
                name="statusFilter"
                value={filters.status}
                options={[
                  { label: 'All statuses', value: '' },
                  ...Object.values(PropertyStatus).map((value) => ({
                    value,
                    label: PROPERTY_STATUS_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    status: event.target.value as PropertyFilters['status'],
                  }))
                }
              />
              <Select
                name="typeFilter"
                value={filters.type}
                options={[
                  { label: 'All types', value: '' },
                  ...Object.values(PropertyType).map((value) => ({
                    value,
                    label: PROPERTY_TYPE_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    type: event.target.value as PropertyFilters['type'],
                  }))
                }
              />
              <Select
                name="cityFilter"
                value={filters.city}
                options={[
                  { label: 'All cities', value: '' },
                  ...cities.map((city) => ({ value: city, label: city })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}
              />
              <Button
                variant="outline"
                onClick={() => setFilters(emptyFilters)}
                disabled={!filtersActive}
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row.id}
            searchable={false}
            pageSize={6}
            emptyTitle="No properties found."
            emptyDescription="Try adjusting your filters or search."
            renderMobile={(row) => (
              <PropertyMobileCard
                property={row}
                canEdit={canEdit}
                onView={() => navigate(propertyDetailPath(row.id))}
                onEdit={() => openEdit(row)}
                onToggleStatus={() => setStatusTarget(row)}
              />
            )}
          />
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title={formMode === 'create' ? 'Add Property' : 'Edit Property'}
        onClose={() => setFormOpen(false)}
        className="max-w-2xl"
      >
        <PropertyForm
          key={editing?.id ?? 'create'}
          mode={formMode}
          initialValues={editing ? toPropertyFormValues(editing) : undefined}
          submitting={saving}
          onSubmit={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(statusTarget)}
        title={
          statusTarget?.status === PropertyStatus.ACTIVE
            ? `Deactivate ${statusTarget.name}?`
            : `Activate ${statusTarget?.name ?? 'property'}?`
        }
        onClose={() => setStatusTarget(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusTarget(null)} disabled={statusSaving}>
              Cancel
            </Button>
            <Button
              variant={statusTarget?.status === PropertyStatus.ACTIVE ? 'danger' : 'success'}
              onClick={handleToggleStatus}
              disabled={statusSaving}
            >
              {statusSaving
                ? 'Updating…'
                : statusTarget?.status === PropertyStatus.ACTIVE
                  ? 'Deactivate'
                  : 'Activate'}
            </Button>
          </>
        }
      >
        <p className="typo-secondary">
          {statusTarget?.status === PropertyStatus.ACTIVE
            ? 'This property will no longer be available for normal operational use.'
            : 'This property will become available for normal operational use again.'}
        </p>
      </Modal>
    </div>
  );
}

interface PropertyActionProps {
  property: PropertyListItem;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

function PropertyActions({ property, canEdit, onView, onEdit, onToggleStatus }: PropertyActionProps) {
  const items = [
    { id: 'view', label: 'View', onSelect: onView },
    ...(canEdit
      ? [
          { id: 'edit', label: 'Edit', onSelect: onEdit },
          {
            id: 'status',
            label: property.status === PropertyStatus.ACTIVE ? 'Deactivate' : 'Activate',
            danger: property.status === PropertyStatus.ACTIVE,
            onSelect: onToggleStatus,
          },
        ]
      : []),
  ];

  return (
    <Dropdown
      trigger={
        <IconButton label={`Actions for ${property.name}`} size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      }
      items={items}
    />
  );
}

function PropertyMobileCard({ property, canEdit, onView, onEdit, onToggleStatus }: PropertyActionProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{property.name}</p>
          <p className="typo-helper">
            {PROPERTY_TYPE_LABELS[property.type]} · {property.city}
          </p>
        </div>
        <StatusPill value={PROPERTY_STATUS_LABELS[property.status]} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="typo-muted">Rooms</span>
          <span className="mt-0.5 block font-medium">{property.totalRooms}</span>
        </p>
        <p>
          <span className="typo-muted">Occupancy</span>
          <span className="mt-0.5 block font-medium">{property.occupancyPercent}%</span>
        </p>
        <p>
          <span className="typo-muted">Occupied beds</span>
          <span className="mt-0.5 block font-medium">{property.occupiedBeds}</span>
        </p>
        <p>
          <span className="typo-muted">Revenue</span>
          <span className="mt-0.5 block font-medium">{formatINR(property.monthlyRevenue)}</span>
        </p>
      </div>
      <div className="mt-4">
        <PropertyActions
          property={property}
          canEdit={canEdit}
          onView={onView}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      </div>
    </div>
  );
}
