import { StatusPill } from '@/components/dashboard/StatusPill';
import { LEAVE_STATUS_LABELS, type LeaveStatus } from '@/types/leave';

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  overdue?: boolean;
}

export function LeaveStatusBadge({ status, overdue }: LeaveStatusBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <StatusPill value={LEAVE_STATUS_LABELS[status]} />
      {overdue ? <StatusPill value="Overdue Return" /> : null}
    </div>
  );
}
