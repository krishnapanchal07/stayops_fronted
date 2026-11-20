import { StatusPill } from '@/components/dashboard/StatusPill';
import { VISITOR_STATUS_LABELS, type Visitor, type VisitorStatus } from '@/types/visitor';
import { isVisitorOverstay } from '@/utils/visitorRules';

interface VisitorStatusBadgeProps {
  status: VisitorStatus;
  visitor?: Visitor;
}

export function VisitorStatusBadge({ status, visitor }: VisitorStatusBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      <StatusPill value={VISITOR_STATUS_LABELS[status]} />
      {visitor && isVisitorOverstay(visitor) ? <StatusPill value="Overstay" /> : null}
    </div>
  );
}
