import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { GatePassCard } from '@/components/leave/GatePassCard';
import { LeaveApprovalModal } from '@/components/leave/LeaveApprovalModal';
import { LeaveRejectModal } from '@/components/leave/LeaveRejectModal';
import { LeaveStatusBadge } from '@/components/leave/LeaveStatusBadge';
import { LeaveTimeline } from '@/components/leave/LeaveTimeline';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { leaveService } from '@/services/leave/leaveService';
import { visitorService } from '@/services/visitor/visitorService';
import { LEAVE_TYPE_LABELS, LeaveStatus } from '@/types/leave';
import { formatShortDate, formatTime } from '@/utils/format';
import { emptyEntryExitFilters } from '@/utils/entryExitRules';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

function listPath(pathname: string): string {
  if (pathname.startsWith('/tenant')) return PATHS.tenant.leave;
  if (pathname.startsWith('/warden')) return PATHS.warden.leaveRequests;
  return PATHS.admin.leaveRequests;
}

export function LeaveDetailsPage() {
  const { leaveId = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const canApprove = useHasPermission(Permission.LEAVE_APPROVE) && !isTenant;
  const listHref = listPath(location.pathname);

  const leaveLoader = useCallback(() => {
    if (isTenant && user) return leaveService.getMyLeaveById(leaveId, user.id);
    return leaveService.getLeaveById(leaveId);
  }, [isTenant, leaveId, user]);
  const logsLoader = useCallback(() => visitorService.getEntryExitLogs(emptyEntryExitFilters()), []);

  const { data: leave, status, error, reload } = useAsyncResource(leaveLoader);
  const { data: logs, reload: reloadLogs } = useAsyncResource(logsLoader);
  const passLoader = useCallback(() => {
    if (!leave?.gatePassId && !leave) return Promise.resolve(null);
    return leaveService.getGatePass(leave.gatePassId ?? leave.id).catch(() => null);
  }, [leave]);
  const { data: gatePass, reload: reloadPass } = useAsyncResource(passLoader);

  const movement = useMemo(() => (logs ?? []).find((log) => log.leaveId === leaveId), [leaveId, logs]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [saving, setSaving] = useState(false);
  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;

  return (
    <div>
      <PageHeader
        title={leave ? `${leave.leaveCode} · ${LEAVE_TYPE_LABELS[leave.leaveType]}` : 'Leave'}
        description={leave ? `${leave.tenantName} · Room ${leave.roomNumber}` : undefined}
        breadcrumbs={[{ label: isTenant ? 'Leave & Gate Pass' : 'Leave Requests', href: listHref }, { label: 'Details' }]}
        showBack
        actions={
          leave && actor && canApprove && leave.status === LeaveStatus.PENDING ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setApproveOpen(true)}>Approve</Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>
                Reject
              </Button>
            </div>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load leave request.'} onRetry={reload} /> : null}

      {status === 'success' && leave ? (
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader title="Leave details" action={<LeaveStatusBadge status={leave.status} />} />
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="typo-muted">Leave ID</dt>
                <dd className="mt-1 font-medium">{leave.leaveCode}</dd>
              </div>
              <div>
                <dt className="typo-muted">Type</dt>
                <dd className="mt-1 font-medium">{LEAVE_TYPE_LABELS[leave.leaveType]}</dd>
              </div>
              <div>
                <dt className="typo-muted">Start</dt>
                <dd className="mt-1 font-medium">
                  {formatShortDate(leave.startDate)} · {formatTime(leave.startTime)}
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Expected return</dt>
                <dd className="mt-1 font-medium">
                  {formatShortDate(leave.expectedReturnDate)} · {formatTime(leave.expectedReturnTime)}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="typo-muted">Reason</dt>
                <dd className="mt-1 font-medium">{leave.reason}</dd>
              </div>
              {leave.approvedByName ? (
                <div>
                  <dt className="typo-muted">Approval</dt>
                  <dd className="mt-1 font-medium">{leave.approvedByName}</dd>
                </div>
              ) : null}
              {leave.status === LeaveStatus.REJECTED ? (
                <div className="sm:col-span-2">
                  <dt className="typo-muted">Rejection reason</dt>
                  <dd className="mt-1 font-medium">{leave.rejectedReason ?? '—'}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
          <div className="space-y-5">
            <Card>
              <CardHeader title="Timeline" />
              <LeaveTimeline
                leave={leave}
                gatePass={gatePass}
                exitAt={movement?.exitAt}
                returnAt={movement?.returnAt}
              />
            </Card>
            {gatePass ? (
              <GatePassCard
                pass={gatePass}
                exitAt={movement?.exitAt}
                overdue={Boolean(movement?.exitAt && !movement?.returnAt)}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <LeaveApprovalModal
        leave={approveOpen ? leave ?? null : null}
        saving={saving}
        onClose={() => setApproveOpen(false)}
        onConfirm={async () => {
          if (!leave || !actor) return;
          setSaving(true);
          try {
            const result = await leaveService.approveLeave(leave.id, actor);
            toast('success', 'Leave approved.', `Gate pass ${result.gatePass.passCode} generated.`);
            setApproveOpen(false);
            reload();
            reloadPass();
            reloadLogs();
          } catch (cause) {
            toast('error', 'Unable to approve', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <LeaveRejectModal
        leave={rejectOpen ? leave ?? null : null}
        reason={rejectReason}
        error={rejectError}
        saving={saving}
        onReasonChange={(value) => {
          setRejectReason(value);
          setRejectError('');
        }}
        onClose={() => setRejectOpen(false)}
        onConfirm={async () => {
          if (!leave || !actor) return;
          if (!rejectReason.trim()) {
            setRejectError('A reason is required.');
            return;
          }
          setSaving(true);
          try {
            await leaveService.rejectLeave(leave.id, rejectReason, actor);
            toast('success', 'Leave rejected');
            setRejectOpen(false);
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
