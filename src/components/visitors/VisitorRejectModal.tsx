import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Visitor } from '@/types/visitor';

interface VisitorRejectModalProps {
  visitor: Visitor | null;
  reason: string;
  error?: string;
  saving: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function VisitorRejectModal({
  visitor,
  reason,
  error,
  saving,
  onReasonChange,
  onClose,
  onConfirm,
}: VisitorRejectModalProps) {
  return (
    <Modal
      open={Boolean(visitor)}
      title="Reject Visitor"
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
      {visitor ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Reject {visitor.visitorName} for {visitor.tenantName}? The tenant will see this reason.
          </p>
          <Textarea
            label="Reason"
            name="rejectReason"
            required
            error={error}
            value={reason}
            placeholder="Explain why this visit cannot be approved"
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </div>
      ) : null}
    </Modal>
  );
}
