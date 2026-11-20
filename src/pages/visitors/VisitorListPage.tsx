import { Dropdown } from '@/components/common/Dropdown';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { VisitorApprovalModal } from '@/components/visitors/VisitorApprovalModal';
import { VisitorCard } from '@/components/visitors/VisitorCard';
import { VisitorForm } from '@/components/visitors/VisitorForm';
import { VisitorRejectModal } from '@/components/visitors/VisitorRejectModal';
import { VisitorStatusBadge } from '@/components/visitors/VisitorStatusBadge';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import {
  PATHS,
  adminVisitorDetailPath,
  tenantVisitorDetailPath,
  wardenVisitorDetailPath,
} from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { tenantService } from '@/services/tenant/tenantService';
import { visitorService } from '@/services/visitor/visitorService';
import { VISITOR_STATUS_LABELS, VisitorStatus, type Visitor, type VisitorFilters } from '@/types/visitor';
import type { DataTableColumn } from '@/types/ui';
import { formatShortDate, formatTime } from '@/utils/format';
import { emptyVisitorFilters, filterVisitors, isVisitorOverlapping, summarizeVisitors } from '@/utils/visitorRules';
import { emptyVisitorForm, validateVisitorForm, type VisitorFormErrors } from '@/utils/visitorValidation';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function detailHref(pathname: string, id: string): string {
  if (pathname.startsWith('/tenant')) return tenantVisitorDetailPath(id);
  if (pathname.startsWith('/warden')) return wardenVisitorDetailPath(id);
  return adminVisitorDetailPath(id);
}

export function VisitorListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.VISITOR_CREATE) && isTenant;
  const canApprove = useHasPermission(Permission.VISITOR_APPROVE) && !isTenant;
  const homeHref = isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;

  const visitorsLoader = useCallback(() => {
    if (isTenant && user) return visitorService.getVisitorsByTenant(user.id);
    if ((isWarden || user?.role === 'SECURITY') && user?.propertyIds?.length) {
      return visitorService.getVisitors(user.propertyIds);
    }
    return visitorService.getVisitors();
  }, [isTenant, isWarden, user]);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const roomsLoader = useCallback(() => roomService.getRooms(), []);
  const tenantLoader = useCallback(() => {
    if (!isTenant || !user) return Promise.resolve(null);
    return tenantService.getTenantById(user.id).catch(() => null);
  }, [isTenant, user]);

  const { data, status, error, reload } = useAsyncResource(visitorsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: rooms } = useAsyncResource(roomsLoader);
  const { data: tenant } = useAsyncResource(tenantLoader);

  const [filters, setFilters] = useState<VisitorFilters>(emptyVisitorFilters());
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyVisitorForm());
  const [formErrors, setFormErrors] = useState<VisitorFormErrors>({});
  const [formSaving, setFormSaving] = useState(false);
  const [approveTarget, setApproveTarget] = useState<Visitor | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Visitor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Visitor | null>(null);
  const [saving, setSaving] = useState(false);

  const visitors = useMemo(() => data ?? [], [data]);
  const roomRows = useMemo(() => rooms ?? [], [rooms]);
  const filtered = useMemo(() => {
    return filterVisitors(visitors, filters).filter((visitor) => {
      if (!filters.buildingId) return true;
      return roomRows.find((room) => room.id === visitor.roomId)?.buildingId === filters.buildingId;
    });
  }, [filters, roomRows, visitors]);
  const summary = useMemo(() => summarizeVisitors(visitors), [visitors]);
  const buildings = useMemo(() => {
    const seen = new Map<string, string>();
    for (const room of roomRows) {
      if (filters.propertyId && room.propertyId !== filters.propertyId) continue;
      seen.set(room.buildingId, room.buildingName);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, label }));
  }, [filters.propertyId, roomRows]);
  const roomOptions = useMemo(
    () =>
      roomRows
        .filter((room) => {
          if (filters.propertyId && room.propertyId !== filters.propertyId) return false;
          if (filters.buildingId && room.buildingId !== filters.buildingId) return false;
          return true;
        })
        .map((room) => ({ value: room.id, label: room.roomNumber })),
    [filters.buildingId, filters.propertyId, roomRows],
  );
  const hostLabel = tenant?.roomNumber
    ? `${tenant.fullName} · Room ${tenant.roomNumber} · ${tenant.propertyName}`
    : 'No active allocation';

  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;

  const columns: DataTableColumn<Visitor>[] = [
    {
      id: 'code',
      header: 'Visitor Code',
      accessor: 'visitorCode',
      sortable: true,
      render: (row) => <span className="font-semibold text-text">{row.visitorCode}</span>,
    },
    { id: 'visitor', header: 'Visitor', accessor: 'visitorName', sortable: true },
    ...(!isTenant ? [{ id: 'tenant', header: 'Tenant', accessor: 'tenantName' as const, sortable: true }] : []),
    { id: 'room', header: 'Room', accessor: 'roomNumber', sortable: true },
    ...(!isTenant ? [{ id: 'property', header: 'Property', accessor: 'propertyName' as const, sortable: true }] : []),
    {
      id: 'date',
      header: 'Visit Date',
      accessor: 'visitDate',
      sortable: true,
      render: (row) => formatShortDate(row.visitDate),
    },
    {
      id: 'entry',
      header: isTenant ? 'Expected Time' : 'Expected Entry',
      accessor: 'expectedEntryTime',
      sortable: true,
      render: (row) =>
        isTenant
          ? `${formatTime(row.expectedEntryTime)} – ${formatTime(row.expectedExitTime)}`
          : formatTime(row.expectedEntryTime),
    },
    ...(isTenant ? [{ id: 'purpose', header: 'Purpose', accessor: 'purpose' as const, sortable: true }] : []),
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <VisitorStatusBadge status={row.status} visitor={row} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          trigger={
            <IconButton label={`Actions for ${row.visitorCode}`} variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={[
            { id: 'view', label: 'View', onSelect: () => navigate(detailHref(location.pathname, row.id)) },
            ...(canApprove && row.status === VisitorStatus.PENDING
              ? [
                  { id: 'approve', label: 'Approve', onSelect: () => setApproveTarget(row) },
                  { id: 'reject', label: 'Reject', onSelect: () => setRejectTarget(row) },
                ]
              : []),
            ...(canApprove && row.status === VisitorStatus.APPROVED
              ? [{ id: 'pass', label: 'Generate Pass', onSelect: () => void generatePass(row.id) }]
              : []),
            ...((canApprove || (isTenant && row.status === VisitorStatus.PENDING)) &&
            row.status !== VisitorStatus.CHECKED_IN
              ? [{ id: 'cancel', label: 'Cancel', onSelect: () => setCancelTarget(row) }]
              : []),
          ]}
        />
      ),
    },
  ];

  const generatePass = async (id: string) => {
    try {
      await visitorService.generateVisitorPass(id);
      toast('success', 'Visitor pass generated', 'The QR pass is ready.');
      reload();
    } catch (cause) {
      toast('error', 'Unable to generate pass', cause instanceof Error ? cause.message : 'Please try again.');
    }
  };

  return (
    <div>
      <PageHeader
        title={isTenant ? 'My Visitors' : 'Visitors'}
        description={
          isTenant
            ? 'Manage upcoming visitors and view visit history.'
            : 'Review visitor requests and visitor passes for your properties.'
        }
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: isTenant ? 'My Visitors' : 'Visitors' }]}
        actions={
          canCreate ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setFormValues(emptyVisitorForm());
                setFormErrors({});
                setFormOpen(true);
              }}
            >
              Add Visitor
            </Button>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load visitors.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isTenant ? (
              <>
                <StatCard metric={{ id: 'upcoming', label: 'Upcoming Visitors', value: String(summary.upcoming), tone: 'primary' }} />
                <StatCard metric={{ id: 'pending', label: 'Pending Approval', value: String(summary.pending), tone: 'warning' }} />
                <StatCard metric={{ id: 'inside', label: 'Currently Visiting', value: String(summary.currentlyInside), tone: 'info' }} />
                <StatCard metric={{ id: 'past', label: 'Past Visits', value: String(summary.past), tone: 'success' }} />
              </>
            ) : (
              <>
                <StatCard metric={{ id: 'today', label: 'Total Today', value: String(summary.totalToday), tone: 'primary' }} />
                <StatCard metric={{ id: 'pending', label: 'Pending', value: String(summary.pending), tone: 'warning' }} />
                <StatCard metric={{ id: 'approved', label: 'Approved', value: String(summary.approved), tone: 'success' }} />
                <StatCard metric={{ id: 'inside', label: 'Currently Inside', value: String(summary.currentlyInside), tone: 'info' }} />
              </>
            )}
          </div>

          {!isTenant ? (
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
                  setFilters((current) => ({ ...current, propertyId: event.target.value, buildingId: '', roomId: '' }))
                }
              />
              <Select
                label="Building"
                name="buildingId"
                value={filters.buildingId}
                options={[{ value: '', label: 'All buildings' }, ...buildings]}
                onChange={(event) => setFilters((current) => ({ ...current, buildingId: event.target.value, roomId: '' }))}
              />
              <Select
                label="Room"
                name="roomId"
                value={filters.roomId}
                options={[{ value: '', label: 'All rooms' }, ...roomOptions]}
                onChange={(event) => setFilters((current) => ({ ...current, roomId: event.target.value }))}
              />
              <Select
                label="Status"
                name="status"
                value={filters.status}
                options={[
                  { value: '', label: 'All statuses' },
                  ...Object.values(VisitorStatus).map((value) => ({ value, label: VISITOR_STATUS_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value as VisitorFilters['status'] }))
                }
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
              <SearchInput
                value={filters.query}
                placeholder="Search visitor, tenant, room, code"
                aria-label="Search visitors"
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              />
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              title="No visitors found."
              description={isTenant ? 'Add a visitor to request a visit pass.' : 'Try adjusting your filters.'}
              actionLabel={canCreate ? 'Add Visitor' : undefined}
              onAction={canCreate ? () => setFormOpen(true) : undefined}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={isTenant}
              searchPlaceholder="Search visitor, purpose, code"
              emptyTitle="No visitors found."
              emptyDescription={isTenant ? 'Add a visitor to get started.' : 'Try adjusting your filters.'}
              renderMobile={(row) => (
                <VisitorCard visitor={row} onView={() => navigate(detailHref(location.pathname, row.id))} />
              )}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title="Add Visitor"
        onClose={() => setFormOpen(false)}
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        <VisitorForm
          key={formOpen ? 'visitor-form-open' : 'visitor-form-closed'}
          values={formValues}
          errors={formErrors}
          hostLabel={hostLabel}
          submitting={formSaving}
          onChange={setFormValues}
          onCancel={() => setFormOpen(false)}
          onSubmit={async () => {
            if (!user) return;
            const errors = validateVisitorForm(formValues);
            setFormErrors(errors);
            if (Object.keys(errors).length > 0) {
              toast('error', 'Unable to submit', Object.values(errors)[0]);
              return;
            }
            if (
              isVisitorOverlapping(
                visitors,
                user.id,
                formValues.visitDate,
                formValues.expectedEntryTime,
                formValues.expectedExitTime,
              )
            ) {
              toast('warning', 'Overlapping visit', 'You already have another visitor request in this time window.');
            }
            setFormSaving(true);
            try {
              const created = await visitorService.createVisitorRequest(user.id, formValues);
              toast('success', 'Visitor request submitted', `${created.visitorCode} is pending approval.`);
              setFormOpen(false);
              reload();
            } catch (cause) {
              toast('error', 'Unable to submit', cause instanceof Error ? cause.message : 'Please try again.');
            } finally {
              setFormSaving(false);
            }
          }}
        />
      </Modal>

      <VisitorApprovalModal
        visitor={approveTarget}
        saving={saving}
        onClose={() => setApproveTarget(null)}
        onConfirm={async () => {
          if (!approveTarget || !actor) return;
          setSaving(true);
          try {
            await visitorService.approveVisitor(approveTarget.id, actor);
            toast('success', 'Visitor approved successfully.', 'A visitor pass has been generated.');
            setApproveTarget(null);
            reload();
          } catch (cause) {
            toast('error', 'Unable to approve', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <VisitorRejectModal
        visitor={rejectTarget}
        reason={rejectReason}
        error={rejectError}
        saving={saving}
        onReasonChange={(value) => {
          setRejectReason(value);
          setRejectError('');
        }}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        onConfirm={async () => {
          if (!rejectTarget || !actor) return;
          if (!rejectReason.trim()) {
            setRejectError('A reason is required.');
            return;
          }
          setSaving(true);
          try {
            await visitorService.rejectVisitor(rejectTarget.id, rejectReason, actor);
            toast('success', 'Visitor rejected', 'The tenant can see the reason.');
            setRejectTarget(null);
            setRejectReason('');
            reload();
          } catch (cause) {
            toast('error', 'Unable to reject', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <Modal
        open={Boolean(cancelTarget)}
        title="Cancel Request"
        onClose={() => setCancelTarget(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              Keep Request
            </Button>
            <Button
              variant="danger"
              disabled={saving}
              onClick={async () => {
                if (!cancelTarget) return;
                setSaving(true);
                try {
                  await visitorService.cancelVisitor(cancelTarget.id, isTenant ? user?.id : undefined);
                  toast('success', 'Visitor request cancelled');
                  setCancelTarget(null);
                  reload();
                } catch (cause) {
                  toast('error', 'Unable to cancel', cause instanceof Error ? cause.message : 'Please try again.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              Cancel Request
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">Cancel {cancelTarget?.visitorName}? This pass cannot be used at the gate.</p>
      </Modal>
    </div>
  );
}
