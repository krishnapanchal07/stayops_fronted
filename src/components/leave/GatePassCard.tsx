import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { GATE_PASS_STATUS_LABELS, type GatePass } from '@/types/leave';
import { formatDateTime } from '@/utils/format';

interface GatePassCardProps {
  pass: GatePass;
  exitAt?: string | null;
  overdue?: boolean;
}

export function GatePassCard({ pass, exitAt, overdue }: GatePassCardProps) {
  return (
    <Card>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">StayOps Gate Pass</p>
            <p className="mt-1 text-lg font-semibold text-text">{pass.passCode}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            <StatusPill value={GATE_PASS_STATUS_LABELS[pass.status]} />
            {overdue ? <StatusPill value="Overdue Return" /> : null}
          </div>
        </div>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Tenant</dt>
            <dd className="font-medium">{pass.tenantName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Room</dt>
            <dd className="font-medium">{pass.roomNumber}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Departure</dt>
            <dd className="font-medium">{formatDateTime(pass.startDateTime)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Expected return</dt>
            <dd className="font-medium">{formatDateTime(pass.expectedReturnDateTime)}</dd>
          </div>
          {exitAt ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Exited</dt>
              <dd className="font-medium">{formatDateTime(exitAt)}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </Card>
  );
}
