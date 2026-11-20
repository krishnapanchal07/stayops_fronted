import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Select } from '@/components/forms/Select';
import { SupportTimeline } from '@/components/support/SupportTimeline';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { supportService } from '@/services/support/supportService';
import { SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS, SupportStatus } from '@/types/support';
import { formatDateTime } from '@/utils/format';
import { canCommentOnSupport, canTransitionSupportStatus } from '@/utils/supportRules';
import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export function SupportDetailsPage() {
  const { requestId = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canUpdate = useHasPermission(Permission.SUPPORT_UPDATE) && !isTenant;
  const canClose = useHasPermission(Permission.SUPPORT_CLOSE) && !isTenant;
  const canAssign = useHasPermission(Permission.SUPPORT_ASSIGN) && !isTenant;
  const propertyIds = isWarden ? user?.propertyIds : undefined;
  const listHref = isTenant ? PATHS.tenant.helpRequests : isWarden ? PATHS.warden.support : PATHS.admin.support;

  const loader = useCallback(async () => {
    const request = await supportService.getSupportRequestById(requestId, {
      tenantId: isTenant ? user?.id : undefined,
      propertyIds,
    });
    const comments = await supportService.getSupportComments(request.id);
    return { request, comments };
  }, [isTenant, propertyIds, requestId, user?.id]);

  const { data, status, error, reload } = useAsyncResource(loader);
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const changeStatus = async (next: SupportStatus) => {
    if (!data) return;
    setSaving(true);
    try {
      await supportService.changeSupportStatus(data.request.id, next, propertyIds);
      toast('success', 'Support request updated.');
      reload();
    } catch (cause) {
      toast('error', 'Unable to update request.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  const assignToSelf = async () => {
    if (!data || !user) return;
    setSaving(true);
    try {
      await supportService.updateSupportRequest(data.request.id, { assignedTo: user.id, assignedToName: user.name }, propertyIds);
      toast('success', 'Support request updated.');
      reload();
    } catch (cause) {
      toast('error', 'Unable to assign request.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={data?.request.subject ?? 'Support request'}
        description={data ? data.request.supportCode : 'Request details'}
        showBack
        breadcrumbs={[
          { label: 'Home', href: isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard },
          ...(isTenant ? [{ label: 'Help & Support', href: PATHS.tenant.help }] : []),
          { label: isTenant ? 'Support Requests' : 'Support', href: listHref },
          { label: data?.request.supportCode ?? 'Details' },
        ]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? undefined} onRetry={reload} /> : null}

      {status === 'success' && data ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader title="Description" />
              <p className="whitespace-pre-wrap text-sm leading-6 text-text">{data.request.description}</p>
            </Card>
            <Card>
              <CardHeader title="Timeline" />
              <SupportTimeline
                comments={data.comments}
                canComment={Boolean(user) && canCommentOnSupport(data.request.status)}
                submitting={commenting}
                onSubmit={(message) => {
                  if (!user) return;
                  setCommenting(true);
                  void supportService
                    .addSupportComment(
                      data.request.id,
                      { authorId: user.id, authorName: user.name, authorRole: user.role, message },
                      { tenantId: isTenant ? user.id : undefined, propertyIds },
                    )
                    .then(() => {
                      toast('success', 'Comment added.');
                      reload();
                    })
                    .catch((cause: unknown) => {
                      toast('error', 'Unable to add comment.', cause instanceof Error ? cause.message : undefined);
                    })
                    .finally(() => setCommenting(false));
                }}
              />
            </Card>
          </div>
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="typo-muted">Status</dt>
                <dd className="mt-1">
                  <StatusPill value={SUPPORT_STATUS_LABELS[data.request.status]} />
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Category</dt>
                <dd className="mt-1 font-medium">{SUPPORT_CATEGORY_LABELS[data.request.category]}</dd>
              </div>
              <div>
                <dt className="typo-muted">Tenant</dt>
                <dd className="mt-1 font-medium">{data.request.tenantName}</dd>
              </div>
              <div>
                <dt className="typo-muted">Assigned to</dt>
                <dd className="mt-1 font-medium">{data.request.assignedToName ?? 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="typo-muted">Created</dt>
                <dd className="mt-1 font-medium">{formatDateTime(data.request.createdAt)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Updated</dt>
                <dd className="mt-1 font-medium">{formatDateTime(data.request.updatedAt)}</dd>
              </div>
            </dl>
            {!isTenant ? (
              <div className="mt-5 space-y-3">
                {canAssign ? (
                  <Button variant="outline" disabled={saving} onClick={() => void assignToSelf()}>
                    Assign to me
                  </Button>
                ) : null}
                {canUpdate ? (
                  <Select
                    label="Change status"
                    name="status"
                    value=""
                    placeholder="Select status"
                    options={Object.values(SupportStatus)
                      .filter((value) => canTransitionSupportStatus(data.request.status, value) && (value !== SupportStatus.CLOSED || canClose))
                      .map((value) => ({ value, label: SUPPORT_STATUS_LABELS[value] }))}
                    onChange={(event) => {
                      const next = event.target.value as SupportStatus;
                      if (next) void changeStatus(next);
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
