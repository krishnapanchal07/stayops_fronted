import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { AssignComplaintModal } from '@/components/complaints/AssignComplaintModal';
import { ChangeComplaintStatusModal } from '@/components/complaints/ChangeComplaintStatusModal';
import { ComplaintComments } from '@/components/complaints/ComplaintComments';
import { ComplaintTimeline } from '@/components/complaints/ComplaintTimeline';
import { EscalateComplaintModal } from '@/components/complaints/EscalateComplaintModal';
import { ResolveComplaintModal } from '@/components/complaints/ResolveComplaintModal';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS, adminMaintenanceTaskDetailPath } from '@/routes/paths';
import { complaintService } from '@/services/complaint/complaintService';
import { maintenanceService } from '@/services/maintenance/maintenanceService';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
  ComplaintStatus,
} from '@/types/complaint';
import {
  canAssignComplaint,
  canEscalateComplaint,
  canTenantComment,
  canTenantConfirmResolution,
  canTransitionComplaintStatus,
  isComplaintOverdue,
} from '@/utils/complaintRules';
import { formatDateTime, formatFileSize, formatINR } from '@/utils/format';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

function listPath(pathname: string): string {
  if (pathname.startsWith('/tenant')) return PATHS.tenant.complaints;
  if (pathname.startsWith('/warden')) return PATHS.warden.complaints;
  return PATHS.admin.complaints;
}

export function ComplaintDetailsPage() {
  const { complaintId = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canAssign = useHasPermission(Permission.COMPLAINT_ASSIGN) && !isTenant;
  const canUpdate = useHasPermission(Permission.COMPLAINT_UPDATE) && !isTenant;
  const canResolve = useHasPermission(Permission.COMPLAINT_RESOLVE) && !isTenant;
  const canViewCost = !isTenant;
  const listHref = listPath(location.pathname);

  const complaintLoader = useCallback(() => {
    return complaintService.getComplaintById(complaintId);
  }, [complaintId]);
  const commentsLoader = useCallback(
    () => complaintService.getComments(complaintId, !isTenant && canUpdate),
    [canUpdate, complaintId, isTenant],
  );
  const timelineLoader = useCallback(() => complaintService.getTimeline(complaintId), [complaintId]);
  const tasksLoader = useCallback(() => isTenant ? Promise.resolve([]) : maintenanceService.getTasksByComplaint(complaintId), [complaintId, isTenant]);

  const { data: complaint, status, error, reload } = useAsyncResource(complaintLoader);
  const { data: comments, reload: reloadComments } = useAsyncResource(commentsLoader);
  const { data: events, reload: reloadEvents } = useAsyncResource(timelineLoader);
  const { data: tasks, reload: reloadTasks } = useAsyncResource(tasksLoader);
  const propertyId = complaint?.propertyId;
  const staffLoader = useCallback(() => canAssign && propertyId ? complaintService.getMaintenanceStaff(propertyId) : Promise.resolve([]), [canAssign, propertyId]);
  const { data: staff } = useAsyncResource(staffLoader);

  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  const refresh = () => {
    reload();
    reloadComments();
    reloadEvents();
    reloadTasks();
  };

  const actor = user ? { id: user.id, name: user.name, role: user.role } : null;
  const publicComments = (comments ?? []).filter((item) => item.visibility === 'PUBLIC');
  const internalNotes = (comments ?? []).filter((item) => item.visibility === 'INTERNAL');
  const linkedTask = tasks?.[0];

  return (
    <div>
      <PageHeader
        title={complaint?.title ?? 'Complaint'}
        description={complaint ? `${complaint.complaintCode} · Room ${complaint.roomNumber}` : undefined}
        breadcrumbs={[{ label: isTenant ? 'My Complaints' : 'Complaints', href: listHref }, { label: 'Details' }]}
        showBack
        actions={
          complaint && actor ? (
            <div className="flex flex-wrap gap-2">
              {canUpdate && canTransitionComplaintStatus(complaint.status, ComplaintStatus.REVIEWED) ? (
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await complaintService.changeComplaintStatus(complaint.id, ComplaintStatus.REVIEWED, actor);
                      toast('success', 'Complaint reviewed', 'The complaint is marked as reviewed.');
                      refresh();
                    } catch (cause) {
                      toast('error', 'Unable to update', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Mark Reviewed
                </Button>
              ) : null}
              {canAssign && canAssignComplaint(complaint.status) ? (
                <Button variant="outline" onClick={() => setAssignOpen(true)}>
                  Assign
                </Button>
              ) : null}
              {canUpdate ? (
                <Button variant="outline" onClick={() => setStatusOpen(true)}>
                  Change Status
                </Button>
              ) : null}
              {canUpdate && canEscalateComplaint(complaint.status) ? (
                <Button variant="outline" onClick={() => setEscalateOpen(true)}>
                  Escalate
                </Button>
              ) : null}
              {canResolve && canTransitionComplaintStatus(complaint.status, ComplaintStatus.RESOLVED) ? (
                <Button onClick={() => setResolveOpen(true)}>Resolve</Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load this complaint.'} onRetry={reload} />
      ) : null}

      {status === 'success' && complaint && isWarden && user?.propertyIds?.length && !user.propertyIds.includes(complaint.propertyId) ? (
        <ErrorState description="You can only view complaints for properties you manage." />
      ) : null}

      {status === 'success' && complaint && actor && !(isWarden && user?.propertyIds?.length && !user.propertyIds.includes(complaint.propertyId)) ? (
        <div className="space-y-5">
          {isTenant && canTenantConfirmResolution(complaint.status) ? (
            <Card className="border-primary/30 bg-primary-soft">
              <p className="font-semibold text-text">Issue marked as resolved.</p>
              <p className="typo-secondary mt-1">Was the issue fixed?</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await complaintService.closeComplaint(complaint.id, actor);
                      toast('success', 'Complaint closed', 'Thanks for confirming the fix.');
                      refresh();
                    } catch (cause) {
                      toast('error', 'Unable to close', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Yes, Close Complaint
                </Button>
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await complaintService.reopenComplaint(complaint.id, actor);
                      toast('info', 'Complaint reopened', 'The team will continue work on this issue.');
                      refresh();
                    } catch (cause) {
                      toast('error', 'Unable to reopen', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Not Fixed
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Complaint Details" />
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="typo-muted">Complaint ID</dt>
                  <dd className="mt-1 font-medium">{complaint.complaintCode}</dd>
                </div>
                <div>
                  <dt className="typo-muted">Category</dt>
                  <dd className="mt-1">{COMPLAINT_CATEGORY_LABELS[complaint.category]}</dd>
                </div>
                <div>
                  <dt className="typo-muted">Priority</dt>
                  <dd className="mt-1">
                    <StatusPill value={COMPLAINT_PRIORITY_LABELS[complaint.priority]} />
                  </dd>
                </div>
                <div>
                  <dt className="typo-muted">Status</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    <StatusPill value={COMPLAINT_STATUS_LABELS[complaint.status]} />
                    {isComplaintOverdue(complaint) ? <StatusPill value="Overdue" /> : null}
                  </dd>
                </div>
                {!isTenant ? (
                  <>
                    <div>
                      <dt className="typo-muted">Tenant</dt>
                      <dd className="mt-1">{complaint.tenantName}</dd>
                    </div>
                    <div>
                      <dt className="typo-muted">Property</dt>
                      <dd className="mt-1">{complaint.propertyName}</dd>
                    </div>
                  </>
                ) : null}
                <div>
                  <dt className="typo-muted">Room</dt>
                  <dd className="mt-1">{complaint.roomNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="typo-muted">Assigned To</dt>
                  <dd className="mt-1">{complaint.assignedToName ?? 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="typo-muted">Created</dt>
                  <dd className="mt-1">{formatDateTime(complaint.createdAt)}</dd>
                </div>
                <div>
                  <dt className="typo-muted">Due</dt>
                  <dd className="mt-1">{formatDateTime(complaint.dueAt)}</dd>
                </div>
                {canViewCost ? (
                  <>
                    <div>
                      <dt className="typo-muted">Estimated Cost</dt>
                      <dd className="mt-1">{complaint.estimatedCost != null ? formatINR(complaint.estimatedCost) : '—'}</dd>
                    </div>
                    <div>
                      <dt className="typo-muted">Actual Cost</dt>
                      <dd className="mt-1">{complaint.actualCost != null ? formatINR(complaint.actualCost) : '—'}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
              <p className="mt-4 text-sm text-text">{complaint.description}</p>
            </Card>

            <Card>
              <CardHeader title="Attachments" />
              {complaint.attachments.length === 0 ? (
                <p className="typo-secondary">No attachments.</p>
              ) : (
                <ul className="space-y-3">
                  {complaint.attachments.map((file) => (
                    <li key={file.id} className="flex items-center gap-3">

                      <div>
                        <p className="text-sm font-medium">{file.fileName}</p>
                        <p className="typo-helper">{formatFileSize(file.fileSize)}</p>
                        <Button size="sm" variant="ghost" onClick={() => {
                          void complaintService.getAttachment(complaint.id, file.id).then((blob) => {
                            setPreview({ url: URL.createObjectURL(blob), name: file.fileName });
                          }).catch(() => toast('error', 'Unable to load attachment.'));
                        }}>Preview</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          void complaintService.downloadAttachment(complaint.id, file.id, file.fileName)
                            .catch(() => toast('error', 'Unable to download attachment.'));
                        }}>Download</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {linkedTask ? (
                <div className="mt-5 rounded-xl bg-background p-3">
                  <p className="text-sm font-semibold">Maintenance Task</p>
                  <p className="typo-helper mt-1">
                    {linkedTask.taskCode} · {linkedTask.status.replace('_', ' ')}
                  </p>
                  {!isTenant && !isWarden ? (
                    <Link
                      to={adminMaintenanceTaskDetailPath(linkedTask.id)}
                      className="mt-2 inline-block text-sm font-medium text-primary"
                    >
                      View task
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </Card>
          </div>

          {complaint.resolutionNotes ? (
            <Card>
              <CardHeader title="Resolution" />
              <p className="text-sm text-text">{complaint.resolutionNotes}</p>
            </Card>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Timeline" />
              <ComplaintTimeline events={events ?? []} />
            </Card>
            <Card>
              <CardHeader title="Comments" />
              <ComplaintComments
                comments={publicComments}
                canComment={canTenantComment(complaint.status) && (isTenant || canUpdate)}
                submitting={commentSaving}
                onSubmit={async (message) => {
                  setCommentSaving(true);
                  try {
                    await complaintService.addComplaintComment(complaint.id, message, actor);
                    toast('success', 'Comment added');
                    refresh();
                    return true;
                  } catch (cause) {
                    toast('error', 'Unable to comment', cause instanceof Error ? cause.message : 'Please try again.');
                    return false;
                  } finally {
                    setCommentSaving(false);
                  }
                }}
              />
            </Card>
          </div>

          {!isTenant && canUpdate ? (
            <Card>
              <CardHeader title="Internal Notes" />
              <p className="typo-helper mb-3">Visible to staff only. Tenants cannot see these notes.</p>
              <ComplaintComments
                comments={internalNotes}
                canComment={canTenantComment(complaint.status)}
                submitting={noteSaving}
                placeholder="Add an internal note…"
                submitLabel="Add Internal Note"
                emptyLabel="No internal notes yet."
                onSubmit={async (message) => {
                  setNoteSaving(true);
                  try {
                    await complaintService.addInternalNote(complaint.id, message, actor);
                    toast('success', 'Internal note added', 'This note stays hidden from the tenant.');
                    refresh();
                    return true;
                  } catch (cause) {
                    toast('error', 'Unable to add note', cause instanceof Error ? cause.message : 'Please try again.');
                    return false;
                  } finally {
                    setNoteSaving(false);
                  }
                }}
              />
            </Card>
          ) : null}
        </div>
      ) : null}

      <Modal open={Boolean(preview)} title={preview?.name ?? 'Attachment'} onClose={() => setPreview(null)}>
        {preview ? <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-full object-contain" /> : null}
      </Modal>
      <AssignComplaintModal
        key={complaint ? `assign-${complaint.id}-${complaint.updatedAt}` : 'assign'}
        open={assignOpen}
        complaint={complaint}
        staff={staff ?? []}
        submitting={saving}
        onClose={() => setAssignOpen(false)}
        onSubmit={async (staffId, priority, dueAt, estimatedCost) => {
          if (!complaint || !actor) return;
          setSaving(true);
          try {
            await complaintService.assignComplaint(complaint.id, staffId, { priority, dueAt, estimatedCost, actor });
            toast('success', 'Complaint assigned', 'A maintenance task has been created.');
            setAssignOpen(false);
            refresh();
          } catch (cause) {
            toast('error', 'Unable to assign', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <ChangeComplaintStatusModal
        key={complaint ? `status-${complaint.id}-${complaint.status}` : 'status'}
        open={statusOpen}
        complaint={complaint}
        submitting={saving}
        onClose={() => setStatusOpen(false)}
        onSubmit={async (nextStatus) => {
          if (!complaint || !actor) return;
          setSaving(true);
          try {
            await complaintService.changeComplaintStatus(complaint.id, nextStatus, actor);
            toast('success', 'Status updated', `Complaint is now ${COMPLAINT_STATUS_LABELS[nextStatus]}.`);
            setStatusOpen(false);
            refresh();
          } catch (cause) {
            toast('error', 'Unable to update status', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <ResolveComplaintModal
        key={complaint ? `resolve-${complaint.id}` : 'resolve'}
        open={resolveOpen}
        submitting={saving}
        onClose={() => setResolveOpen(false)}
        onSubmit={async (resolution, actualCost) => {
          if (!complaint || !actor) return;
          setSaving(true);
          try {
            await complaintService.resolveComplaint(complaint.id, resolution, actor, actualCost);
            toast('success', 'Complaint resolved', 'The tenant can now confirm closure.');
            setResolveOpen(false);
            refresh();
          } catch (cause) {
            toast('error', 'Unable to resolve', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <EscalateComplaintModal
        key={complaint ? `escalate-${complaint.id}` : 'escalate'}
        open={escalateOpen}
        submitting={saving}
        onClose={() => setEscalateOpen(false)}
        onSubmit={async (reason) => {
          if (!complaint || !actor) return;
          setSaving(true);
          try {
            await complaintService.escalateComplaint(complaint.id, reason, actor);
            toast('success', 'Complaint escalated', 'The issue has been flagged for urgent attention.');
            setEscalateOpen(false);
            refresh();
          } catch (cause) {
            toast('error', 'Unable to escalate', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
