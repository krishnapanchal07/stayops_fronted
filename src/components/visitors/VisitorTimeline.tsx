import { VisitorStatus, type Visitor } from '@/types/visitor';
import { formatDateTime } from '@/utils/format';

interface VisitorTimelineProps {
  visitor: Visitor;
}

export function VisitorTimeline({ visitor }: VisitorTimelineProps) {
  const steps = [
    { id: 'submitted', label: 'Submitted', at: visitor.createdAt, done: true },
    { id: 'approved', label: 'Approved', at: visitor.approvedAt, done: Boolean(visitor.approvedAt) && visitor.status !== VisitorStatus.REJECTED },
    { id: 'rejected', label: 'Rejected', at: visitor.approvedAt, done: visitor.status === VisitorStatus.REJECTED },
    { id: 'checked-in', label: 'Checked in', at: visitor.checkedInAt, done: Boolean(visitor.checkedInAt) },
    { id: 'checked-out', label: 'Checked out', at: visitor.checkedOutAt, done: Boolean(visitor.checkedOutAt) },
  ].filter((step) => step.done && (step.id !== 'rejected' || visitor.status === VisitorStatus.REJECTED));

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.id} className="border-l-2 border-primary pl-3">
          <p className="text-sm font-semibold text-text">{step.label}</p>
          <p className="typo-helper">{formatDateTime(step.at)}</p>
        </li>
      ))}
    </ol>
  );
}
