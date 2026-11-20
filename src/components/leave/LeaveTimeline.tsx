import { LeaveStatus, type GatePass, type LeaveRequest } from '@/types/leave';
import { formatDateTime } from '@/utils/format';

interface LeaveTimelineProps {
  leave: LeaveRequest;
  gatePass?: GatePass | null;
  exitAt?: string | null;
  returnAt?: string | null;
}

export function LeaveTimeline({ leave, gatePass, exitAt, returnAt }: LeaveTimelineProps) {
  const steps = [
    { id: 'submitted', label: 'Submitted', at: leave.createdAt, done: true },
    {
      id: 'approved',
      label: 'Approved',
      at: leave.approvedAt,
      done: Boolean(leave.approvedAt) && leave.status !== LeaveStatus.REJECTED,
    },
    { id: 'rejected', label: 'Rejected', at: leave.approvedAt, done: leave.status === LeaveStatus.REJECTED },
    { id: 'pass', label: 'Gate pass', at: gatePass?.createdAt ?? null, done: Boolean(gatePass) },
    { id: 'exited', label: 'Exited', at: exitAt ?? null, done: Boolean(exitAt) },
    { id: 'returned', label: 'Returned', at: returnAt ?? null, done: Boolean(returnAt) },
    {
      id: 'completed',
      label: 'Completed',
      at: leave.status === LeaveStatus.COMPLETED ? leave.updatedAt : null,
      done: leave.status === LeaveStatus.COMPLETED,
    },
  ].filter((step) => step.done && (step.id !== 'rejected' || leave.status === LeaveStatus.REJECTED));

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li key={step.id} className="border-l-2 border-primary pl-3">
          <p className="text-sm font-semibold text-text">{step.label}</p>
          <p className="typo-helper">{step.at ? formatDateTime(step.at) : '—'}</p>
        </li>
      ))}
    </ol>
  );
}
