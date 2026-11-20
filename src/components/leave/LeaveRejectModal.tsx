import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { LeaveRequest } from '@/types/leave';

interface LeaveRejectModalProps {
  leave: LeaveRequest | null;
  reason: string;
  error?: string;
  saving: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveRejectModal({
  leave,
  reason,
  error,
  saving,
  onReasonChange,
  onClose,
  onConfirm,
}: LeaveRejectModalProps) {
  return (
    <Modal
      open={Boolean(leave)}
      title="Reject Leave"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" disabled={saving} onClick={onConfirm}>
            Reject
          </Button>
        </>
      }
    >
      {leave ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">Reject {leave.leaveCode} for {leave.tenantName}? The tenant will see this reason.</p>
          <Textarea
            label="Reason"
            name="leaveRejectReason"
            required
            error={error}
            value={reason}
            placeholder="Explain why this leave cannot be approved"
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
      ) : null}
    </Modal>
  );
}
