import { Card } from '@/components/common/Card';
import { VisitorStatusBadge } from '@/components/visitors/VisitorStatusBadge';
import { Button } from '@/components/ui/Button';
import { VISITOR_RELATIONSHIP_LABELS, type Visitor } from '@/types/visitor';
import { formatShortDate, formatTime } from '@/utils/format';

interface VisitorCardProps {
  visitor: Visitor;
  onView: () => void;
}

export function VisitorCard({ visitor, onView }: VisitorCardProps) {
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-text">{visitor.visitorName}</p>
            <p className="typo-helper mt-0.5">
              {visitor.visitorCode} · {VISITOR_RELATIONSHIP_LABELS[visitor.relationship]}
            </p>
          </div>
          <VisitorStatusBadge status={visitor.status} visitor={visitor} />
        </div>
        <p className="text-sm text-muted">
          {formatShortDate(visitor.visitDate)} · {formatTime(visitor.expectedEntryTime)} – {formatTime(visitor.expectedExitTime)}
        </p>
        <p className="text-sm text-text">{visitor.purpose}</p>
        <Button size="sm" variant="outline" onClick={onView}>
          View
        </Button>
      </div>
    </Card>
  );
}
