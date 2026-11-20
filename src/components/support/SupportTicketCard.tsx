import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { SUPPORT_CATEGORY_LABELS, SUPPORT_STATUS_LABELS, type SupportRequest } from '@/types/support';
import { formatDateTime } from '@/utils/format';
import { Link } from 'react-router-dom';

interface SupportTicketCardProps {
  request: SupportRequest;
  href: string;
}

export function SupportTicketCard({ request, href }: SupportTicketCardProps) {
  return (
    <Link to={href} className="block">
      <Card className="hover:border-primary">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="typo-helper">{request.supportCode}</p>
            <p className="mt-1 font-semibold text-text">{request.subject}</p>
            <p className="typo-helper mt-1">{SUPPORT_CATEGORY_LABELS[request.category]}</p>
          </div>
          <StatusPill value={SUPPORT_STATUS_LABELS[request.status]} />
        </div>
        <p className="typo-helper mt-3">Updated {formatDateTime(request.updatedAt)}</p>
      </Card>
    </Link>
  );
}
