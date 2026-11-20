import { Card } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { LeaveApprovalModal } from '@/components/leave/LeaveApprovalModal';
import { LeaveForm } from '@/components/leave/LeaveForm';
import { LeaveRejectModal } from '@/components/leave/LeaveRejectModal';
import { LeaveStatusBadge } from '@/components/leave/LeaveStatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, adminLeaveDetailPath, tenantLeaveDetailPath, wardenLeaveDetailPath } from '@/routes/paths';
import { leaveService } from '@/services/leave/leaveService';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS, LeaveStatus, LeaveType, type LeaveFilters, type LeaveRequest } from '@/types/leave';
import type { DataTableColumn } from '@/types/ui';
import { formatShortDate, formatTime } from '@/utils/format';
import { emptyLeaveFilters, filterLeaveRequests, summarizeLeaveRequests } from '@/utils/leaveRules';
import { emptyLeaveForm, validateLeaveForm, type LeaveFormErrors } from '@/utils/leaveValidation';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function detailHref(pathname: string, id: string): string {
  if (pathname.startsWith('/tenant')) return tenantLeaveDetailPath(id);
  if (pathname.startsWith('/warden')) return wardenLeaveDetailPath(id);
  return adminLeaveDetailPath(id);
}

export function LeaveListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.LEAVE_CREATE) && isTenant;
  const canApprove = useHasPermission(Permission.LEAVE_APPROVE) && !isTenant;
  const homeHref = isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;

  const leavesLoader = useCallback(() => {
    if (isTenant && user) return leaveService.getMyLeaveRequests(user.id);
    if (isWarden && user?.propertyIds?.length) return leaveService.getLeaveRequests(user.propertyIds);
    return leaveService.getLeaveRequests();
  }, [isTenant, isWarden, user]);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const tenantLoader = useCallback(() => {
    if (!isTenant || !user) return Promise.resolve(null);
    return tenantService.getTenantById(user.id).catch(() => null);
  }, [isTenant, user]);

  const { data, status, error, reload } = useAsyncResource(leavesLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: tenant } = useAsyncResource(tenantLoader);

  const [filters, setFilters] = useState<LeaveFilters>(emptyLeaveFilters());
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyLeaveForm());
  const [formErrors, setFormErrors] = useState<LeaveFormErrors>({});
  const [formSaving, setFormSaving] = useState(false);
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [saving, setSaving] = useState(false);

  const leaves = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterLeaveRequests(leaves, filters), [filters, leaves]);
  const summary = useMemo(() => summarizeLeaveRequests(leaves), [leaves]);
  const hostLabel = tenant?.roomNumber
    ? `${tenant.fullName} · Room ${tenant.roomNumber}`
    : 'No active allocation';
  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;

  const columns: DataTableColumn<LeaveRequest>[] = [
    {
      id: 'code',
      header: 'Leave ID',
      accessor: 'leaveCode',
      sortable: true,
      render: (row) => <span className="font-semibold text-text">{row.leaveCode}</span>,
    },
    ...(!isTenant ? [{ id: 'tenant', header: 'Tenant', accessor: 'tenantName' as const, sortable: true }] : []),
    {
      id: 'type',
      header: 'Type',
      accessor: 'leaveType',
      sortable: true,
      render: (row) => LEAVE_TYPE_LABELS[row.leaveType],
    },
    {
      id: 'start',
      header: 'Start',
      accessor: 'startDate',
      sortable: true,
      render: (row) => `${formatShortDate(row.startDate)} · ${formatTime(row.startTime)}`,
    },
    {
      id: 'return',
      header: 'Return',
      accessor: 'expectedReturnDate',
      sortable: true,
      render: (row) => `${formatShortDate(row.expectedReturnDate)} · ${formatTime(row.expectedReturnTime)}`,
    },
    { id: 'reason', header: 'Reason', accessor: 'reason', sortable: true },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <LeaveStatusBadge status={row.status} />,
    },
    {
      id: 'pass',
      header: 'Gate Pass',
      accessor: 'gatePassId',
      render: (row) => row.gatePassId ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          trigger={
            <IconButton label={`Actions for ${row.leaveCode}`} variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={[
            { id: 'view', label: 'View', onSelect: () => navigate(detailHref(location.pathname, row.id)) },
            ...(canApprove && row.status === LeaveStatus.PENDING
              ? [
                  { id: 'approve', label: 'Approve', onSelect: () => setApproveTarget(row) },
                  { id: 'reject', label: 'Reject', onSelect: () => setRejectTarget(row) },
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
        title={isTenant ? 'Leave & Gate Pass' : 'Leave Requests'}
        description={
          isTenant
            ? 'Apply for leave and view your gate pass after approval.'
            : 'Review and approve tenant leave requests.'
        }
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: isTenant ? 'Leave & Gate Pass' : 'Leave Requests' }]}
        actions={
          canCreate ? (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setFormValues(emptyLeaveForm());
                setFormErrors({});
                setFormOpen(true);
              }}
            >
              Apply Leave
            </Button>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load leave requests.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'pending', label: 'Pending', value: String(summary.pending), tone: 'warning' }} />
            <StatCard metric={{ id: 'approved', label: 'Approved', value: String(summary.approved), tone: 'success' }} />
            <StatCard metric={{ id: 'upcoming', label: 'Upcoming', value: String(summary.upcoming), tone: 'info' }} />
            <StatCard metric={{ id: 'completed', label: 'Completed', value: String(summary.completed), tone: 'primary' }} />
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
                onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
              />
              <Select
                label="Type"
                name="leaveType"
                value={filters.leaveType}
                options={[
                  { value: '', label: 'All types' },
                  ...Object.values(LeaveType).map((value) => ({ value, label: LEAVE_TYPE_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, leaveType: event.target.value as LeaveFilters['leaveType'] }))
                }
              />
              <Select
                label="Status"
                name="status"
                value={filters.status}
                options={[
                  { value: '', label: 'All statuses' },
                  ...Object.values(LeaveStatus).map((value) => ({ value, label: LEAVE_STATUS_LABELS[value] })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value as LeaveFilters['status'] }))
                }
              />
              <SearchInput
                value={filters.query}
                placeholder="Search tenant, room, leave ID"
                aria-label="Search leave requests"
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
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
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <EmptyState
              title="No pending leave requests."
              description={isTenant ? 'Apply for leave when you need to go out overnight or longer.' : 'Try adjusting your filters.'}
              actionLabel={canCreate ? 'Apply Leave' : undefined}
              onAction={canCreate ? () => setFormOpen(true) : undefined}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={isTenant}
              searchPlaceholder="Search leave ID, type, reason"
              emptyTitle="No leave requests found."
              renderMobile={(row) => (
                <Card>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text">{LEAVE_TYPE_LABELS[row.leaveType]}</p>
                        <p className="typo-helper">{row.leaveCode}</p>
                      </div>
                      <LeaveStatusBadge status={row.status} />
                    </div>
                    <p className="text-sm text-muted">
                      {formatShortDate(row.startDate)} → {formatShortDate(row.expectedReturnDate)}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => navigate(detailHref(location.pathname, row.id))}>
                      View
                    </Button>
                  </div>
                </Card>
              )}
            />
          )}
        </div>
      ) : null}

      <Modal open={formOpen} title="Apply Leave" onClose={() => setFormOpen(false)} className="max-h-[90vh] max-w-xl overflow-y-auto">
        <LeaveForm
          key={formOpen ? 'leave-form-open' : 'leave-form-closed'}
          values={formValues}
          errors={formErrors}
          hostLabel={hostLabel}
          submitting={formSaving}
          onChange={setFormValues}
          onCancel={() => setFormOpen(false)}
          onSubmit={async () => {
            if (!user) return;
            const errors = validateLeaveForm(formValues);
            setFormErrors(errors);
            if (Object.keys(errors).length > 0) {
              toast('error', 'Unable to submit', Object.values(errors)[0]);
              return;
            }
            if (
              leaveService.hasPendingOverlap(user.id, {
                startDate: formValues.startDate,
                startTime: formValues.startTime,
                expectedReturnDate: formValues.expectedReturnDate,
                expectedReturnTime: formValues.expectedReturnTime,
              })
            ) {
              toast('warning', 'Overlapping request', 'You already have a pending leave in this window.');
            }
            setFormSaving(true);
            try {
              const created = await leaveService.createLeaveRequest(user.id, formValues);
              toast('success', 'Leave submitted', `${created.leaveCode} is pending approval.`);
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

      <LeaveApprovalModal
        leave={approveTarget}
        saving={saving}
        onClose={() => setApproveTarget(null)}
        onConfirm={async () => {
          if (!approveTarget || !actor) return;
          setSaving(true);
          try {
            const result = await leaveService.approveLeave(approveTarget.id, actor);
            toast('success', 'Leave approved.', `Gate pass ${result.gatePass.passCode} generated.`);
            setApproveTarget(null);
            reload();
          } catch (cause) {
            toast('error', 'Unable to approve', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <LeaveRejectModal
        leave={rejectTarget}
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
            await leaveService.rejectLeave(rejectTarget.id, rejectReason, actor);
            toast('success', 'Leave rejected', 'The tenant can see the reason.');
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
    </div>
  );
}
