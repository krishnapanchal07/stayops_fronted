import { StatusPill } from '@/components/dashboard/StatusPill';
import { Button } from '@/components/ui/Button';
import { BED_STATUS_LABELS, BedStatus, type Bed } from '@/types/room';
import { formatINR, formatShortDate } from '@/utils/format';

interface BedCardProps {
  bed: Bed;
  canAllocate: boolean;
  roomAllocatable: boolean;
  onAssign: () => void;
  onRelease: () => void;
  onViewTenant: () => void;
  onViewReservation: () => void;
  onCancelReservation: () => void;
  onViewMaintenance: () => void;
  onMarkAvailable: () => void;
  onViewReason: () => void;
  onUnblock: () => void;
}

export function BedCard({
  bed,
  canAllocate,
  roomAllocatable,
  onAssign,
  onRelease,
  onViewTenant,
  onViewReservation,
  onCancelReservation,
  onViewMaintenance,
  onMarkAvailable,
  onViewReason,
  onUnblock,
}: BedCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">{bed.label}</p>
          <p className="typo-helper">{formatINR(bed.rent)} / month</p>
        </div>
        <StatusPill value={BED_STATUS_LABELS[bed.status]} />
      </div>

      <div className="mt-4 flex-1 space-y-1 text-sm">
        {bed.status === BedStatus.OCCUPIED ? (
          <>
            <p className="font-medium text-text">{bed.tenantName}</p>
            <p className="typo-muted">Move-in: {formatShortDate(bed.moveInDate)}</p>
          </>
        ) : null}
        {bed.status === BedStatus.RESERVED ? (
          <>
            <p className="font-medium text-text">{bed.tenantName ?? 'Reserved'}</p>
            <p className="typo-muted">Expected: {formatShortDate(bed.moveInDate)}</p>
          </>
        ) : null}
        {bed.status === BedStatus.AVAILABLE ? <p className="typo-secondary">Ready for allocation.</p> : null}
        {bed.status === BedStatus.MAINTENANCE ? (
          <p className="typo-secondary">Unavailable while maintenance is in progress.</p>
        ) : null}
        {bed.status === BedStatus.BLOCKED ? <p className="typo-secondary">This bed is blocked.</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {bed.status === BedStatus.AVAILABLE && canAllocate ? (
          <Button size="sm" onClick={onAssign} disabled={!roomAllocatable}>
            Assign Bed
          </Button>
        ) : null}
        {bed.status === BedStatus.OCCUPIED ? (
          <>
            <Button size="sm" variant="outline" onClick={onViewTenant}>
              View Tenant
            </Button>
            {canAllocate ? (
              <Button size="sm" variant="danger" onClick={onRelease}>
                Release Bed
              </Button>
            ) : null}
          </>
        ) : null}
        {bed.status === BedStatus.RESERVED ? (
          <>
            <Button size="sm" variant="outline" onClick={onViewReservation}>
              View Reservation
            </Button>
            {canAllocate ? (
              <Button size="sm" variant="outline" onClick={onCancelReservation}>
                Cancel Reservation
              </Button>
            ) : null}
          </>
        ) : null}
        {bed.status === BedStatus.MAINTENANCE ? (
          <>
            <Button size="sm" variant="outline" onClick={onViewMaintenance}>
              View Maintenance
            </Button>
            {canAllocate ? (
              <Button size="sm" onClick={onMarkAvailable}>
                Mark Available
              </Button>
            ) : null}
          </>
        ) : null}
        {bed.status === BedStatus.BLOCKED ? (
          <>
            <Button size="sm" variant="outline" onClick={onViewReason}>
              View Reason
            </Button>
            {canAllocate ? (
              <Button size="sm" onClick={onUnblock}>
                Unblock
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </article>
  );
}
