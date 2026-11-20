import { Card } from '@/components/common/Card';
import { NoticePriorityBadge } from '@/components/notices/NoticePriorityBadge';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { NOTICE_CATEGORY_LABELS, NOTICE_STATUS_LABELS, type NoticeWithRead } from '@/types/notice';
import { formatShortDate } from '@/utils/format';
import { Link } from 'react-router-dom';

interface NoticeCardProps {
  notice: NoticeWithRead;
  href: string;
}

export function NoticeCard({ notice, href }: NoticeCardProps) {
  return (
    <Link to={href} className="block">
      <Card className="hover:border-primary">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-text">{notice.title}</p>
            <p className="typo-helper mt-1">
              {notice.propertyName} · {NOTICE_CATEGORY_LABELS[notice.category]}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <NoticePriorityBadge priority={notice.priority} />
            <StatusPill value={notice.isRead ? 'Read' : 'Unread'} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
          <span>Published {formatShortDate(notice.publishDate)}</span>
          <span>Expires {formatShortDate(notice.expiryDate)}</span>
          <span>{NOTICE_STATUS_LABELS[notice.status]}</span>
        </div>
      </Card>
    </Link>
  );
}
