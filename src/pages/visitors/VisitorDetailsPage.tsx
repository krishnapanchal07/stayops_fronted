import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VisitorApprovalModal } from '@/components/visitors/VisitorApprovalModal';
import { VisitorPass } from '@/components/visitors/VisitorPass';
import { VisitorRejectModal } from '@/components/visitors/VisitorRejectModal';
import { VisitorStatusBadge } from '@/components/visitors/VisitorStatusBadge';
import { VisitorTimeline } from '@/components/visitors/VisitorTimeline';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { visitorService } from '@/services/visitor/visitorService';
import { VISITOR_RELATIONSHIP_LABELS, VisitorStatus } from '@/types/visitor';
import { formatDateTime, formatShortDate, formatTime } from '@/utils/format';
import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

function listPath(pathname: string): string {
  if (pathname.startsWith('/tenant')) return PATHS.tenant.visitors;
  if (pathname.startsWith('/warden')) return PATHS.warden.visitors;
  return PATHS.admin.visitors;
}

export function VisitorDetailsPage() {
  const { visitorId = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const canApprove = useHasPermission(Permission.VISITOR_APPROVE) && !isTenant;
  const listHref = listPath(location.pathname);

  const loader = useCallback(() => {
    if (isTenant && user) return visitorService.getMyVisitorById(visitorId, user.id);
    return visitorService.getVisitorById(visitorId);
  }, [isTenant, user, visitorId]);
  const passLoader = useCallback(() => visitorService.getVisitorPass(visitorId).catch(() => null), [visitorId]);
  const { data: visitor, status, error, reload } = useAsyncResource(loader);
  const { data: pass, reload: reloadPass } = useAsyncResource(passLoader);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [saving, setSaving] = useState(false);
  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;
  const showPass =
    visitor &&
    (visitor.status === VisitorStatus.APPROVED ||
      visitor.status === VisitorStatus.CHECKED_IN ||
      visitor.status === VisitorStatus.CHECKED_OUT) &&
    Boolean(visitor.qrToken);

  return (
    <div>
      <PageHeader
        title={visitor?.visitorName ?? 'Visitor'}
        description={visitor ? `${visitor.visitorCode} · Room ${visitor.roomNumber}` : undefined}
        breadcrumbs={[{ label: isTenant ? 'My Visitors' : 'Visitors', href: listHref }, { label: 'Details' }]}
        showBack
        actions={
          visitor && actor ? (
            <div className="flex flex-wrap gap-2">
              {canApprove && visitor.status === VisitorStatus.PENDING ? (
                <>
                  <Button onClick={() => setApproveOpen(true)}>Approve</Button>
                  <Button variant="danger" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                </>
              ) : null}
              {canApprove && visitor.status === VisitorStatus.APPROVED ? (
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await visitorService.generateVisitorPass(visitor.id);
                      toast('success', 'Visitor pass generated');
                      reload();
                      reloadPass();
                    } catch (cause) {
                      toast('error', 'Unable to generate pass', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Generate Pass
                </Button>
              ) : null}
              {(canApprove || (isTenant && visitor.status === VisitorStatus.PENDING)) &&
              visitor.status !== VisitorStatus.CHECKED_IN ? (
                <Button variant="outline" onClick={() => setCancelOpen(true)}>
                  Cancel Request
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load visitor.'} onRetry={reload} /> : null}

      {status === 'success' && visitor ? (
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader title="Visit details" action={<VisitorStatusBadge status={visitor.status} visitor={visitor} />} />
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="typo-muted">Visitor</dt>
                <dd className="mt-1 font-medium">{visitor.visitorName}</dd>
              </div>
              <div>
                <dt className="typo-muted">Phone</dt>
                <dd className="mt-1 font-medium">{visitor.visitorPhone}</dd>
              </div>
              <div>
                <dt className="typo-muted">Relationship</dt>
                <dd className="mt-1 font-medium">{VISITOR_RELATIONSHIP_LABELS[visitor.relationship]}</dd>
              </div>
              <div>
                <dt className="typo-muted">Purpose</dt>
                <dd className="mt-1 font-medium">{visitor.purpose}</dd>
              </div>
              <div>
                <dt className="typo-muted">Visit date</dt>
                <dd className="mt-1 font-medium">{formatShortDate(visitor.visitDate)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Expected entry</dt>
                <dd className="mt-1 font-medium">{formatTime(visitor.expectedEntryTime)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Expected exit</dt>
                <dd className="mt-1 font-medium">{formatTime(visitor.expectedExitTime)}</dd>
              </div>
              {!isTenant ? (
                <div>
                  <dt className="typo-muted">Host</dt>
                  <dd className="mt-1 font-medium">
                    {visitor.tenantName} · Room {visitor.roomNumber}
                  </dd>
                </div>
              ) : null}
              {visitor.status === VisitorStatus.REJECTED ? (
                <div className="sm:col-span-2">
                  <dt className="typo-muted">Rejection reason</dt>
                  <dd className="mt-1 font-medium">{visitor.rejectedReason ?? '—'}</dd>
                </div>
              ) : null}
              {visitor.checkedInAt ? (
                <div>
                  <dt className="typo-muted">Checked in at</dt>
                  <dd className="mt-1 font-medium">{formatDateTime(visitor.checkedInAt)}</dd>
                </div>
              ) : null}
              {visitor.checkedOutAt ? (
                <div>
                  <dt className="typo-muted">Checked out at</dt>
                  <dd className="mt-1 font-medium">{formatDateTime(visitor.checkedOutAt)}</dd>
                </div>
              ) : null}
              {!isTenant && visitor.notes ? (
                <div className="sm:col-span-2">
                  <dt className="typo-muted">Notes</dt>
                  <dd className="mt-1 font-medium">{visitor.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Timeline" />
              <VisitorTimeline visitor={visitor} />
            </Card>
            {showPass ? (
              <Card>
                <CardHeader title="Visit Pass" />
                <VisitorPass visitor={visitor} pass={pass} />
              </Card>
            ) : null}
          </div>
        </div>
      ) : null}

      <VisitorApprovalModal
        visitor={approveOpen ? visitor ?? null : null}
        saving={saving}
        onClose={() => setApproveOpen(false)}
        onConfirm={async () => {
          if (!visitor || !actor) return;
          setSaving(true);
          try {
            await visitorService.approveVisitor(visitor.id, actor);
            toast('success', 'Visitor approved successfully.');
            setApproveOpen(false);
            reload();
            reloadPass();
          } catch (cause) {
            toast('error', 'Unable to approve', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <VisitorRejectModal
        visitor={rejectOpen ? visitor ?? null : null}
        reason={rejectReason}
        error={rejectError}
        saving={saving}
        onReasonChange={(value) => {
          setRejectReason(value);
          setRejectError('');
        }}
        onClose={() => setRejectOpen(false)}
        onConfirm={async () => {
          if (!visitor || !actor) return;
          if (!rejectReason.trim()) {
            setRejectError('A reason is required.');
            return;
          }
          setSaving(true);
          try {
            await visitorService.rejectVisitor(visitor.id, rejectReason, actor);
            toast('success', 'Visitor rejected');
            setRejectOpen(false);
            reload();
          } catch (cause) {
            toast('error', 'Unable to reject', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <Modal
        open={cancelOpen}
        title="Cancel Request"
        onClose={() => setCancelOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Request
            </Button>
            <Button
              variant="danger"
              disabled={saving}
              onClick={async () => {
                if (!visitor) return;
                setSaving(true);
                try {
                  await visitorService.cancelVisitor(visitor.id, isTenant ? user?.id : undefined);
                  toast('success', 'Visitor request cancelled');
                  setCancelOpen(false);
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
        <p className="text-sm text-muted">Cancel this visitor request? The pass cannot be used after cancellation.</p>
      </Modal>
    </div>
  );
}
