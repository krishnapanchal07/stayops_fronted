import { TextInput } from '@/components/forms/TextInput';
import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { PageHeader } from '@/components/common/PageHeader';
import { AssignComplaintModal } from '@/components/complaints/AssignComplaintModal';
import { ChangeComplaintStatusModal } from '@/components/complaints/ChangeComplaintStatusModal';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useFinanceTable } from '@/hooks/useFinanceTable';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import {
  PATHS,
  complaintDetailPath,
  tenantComplaintDetailPath,
  wardenComplaintDetailPath,
} from '@/routes/paths';
import { complaintService } from '@/services/complaint/complaintService';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { tenantService } from '@/services/tenant/tenantService';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  type Complaint,
  type ComplaintFilters,
  type ComplaintFormValues,
} from '@/types/complaint';
import type { DataTableColumn } from '@/types/ui';
import { emptyComplaintFilters, isComplaintOverdue } from '@/utils/complaintRules';
import { emptyComplaintForm, validateComplaintForm, type ComplaintFormErrors } from '@/utils/complaintValidation';
import { formatDateTime, formatShortDate } from '@/utils/format';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type TenantTab = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OVERDUE';

function detailHref(pathname: string, id: string): string {
  if (pathname.startsWith('/tenant')) return tenantComplaintDetailPath(id);
  if (pathname.startsWith('/warden')) return wardenComplaintDetailPath(id);
  return complaintDetailPath(id);
}

export function ComplaintListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.COMPLAINT_CREATE);
  const canAssign = useHasPermission(Permission.COMPLAINT_ASSIGN) && !isTenant;
  const canUpdate = useHasPermission(Permission.COMPLAINT_UPDATE) && !isTenant;
  const homeHref = isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;

  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const roomsLoader = useCallback(() => roomService.getRooms(), []);
  const tenantLoader = useCallback(() => {
    if (!isTenant || !user) return Promise.resolve(null);
    return tenantService.getMyTenant();
  }, [isTenant, user]);

  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: rooms } = useAsyncResource(roomsLoader);
  const { data: tenant } = useAsyncResource(tenantLoader);

  const [filters, setFilters] = useState<ComplaintFilters>(emptyComplaintFilters());
  const [tab, setTab] = useState<TenantTab>('ALL');
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState({ propertyId: '', buildingId: '', floorId: '', roomId: '' });
  const [formValues, setFormValues] = useState<ComplaintFormValues>(emptyComplaintForm());
  const [formErrors, setFormErrors] = useState<ComplaintFormErrors>({});
  const [formSaving, setFormSaving] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Complaint | null>(null);
  const [statusTarget, setStatusTarget] = useState<Complaint | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  const table = useFinanceTable<Complaint>('/complaints', { ...filters, overdueOnly: String(filters.overdueOnly), tab });
  const { status, error } = table;
  const summaryResource = useAsyncResource(complaintService.getComplaintSummary);
  const summary = summaryResource.data;
  const reload = () => { table.reload(); summaryResource.reload(); };
  const roomRows = useMemo(() => rooms ?? [], [rooms]);
  const staffProperty = assignTarget?.propertyId ?? filters.propertyId;
  const staffLoader = useCallback(() => canAssign ? complaintService.getMaintenanceStaff(staffProperty) : Promise.resolve([]), [canAssign, staffProperty]);
  const { data: staff } = useAsyncResource(staffLoader);
  const optionsLoader = useCallback(() => canCreate && !isTenant && raiseOpen && locationFilter.propertyId
    ? complaintService.getEligibleTenants(locationFilter) : Promise.resolve([]), [canCreate, isTenant, raiseOpen, locationFilter]);
  const tenantOptions = useAsyncResource(optionsLoader);
  const selectedTenant = tenantOptions.data?.find((item) => item.id === formValues.tenantId);
  const eligibleRooms = roomRows.filter((room) => room.propertyId === locationFilter.propertyId);
  const formBuildings = [...new Map(eligibleRooms.map((room) => [room.buildingId, room.buildingName])).entries()];
  const formFloors = [...new Map(eligibleRooms.filter((room) => room.buildingId === locationFilter.buildingId)
    .map((room) => [room.floorId, room.floorName])).entries()];
  const formRooms = eligibleRooms.filter((room) => room.floorId === locationFilter.floorId);
  const selectLocation = (next: typeof locationFilter) => {
    setLocationFilter(next);
    setFormValues((current) => ({ ...current, tenantId: undefined, roomId: '' }));
  };
  const canRaise = canCreate && (!isTenant || Boolean(tenant?.roomId));

  const buildings = useMemo(() => {
    const seen = new Map<string, string>();
    for (const room of roomRows) {
      if (filters.propertyId && room.propertyId !== filters.propertyId) continue;
      seen.set(room.buildingId, room.buildingName);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [filters.propertyId, roomRows]);
  const floors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const room of roomRows) {
      if (filters.propertyId && room.propertyId !== filters.propertyId) continue;
      if (filters.buildingId && room.buildingId !== filters.buildingId) continue;
      seen.set(room.floorId, room.floorName);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [filters.buildingId, filters.propertyId, roomRows]);
  const roomOptions = useMemo(() => {
    return roomRows
      .filter((room) => {
        if (filters.propertyId && room.propertyId !== filters.propertyId) return false;
        if (filters.buildingId && room.buildingId !== filters.buildingId) return false;
        if (filters.floorId && room.floorId !== filters.floorId) return false;
        return true;
      })
      .map((room) => ({ value: room.id, label: room.roomNumber }));
  }, [filters.buildingId, filters.floorId, filters.propertyId, roomRows]);

  const roomLabel = !isTenant ? (selectedTenant ? `${selectedTenant.roomNumber} · ${selectedTenant.propertyName}` : 'Select a tenant') : tenant?.roomNumber
    ? `${tenant.roomNumber}${tenant.propertyName ? ` · ${tenant.propertyName}` : ''}`
    : 'No active allocation';

  const openRaise = () => {
    setFormValues(emptyComplaintForm(tenant?.roomId ?? ''));
    setFormErrors({});
    setLocationFilter({ propertyId: '', buildingId: '', floorId: '', roomId: '' });
    setRaiseOpen(true);
  };
  const closeRaise = () => {
    if (formSaving) return;
    for (const item of formValues.attachments) URL.revokeObjectURL(item.previewUrl);
    setRaiseOpen(false);
  };

  const columns: DataTableColumn<Complaint>[] = [
    {
      id: 'code',
      header: 'Complaint ID',
      accessor: 'complaintCode',
      sortable: true,
      render: (row) => <span className="font-semibold text-text">{row.complaintCode}</span>,
    },
    ...(!isTenant
      ? [{ id: 'tenant', header: 'Tenant', accessor: 'tenantName' as const, sortable: true }]
      : []),
    { id: 'title', header: 'Title', accessor: 'title', sortable: true },
    {
      id: 'category',
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (row) => COMPLAINT_CATEGORY_LABELS[row.category],
    },
    { id: 'room', header: 'Room', accessor: 'roomNumber', sortable: true },
    {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => <StatusPill value={COMPLAINT_PRIORITY_LABELS[row.priority]} />,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <StatusPill value={COMPLAINT_STATUS_LABELS[row.status]} />
          {isComplaintOverdue(row) ? <StatusPill value="Overdue" /> : null}
        </div>
      ),
    },
    ...(!isTenant
      ? [{ id: 'assignee', header: 'Assigned To', accessor: 'assignedToName' as const, sortable: true, render: (row: Complaint) => row.assignedToName ?? '—' }]
      : []),
    {
      id: 'created',
      header: 'Created',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => formatShortDate(row.createdAt.slice(0, 10)),
    },
    {
      id: 'due',
      header: 'Due',
      accessor: 'dueAt',
      sortable: true,
      render: (row) => formatDateTime(row.dueAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          trigger={
            <IconButton label={`Actions for ${row.complaintCode}`} variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={[
            { id: 'view', label: 'View', onSelect: () => navigate(detailHref(location.pathname, row.id)) },
            ...(canAssign
              ? [{ id: 'assign', label: 'Assign', onSelect: () => setAssignTarget(row) }]
              : []),
            ...(canUpdate
              ? [{ id: 'status', label: 'Change Status', onSelect: () => setStatusTarget(row) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isTenant ? 'My Complaints' : 'Complaints'}
        description={
          isTenant
            ? 'Track reported issues and maintenance requests.'
            : 'Review, assign, and resolve tenant maintenance issues.'
        }
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: isTenant ? 'My Complaints' : 'Complaints' }]}
        actions={
          canRaise ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openRaise}>
              Raise Complaint
            </Button>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load complaints.'} onRetry={reload} />
      ) : null}

      {status !== 'error' ? (
        <div className="space-y-5">
          {summaryResource.status === 'error' ? <ErrorState description="Unable to load complaint statistics." onRetry={summaryResource.reload} /> : null}
          {summary ? <div className={`grid gap-4 sm:grid-cols-2 ${isTenant ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
            {isTenant ? (
              <>
                <StatCard metric={{ id: 'open', label: 'Open', value: String(summary.open), tone: 'warning' }} />
                <StatCard metric={{ id: 'progress', label: 'In Progress', value: String(summary.inProgress), tone: 'info' }} />
                <StatCard metric={{ id: 'resolved', label: 'Resolved', value: String(summary.resolved), tone: 'success' }} />
                <StatCard metric={{ id: 'overdue', label: 'Overdue', value: String(summary.overdue), tone: 'danger' }} />
              </>
            ) : (
              <>
                <StatCard metric={{ id: 'total', label: 'Total Complaints', value: String(summary.total), tone: 'primary' }} />
                <StatCard metric={{ id: 'open', label: 'Open', value: String(summary.open), tone: 'warning' }} />
                <StatCard metric={{ id: 'progress', label: 'In Progress', value: String(summary.inProgress), tone: 'info' }} />
                <StatCard metric={{ id: 'overdue', label: 'Overdue', value: String(summary.overdue), tone: 'danger' }} />
                <StatCard metric={{ id: 'urgent', label: 'Urgent', value: String(summary.urgent), tone: 'danger' }} />
                <StatCard
                  metric={{
                    id: 'month',
                    label: 'Resolved This Month',
                    value: String(summary.resolvedThisMonth),
                    tone: 'success',
                  }}
                />
              </>
            )}
          </div> : null}

          {isTenant ? (
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['ALL', 'All'],
                  ['OPEN', 'Open'],
                  ['IN_PROGRESS', 'In Progress'],
                  ['RESOLVED', 'Resolved'],
                  ['OVERDUE', 'Overdue'],
                ] as const
              ).map(([value, label]) => (
                <Button key={value} size="sm" variant={tab === value ? 'primary' : 'outline'} onClick={() => setTab(value)}>
                  {label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
              <Select
                label="Property"
                name="propertyId"
                value={filters.propertyId}
                options={[
                  { value: '', label: 'All properties' },
                  ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
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
                label="Building"
                name="buildingId"
                value={filters.buildingId}
                options={[{ value: '', label: 'All buildings' }, ...buildings]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, buildingId: event.target.value, floorId: '', roomId: '' }))
                }
              />
              <Select
                label="Floor"
                name="floorId"
                value={filters.floorId}
                options={[{ value: '', label: 'All floors' }, ...floors]}
                onChange={(event) => setFilters((current) => ({ ...current, floorId: event.target.value, roomId: '' }))}
              />
              <Select
                label="Room"
                name="roomId"
                value={filters.roomId}
                options={[{ value: '', label: 'All rooms' }, ...roomOptions]}
                onChange={(event) => setFilters((current) => ({ ...current, roomId: event.target.value }))}
              />
              <Select
                label="Category"
                name="category"
                value={filters.category}
                options={[
                  { value: '', label: 'All categories' },
                  ...Object.values(ComplaintCategory).map((value) => ({
                    value,
                    label: COMPLAINT_CATEGORY_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category: event.target.value as ComplaintFilters['category'] }))
                }
              />
              <Select
                label="Priority"
                name="priority"
                value={filters.priority}
                options={[
                  { value: '', label: 'All priorities' },
                  ...Object.values(ComplaintPriority).map((value) => ({
                    value,
                    label: COMPLAINT_PRIORITY_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, priority: event.target.value as ComplaintFilters['priority'] }))
                }
              />
              <Select
                label="Status"
                name="status"
                value={filters.status}
                options={[
                  { value: '', label: 'All statuses' },
                  ...Object.values(ComplaintStatus).map((value) => ({ value, label: COMPLAINT_STATUS_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value as ComplaintFilters['status'] }))
                }
              />
              <Select
                label="Assigned Staff"
                name="assignedTo"
                value={filters.assignedTo}
                options={[
                  { value: '', label: 'All staff' },
                  ...(staff ?? []).map((person) => ({ value: person.id, label: person.name })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, assignedTo: event.target.value }))}
              />
              <DateInput
                label="From"
                name="fromDate"
                value={filters.fromDate}
                onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
              />
              <DateInput
                label="To"
                name="toDate"
                value={filters.toDate}
                onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
              />
              <Select
                label="Overdue"
                name="overdueOnly"
                value={filters.overdueOnly ? 'yes' : ''}
                options={[
                  { value: '', label: 'All' },
                  { value: 'yes', label: 'Overdue only' },
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, overdueOnly: event.target.value === 'yes' }))
                }
              />
              <SearchInput
                value={table.search}
                placeholder="Search ID, tenant, room, title"
                aria-label="Search complaints"
                onChange={(event) => table.setSearch(event.target.value)}
              />
            </div>
          )}

          {isTenant && !tenant?.roomId ? <p className="typo-helper">A current room allocation is required to raise a complaint.</p> : null}
          {isTenant ? <TextInput label="Search complaints" name="tenantComplaintSearch" value={table.search} onChange={(event) => table.setSearch(event.target.value)} /> : null}
            <DataTable
              columns={columns}
              data={table.data?.items ?? []}
              {...table.tableProps}
              rowKey={(row) => row.id}
              searchPlaceholder="Search complaint ID, title, room"
              emptyTitle={isTenant ? 'No complaints yet.' : 'No complaints found.'}
              emptyDescription={isTenant ? 'Raise a complaint to get started.' : 'Try adjusting your filters.'}
              renderMobile={(row) => (
                <Card>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text">{row.title}</p>
                        <p className="typo-helper mt-0.5">
                          {row.complaintCode} · Room {row.roomNumber}
                        </p>
                      </div>
                      <StatusPill value={COMPLAINT_STATUS_LABELS[row.status]} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill value={COMPLAINT_PRIORITY_LABELS[row.priority]} />
                      <StatusPill value={COMPLAINT_CATEGORY_LABELS[row.category]} />
                      {isComplaintOverdue(row) ? <StatusPill value="Overdue" /> : null}
                    </div>
                    <p className="typo-helper">Updated {formatDateTime(row.updatedAt)}</p>
                    <Button size="sm" variant="outline" onClick={() => navigate(detailHref(location.pathname, row.id))}>
                      View
                    </Button>
                  </div>
                </Card>
              )}
            />
        </div>
      ) : null}

      <Modal open={raiseOpen} title="Raise Complaint" onClose={closeRaise} className="max-h-[90vh] max-w-xl overflow-y-auto">
        {!isTenant ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Select label="Property" name="complaintProperty" placeholder="Select property" value={locationFilter.propertyId}
              options={(properties ?? []).map((item) => ({ value: item.id, label: item.name }))}
              onChange={(e) => selectLocation({ propertyId: e.target.value, buildingId: '', floorId: '', roomId: '' })} />
            <Select label="Building" name="complaintBuilding" value={locationFilter.buildingId} disabled={!locationFilter.propertyId}
              options={[{ value: '', label: 'Any building' }, ...formBuildings.map(([value,label]) => ({ value, label }))]}
              onChange={(e) => selectLocation({ ...locationFilter, buildingId: e.target.value, floorId: '', roomId: '' })} />
            <Select label="Floor" name="complaintFloor" value={locationFilter.floorId} disabled={!locationFilter.buildingId}
              options={[{ value: '', label: 'Any floor' }, ...formFloors.map(([value,label]) => ({ value, label }))]}
              onChange={(e) => selectLocation({ ...locationFilter, floorId: e.target.value, roomId: '' })} />
            <Select label="Room filter" name="complaintRoom" value={locationFilter.roomId} disabled={!locationFilter.floorId}
              options={[{ value: '', label: 'Any room' }, ...formRooms.map((item) => ({ value: item.id, label: item.roomNumber }))]}
              onChange={(e) => selectLocation({ ...locationFilter, roomId: e.target.value })} />
            <Select label="Tenant" name="complaintTenant" value={formValues.tenantId ?? ''}
              disabled={!locationFilter.propertyId || tenantOptions.status !== 'success'}
              options={[{ value: '', label: tenantOptions.status === 'loading' ? 'Loading tenants…' :
                tenantOptions.data?.length ? 'Select an allocated tenant' : 'No allocated tenants' },
                ...(tenantOptions.data ?? []).map((t) => ({ value: t.id, label: `${t.name} · Room ${t.roomNumber}` }))]}
              onChange={(e) => { const found = tenantOptions.data?.find((t) => t.id === e.target.value); setFormValues((old) => ({ ...old, tenantId: found?.id, roomId: found?.roomId ?? '' })); }}
            />
            {tenantOptions.status === 'error' ? <Button variant="outline" onClick={tenantOptions.reload}>Retry loading tenants</Button> : null}
          </div>
        ) : null}
        <ComplaintForm
          values={formValues}
          errors={formErrors}
          roomLabel={roomLabel}
          uploadedBy={user?.name ?? 'Tenant'}
          submitting={formSaving}
          onChange={setFormValues}
          onCancel={closeRaise}
          onAttachmentError={(message) => toast('error', 'Attachment', message)}
          onSubmit={async () => {
            if (!user || formSaving) return;
            if (!isTenant && !selectedTenant) {
              toast('error', 'Select an allocated tenant.');
              return;
            }
            const errors = validateComplaintForm(formValues, true);
            setFormErrors(errors);
            if (Object.keys(errors).length > 0) {
              toast('error', 'Unable to create complaint', Object.values(errors)[0]);
              return;
            }
            setFormSaving(true);
            try {
              await complaintService.createComplaint(formValues, { id: user.id, name: user.name, role: user.role });
              toast('success', 'Complaint created', 'Your issue has been submitted.');
              for (const item of formValues.attachments) URL.revokeObjectURL(item.previewUrl);
              setRaiseOpen(false);
              reload();
            } catch (cause) {
              toast('error', 'Unable to create complaint', cause instanceof Error ? cause.message : 'Please try again.');
            } finally {
              setFormSaving(false);
            }
          }}
        />
      </Modal>

      <AssignComplaintModal
        key={assignTarget ? `${assignTarget.id}-${assignTarget.updatedAt}` : 'assign-closed'}
        open={Boolean(assignTarget)}
        complaint={assignTarget}
        staff={staff ?? []}
        submitting={assignSaving}
        onClose={() => setAssignTarget(null)}
        onSubmit={async (staffId, priority, dueAt, estimatedCost) => {
          if (!assignTarget || !user) return;
          setAssignSaving(true);
          try {
            await complaintService.assignComplaint(assignTarget.id, staffId, {
              estimatedCost,
              priority,
              dueAt,
              actor: { id: user.id, name: user.name, role: user.role },
            });
            toast('success', 'Complaint assigned', 'A maintenance task has been created.');
            setAssignTarget(null);
            reload();
          } catch (cause) {
            toast('error', 'Unable to assign', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setAssignSaving(false);
          }
        }}
      />

      <ChangeComplaintStatusModal
        key={statusTarget ? `${statusTarget.id}-${statusTarget.status}` : 'status-closed'}
        open={Boolean(statusTarget)}
        complaint={statusTarget}
        submitting={statusSaving}
        onClose={() => setStatusTarget(null)}
        onSubmit={async (nextStatus) => {
          if (!statusTarget || !user) return;
          setStatusSaving(true);
          try {
            await complaintService.changeComplaintStatus(statusTarget.id, nextStatus, {
              id: user.id,
              name: user.name,
              role: user.role,
            });
            toast('success', 'Status updated', `Complaint is now ${COMPLAINT_STATUS_LABELS[nextStatus]}.`);
            setStatusTarget(null);
            reload();
          } catch (cause) {
            toast('error', 'Unable to update status', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setStatusSaving(false);
          }
        }}
      />
    </div>
  );
}
