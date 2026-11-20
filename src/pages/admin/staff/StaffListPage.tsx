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
import { StaffForm } from '@/components/staff/StaffForm';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, staffDetailPath } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { staffService } from '@/services/staff/staffService';
import type { Staff, StaffFilters, StaffFormValues } from '@/types/staff';
import {
  STAFF_DEPARTMENT_LABELS,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_LABELS,
  StaffDepartment,
  StaffRole,
  StaffStatus,
} from '@/types/staff';
import type { DataTableColumn } from '@/types/ui';
import { formatPhone } from '@/utils/format';
import { emptyStaffFilters, filterStaff, summarizeStaff, toStaffFormValues } from '@/utils/staffValidation';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function StaffListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const canCreate = useHasPermission(Permission.STAFF_CREATE);
  const canEdit = useHasPermission(Permission.STAFF_EDIT);
  const staffLoader = useCallback(() => staffService.getStaff(), []);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const { data, status, error, reload } = useAsyncResource(staffLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);

  const [filters, setFilters] = useState<StaffFilters>(emptyStaffFilters);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);

  const staff = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterStaff(staff, filters), [filters, staff]);
  const summary = useMemo(() => summarizeStaff(staff), [staff]);
  const filtersActive = Object.values(filters).some(Boolean);

  const openCreate = () => {
    setFormMode('create');
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (record: Staff) => {
    setFormMode('edit');
    setEditing(record);
    setFormOpen(true);
  };

  const handleSave = async (values: StaffFormValues) => {
    setSaving(true);
    try {
      if (formMode === 'edit' && editing) {
        await staffService.updateStaff(editing.id, values);
        toast('success', 'Staff updated successfully.');
      } else {
        await staffService.createStaff(values);
        toast('success', 'Staff added successfully.');
      }
      setFormOpen(false);
      setEditing(null);
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to save staff.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (record: Staff) => {
    try {
      if (record.status === StaffStatus.INACTIVE) {
        await staffService.activateStaff(record.id);
        toast('success', `${record.fullName} is now active.`);
      } else {
        await staffService.deactivateStaff(record.id);
        toast('success', `${record.fullName} has been deactivated.`);
      }
      reload();
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to update staff status.');
    }
  };

  const columns: DataTableColumn<Staff>[] = [
    {
      id: 'employee',
      header: 'Employee',
      accessor: 'fullName',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-semibold text-text">{row.fullName}</p>
          <p className="typo-helper">{row.email}</p>
        </div>
      ),
    },
    { id: 'code', header: 'Employee ID', accessor: 'employeeCode', sortable: true },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (row) => STAFF_ROLE_LABELS[row.role],
    },
    {
      id: 'department',
      header: 'Department',
      accessor: 'department',
      sortable: true,
      render: (row) => STAFF_DEPARTMENT_LABELS[row.department],
    },
    {
      id: 'property',
      header: 'Property',
      accessor: 'fullName',
      render: (row) => row.propertyNames.join(', ') || '—',
    },
    {
      id: 'phone',
      header: 'Phone',
      accessor: 'phone',
      render: (row) => formatPhone(row.phone),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusPill value={STAFF_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          trigger={
            <IconButton label={`Actions for ${row.fullName}`} size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={[
            { id: 'view', label: 'View', onSelect: () => navigate(staffDetailPath(row.id)) },
            ...(canEdit
              ? [
                  { id: 'edit', label: 'Edit', onSelect: () => openEdit(row) },
                  {
                    id: 'status',
                    label: row.status === StaffStatus.INACTIVE ? 'Activate' : 'Deactivate',
                    onSelect: () => void toggleStatus(row),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage wardens, accountants, security and maintenance teams."
        breadcrumbs={[{ label: 'Home', href: PATHS.admin.dashboard }, { label: 'Staff' }]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add Staff
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load staff.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'total', label: 'Total Staff', value: String(summary.total), tone: 'primary' }} />
            <StatCard metric={{ id: 'active', label: 'Active', value: String(summary.active), tone: 'success' }} />
            <StatCard metric={{ id: 'leave', label: 'On Leave', value: String(summary.onLeave), tone: 'warning' }} />
            <StatCard metric={{ id: 'inactive', label: 'Inactive', value: String(summary.inactive), tone: 'danger' }} />
          </div>

          <Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <SearchInput
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search name, employee ID, email, phone"
                aria-label="Search staff"
              />
              <Select
                name="roleFilter"
                value={filters.role}
                options={[
                  { label: 'All roles', value: '' },
                  ...Object.values(StaffRole).map((value) => ({ value, label: STAFF_ROLE_LABELS[value] })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as StaffFilters['role'] }))}
              />
              <Select
                name="departmentFilter"
                value={filters.department}
                options={[
                  { label: 'All departments', value: '' },
                  ...Object.values(StaffDepartment).map((value) => ({
                    value,
                    label: STAFF_DEPARTMENT_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, department: event.target.value as StaffFilters['department'] }))
                }
              />
              <Select
                name="propertyFilter"
                value={filters.propertyId}
                options={[
                  { label: 'All properties', value: '' },
                  ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
              />
              <Select
                name="statusFilter"
                value={filters.status}
                options={[
                  { label: 'All statuses', value: '' },
                  ...Object.values(StaffStatus).map((value) => ({ value, label: STAFF_STATUS_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value as StaffFilters['status'] }))
                }
              />
            </div>
            <div className="mt-3">
              <Button variant="outline" onClick={() => setFilters(emptyStaffFilters())} disabled={!filtersActive}>
                Clear Filters
              </Button>
            </div>
          </Card>

          {staff.length === 0 ? (
            <EmptyState
              title="No staff found."
              description="Add operational staff such as wardens, accountants, security and maintenance."
              actionLabel={canCreate ? 'Add Staff' : undefined}
              onAction={canCreate ? openCreate : undefined}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={false}
              pageSize={10}
              emptyTitle="No staff found."
              emptyDescription="Try adjusting your filters."
              renderMobile={(row) => (
                <div className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text">{row.fullName}</p>
                      <p className="typo-helper">{row.employeeCode}</p>
                    </div>
                    <StatusPill value={STAFF_STATUS_LABELS[row.status]} />
                  </div>
                  <p className="mt-3 text-sm">{STAFF_ROLE_LABELS[row.role]} · {row.propertyNames.join(', ') || 'Unassigned'}</p>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => navigate(staffDetailPath(row.id))}>
                      View
                    </Button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title={formMode === 'create' ? 'Add Staff' : 'Edit Staff'}
        onClose={() => setFormOpen(false)}
        className="max-w-3xl"
      >
        <StaffForm
          key={editing?.id ?? 'create'}
          mode={formMode}
          properties={properties ?? []}
          initialValues={editing ? toStaffFormValues(editing) : undefined}
          submitting={saving}
          linkedAccount={Boolean(editing?.userId)}
          onSubmit={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
