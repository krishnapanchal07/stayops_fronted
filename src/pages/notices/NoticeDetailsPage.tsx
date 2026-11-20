import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { NoticePriorityBadge } from '@/components/notices/NoticePriorityBadge';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { noticeService } from '@/services/notice/noticeService';
import { NOTICE_CATEGORY_LABELS, NOTICE_STATUS_LABELS, NoticeStatus } from '@/types/notice';
import { canTransitionNoticeStatus } from '@/utils/noticeRules';
import { formatShortDate } from '@/utils/format';
import { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export function NoticeDetailsPage() {
  const { noticeId = '' } = useParams();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canPublish = useHasPermission(Permission.NOTICE_PUBLISH) && !isTenant;
  const propertyIds = isWarden ? user?.propertyIds : undefined;
  const listHref = isTenant ? PATHS.tenant.notices : isWarden ? PATHS.warden.notices : PATHS.admin.notices;

  const loader = useCallback(async () => {
    if (isTenant && user) {
      const notices = await noticeService.getTenantNotices(user.id);
      const found = notices.find((item) => item.id === noticeId);
      if (!found) throw new Error('Notice not found.');
      return found;
    }
    return noticeService.getNoticeById(noticeId, propertyIds);
  }, [isTenant, noticeId, propertyIds, user]);

  const { data: notice, status, error, reload } = useAsyncResource(loader);
  const [saving, setSaving] = useState(false);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true);
    try {
      await action();
      toast('success', success);
      reload();
    } catch (cause) {
      toast('error', 'Unable to update notice.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={notice?.title ?? 'Notice'}
        description={notice ? NOTICE_CATEGORY_LABELS[notice.category] : 'Notice details'}
        showBack
        breadcrumbs={[
          { label: 'Home', href: isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard },
          { label: 'Notices', href: listHref },
          { label: notice?.noticeCode ?? 'Details' },
        ]}
        actions={
          isTenant && notice && 'isRead' in notice && !notice.isRead && user ? (
            <Button
              disabled={saving}
              onClick={() => void run(() => noticeService.markNoticeRead(user.id, notice.id), 'Notice marked as read.')}
            >
              Mark as Read
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Unable to load notices." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && notice ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Announcement" />
            <div className="flex flex-wrap gap-2">
              <NoticePriorityBadge priority={notice.priority} />
              <StatusPill value={NOTICE_STATUS_LABELS[notice.status]} />
              {'isRead' in notice ? <StatusPill value={notice.isRead ? 'Read' : 'Unread'} /> : null}
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-text">{notice.description}</p>
            {notice.attachmentName ? (
              <p className="typo-helper mt-4">Attachment: {notice.attachmentName}</p>
            ) : null}
          </Card>
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="typo-muted">Published</dt>
                <dd className="mt-1 font-medium">{formatShortDate(notice.publishDate)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Expiry</dt>
                <dd className="mt-1 font-medium">{formatShortDate(notice.expiryDate)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Property</dt>
                <dd className="mt-1 font-medium">{notice.propertyName}</dd>
              </div>
            </dl>
            {canPublish ? (
              <div className="mt-5 flex flex-col gap-2">
                {canTransitionNoticeStatus(notice.status, NoticeStatus.PUBLISHED) ? (
                  <Button disabled={saving} onClick={() => void run(() => noticeService.publishNotice(notice.id, propertyIds), 'Notice published.')}>
                    Publish
                  </Button>
                ) : null}
                {canTransitionNoticeStatus(notice.status, NoticeStatus.EXPIRED) ? (
                  <Button variant="outline" disabled={saving} onClick={() => void run(() => noticeService.expireNotice(notice.id, propertyIds), 'Notice expired.')}>
                    Expire
                  </Button>
                ) : null}
                {canTransitionNoticeStatus(notice.status, NoticeStatus.ARCHIVED) ? (
                  <Button variant="outline" disabled={saving} onClick={() => void run(() => noticeService.archiveNotice(notice.id, propertyIds), 'Notice archived.')}>
                    Archive
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
