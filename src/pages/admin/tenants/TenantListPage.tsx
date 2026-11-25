import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { TenantCheckoutModal } from '@/components/tenants/TenantCheckoutModal';
import { TenantForm } from '@/components/tenants/TenantForm';
import { TenantStatusModal } from '@/components/tenants/TenantStatusModal';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, tenantDetailPath, wardenTenantDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import type { DataTableColumn } from '@/types/ui';
import {
  TENANT_STATUS_LABELS,
  TenantStatus,
  type Tenant,
  type TenantFilters,
  type TenantFormValues,
} from '@/types/tenant';
import { formatPhone, formatShortDate } from '@/utils/format';
import { filterTenants, summarizeTenants } from '@/utils/tenantStats';
import { emptyTenantFilters, toTenantFormValues } from '@/utils/tenantValidation';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function TenantListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.TENANT_CREATE);
  const canEdit = useHasPermission(Permission.TENANT_EDIT);
  const canAssignRoom = useHasPermission(Permission.ROOM_ALLOCATE);
  const homeHref = isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;
  const detailPath = isWarden ? wardenTenantDetailPath : tenantDetailPath;
  const propertyIds = user?.roleId === 'SUPER_ADMIN' ? undefined : user?.propertyIds;

  const tenantsLoader = useCallback(() => tenantService.getTenants(propertyIds), [propertyIds]);
  const propertiesLoader = useCallback(async () => {
    const properties = await propertyService.getProperties();
    if (!propertyIds) return properties;
    return properties.filter((property) => propertyIds.includes(property.id));
  }, [propertyIds]);
  const roomsLoader = useCallback(async () => {
    const rooms = await tenantService.getAllocationRooms();
    if (!propertyIds) return rooms;
    return rooms.filter((room) => propertyIds.includes(room.propertyId));
  }, [propertyIds]);
  const { data, status, error, reload } = useAsyncResource(tenantsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: rooms, reload: reloadRooms } = useAsyncResource(roomsLoader);

  const [filters, setFilters] = useState<TenantFilters>(emptyTenantFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Tenant | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<Tenant | null>(null);
  const [pendingValues, setPendingValues] = useState<TenantFormValues | null>(null);

  const tenants = useMemo(() => data ?? [], [data]);
  const propertyOptions = properties ?? [];
  const filtered = useMemo(() => filterTenants(tenants, filters), [filters, tenants]);
  const summary = useMemo(() => summarizeTenants(tenants), [tenants]);
  const selectedProperty = propertyOptions.find((property) => property.id === filters.propertyId);
  const selectedBuilding = selectedProperty?.buildings.find((building) => building.id === filters.buildingId);
  const filtersActive = Object.values(filters).some(Boolean);

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setFormMode('edit');
    setEditing(tenant);
    setFormOpen(true);
  };

  const commitSave = async (values: TenantFormValues) => {
    setSaving(true);
    try {
      if (formMode === 'edit' && editing) {
        await tenantService.updateTenant(editing.id, values, propertyIds);
        toast('success', 'Tenant updated successfully.');
      } else {
        await tenantService.createTenant(values);
        toast('success', 'Tenant created successfully.');
      }
      setFormOpen(false);
      setEditing(null);
      setPendingValues(null);
      reload();
      reloadRooms();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to save tenant.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (values: TenantFormValues) => {
    if (formMode === 'edit' && editing?.bedId && values.bedId && editing.bedId !== values.bedId) {
      setPendingValues(values);
      return;
    }
    await commitSave(values);
  };

  const handleStatusChange = async (nextStatus: Tenant['status']) => {
    if (!statusTarget) return;
    setStatusSaving(true);
    try {
      await tenantService.changeTenantStatus(statusTarget.id, nextStatus, propertyIds);
      toast(
        'success',
        nextStatus === TenantStatus.INACTIVE
          ? 'Tenant deactivated successfully.'
          : nextStatus === TenantStatus.ACTIVE
            ? 'Tenant activated successfully.'
            : 'Tenant status updated successfully.',
      );
      setStatusTarget(null);
      reload();
      reloadRooms();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update tenant status.');
    } finally {
      setStatusSaving(false);
    }
  };

  const columns: DataTableColumn<Tenant>[] = [
    {
      id: 'fullName',
      header: 'Tenant',
      accessor: 'fullName',
      sortable: true,
      render: (row) => <span className="font-semibold text-text">{row.fullName}</span>,
    },
    { id: 'tenantCode', header: 'Tenant ID', accessor: 'tenantCode', sortable: true },
    {
      id: 'room',
      header: 'Room / Bed',
      accessor: 'roomNumber',
      sortable: true,
      render: (row) => (row.roomNumber ? `Room ${row.roomNumber}${row.bedLabel ? ` / ${row.bedLabel}` : ''}` : 'Unassigned'),
    },
    { id: 'property', header: 'Property', accessor: 'propertyName', sortable: true },
    {
      id: 'phone',
      header: 'Phone',
      accessor: 'phone',
      render: (row) => formatPhone(row.phone),
    },
    {
      id: 'moveInDate',
      header: 'Move-in Date',
      accessor: 'moveInDate',
      sortable: true,
      render: (row) => formatShortDate(row.moveInDate),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusPill value={TENANT_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <TenantActions
          tenant={row}
          canEdit={canEdit}
          onView={() => navigate(detailPath(row.id))}
          onEdit={() => openEdit(row)}
          onChangeStatus={() => setStatusTarget(row)}
          onCheckout={() => setCheckoutTarget(row)}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tenants"
        description="Manage residents, occupancy, onboarding and tenant information."
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: 'Tenants' }]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Tenant
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load tenants.'} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'total', label: 'Total Tenants', value: String(summary.totalTenants), tone: 'primary' }} />
            <StatCard metric={{ id: 'active', label: 'Active Tenants', value: String(summary.activeTenants), tone: 'success' }} />
            <StatCard metric={{ id: 'onboarding', label: 'Onboarding', value: String(summary.onboardingTenants), tone: 'info' }} />
            <StatCard
              metric={{
                id: 'notice',
                label: 'Notice Period',
                value: String(summary.noticePeriodTenants),
                tone: 'warning',
                hint: `${summary.checkedOutTenants} checked out`,
              }}
            />
          </div>

          <Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SearchInput
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search name, tenant ID, phone, email, room"
                aria-label="Search tenants"
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
                    roomId: '',
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
                  setFilters((current) => ({ ...current, buildingId: event.target.value, floorId: '', roomId: '' }))
                }
              />
              <Select
                name="floorFilter"
                value={filters.floorId}
                options={[
                  { label: 'All floors', value: '' },
                  ...(selectedBuilding?.floors ?? []).map((floor) => ({ value: floor.id, label: floor.name })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, floorId: event.target.value, roomId: '' }))}
              />
              <Select
                name="roomFilter"
                value={filters.roomId}
                options={[
                  { label: 'All rooms', value: '' },
                  ...(rooms ?? [])
                    .filter((room) => {
                      if (filters.propertyId && room.propertyId !== filters.propertyId) return false;
                      if (filters.buildingId && room.buildingId !== filters.buildingId) return false;
                      if (filters.floorId && room.floorId !== filters.floorId) return false;
                      return true;
                    })
                    .map((room) => ({ value: room.id, label: `Room ${room.roomNumber}` })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, roomId: event.target.value }))}
              />
              <Select
                name="statusFilter"
                value={filters.status}
                options={[
                  { label: 'All statuses', value: '' },
                  ...Object.values(TenantStatus).map((value) => ({ value, label: TENANT_STATUS_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value as TenantFilters['status'] }))
                }
              />
              <Select
                name="moveInFilter"
                value={filters.moveInPeriod}
                options={[
                  { label: 'All move-in dates', value: '' },
                  { label: 'Last 30 days', value: '30' },
                  { label: 'Last 90 days', value: '90' },
                  { label: 'This year', value: 'YEAR' },
                ]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    moveInPeriod: event.target.value as TenantFilters['moveInPeriod'],
                  }))
                }
              />
            </div>
            <div className="mt-3">
              <Button variant="outline" onClick={() => setFilters(emptyTenantFilters)} disabled={!filtersActive}>
                Clear Filters
              </Button>
            </div>
          </Card>

          {tenants.length === 0 ? (
            <EmptyState
              title="No tenants yet."
              description="Add the first resident to start managing occupancy and onboarding."
              actionLabel={canCreate ? 'Add Tenant' : undefined}
              onAction={canCreate ? openCreate : undefined}
            />
          ) : (
            <DataTable
              key={`${filters.propertyId}-${filters.status}-${filters.moveInPeriod}`}
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={false}
              pageSize={10}
              emptyTitle="No tenants found."
              emptyDescription="Try adjusting your search or filters."
              renderMobile={(row) => (
                <TenantMobileCard
                  tenant={row}
                  canEdit={canEdit}
                  onView={() => navigate(detailPath(row.id))}
                  onEdit={() => openEdit(row)}
                  onChangeStatus={() => setStatusTarget(row)}
                  onCheckout={() => setCheckoutTarget(row)}
                />
              )}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title={formMode === 'create' ? 'Add Tenant' : 'Edit Tenant'}
        onClose={() => setFormOpen(false)}
        className="max-w-2xl"
      >
        <TenantForm
          key={editing?.id ?? 'create'}
          mode={formMode}
          properties={propertyOptions}
          rooms={rooms ?? []}
          tenants={tenants}
          editingId={editing?.id}
          initialValues={editing ? toTenantFormValues(editing) : undefined}
          submitting={saving}
          canAssignRoom={canAssignRoom}
          onSubmit={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <Modal
        open={Boolean(pendingValues)}
        title="Change room assignment?"
        onClose={() => setPendingValues(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingValues(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => pendingValues && commitSave(pendingValues)}
              disabled={saving || !pendingValues}
            >
              {saving ? 'Updating…' : 'Move Tenant'}
            </Button>
          </>
        }
      >
        <p className="typo-secondary">
          The current bed will become available and the selected bed will be marked occupied.
        </p>
      </Modal>

      <TenantStatusModal
        key={statusTarget?.id ?? 'tenant-status'}
        open={Boolean(statusTarget)}
        tenant={statusTarget}
        submitting={statusSaving}
        onClose={() => setStatusTarget(null)}
        onSubmit={handleStatusChange}
      />

      <TenantCheckoutModal
        key={checkoutTarget?.id ?? 'checkout-closed'}
        open={Boolean(checkoutTarget)}
        tenant={checkoutTarget}
        onClose={() => setCheckoutTarget(null)}
        onComplete={() => { reload(); reloadRooms(); }}
      />
    </div>
  );
}

interface TenantActionProps {
  tenant: Tenant;
  canEdit: boolean;
  onView: () => void;
  onEdit: () => void;
  onChangeStatus: () => void;
  onCheckout: () => void;
}

function TenantActions({ tenant, canEdit, onView, onEdit, onChangeStatus, onCheckout }: TenantActionProps) {
  const items = [
    { id: 'view', label: 'View', onSelect: onView },
    ...(canEdit
      ? [
          { id: 'edit', label: 'Edit', onSelect: onEdit },
          { id: 'status', label: 'Change Status', onSelect: onChangeStatus },
          { id: 'checkout', label: 'Start Checkout', onSelect: onCheckout },
        ]
      : []),
  ];

  return (
    <Dropdown
      trigger={
        <IconButton label={`Actions for ${tenant.fullName}`} size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      }
      items={items}
    />
  );
}

function TenantMobileCard({ tenant, canEdit, onView, onEdit, onChangeStatus, onCheckout }: TenantActionProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-text">{tenant.fullName}</p>
          <p className="typo-helper">{tenant.tenantCode}</p>
        </div>
        <StatusPill value={TENANT_STATUS_LABELS[tenant.status]} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <p>
          <span className="typo-muted">Room</span>
          <span className="mt-0.5 block font-medium">
            {tenant.roomNumber ? `Room ${tenant.roomNumber}` : 'Unassigned'}
          </span>
        </p>
        <p>
          <span className="typo-muted">Property</span>
          <span className="mt-0.5 block font-medium">{tenant.propertyName ?? '—'}</span>
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Button size="sm" onClick={onView}>
          View
        </Button>
        <TenantActions
          tenant={tenant}
          canEdit={canEdit}
          onView={onView}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
          onCheckout={onCheckout}
        />
      </div>
    </div>
  );
}
