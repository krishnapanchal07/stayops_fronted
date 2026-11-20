import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LEAVE_TYPE_LABELS, type LeaveRequest } from '@/types/leave';

interface LeaveApprovalModalProps {
  leave: LeaveRequest | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveApprovalModal({ leave, saving, onClose, onConfirm }: LeaveApprovalModalProps) {
  return (
    <Modal
      open={Boolean(leave)}
      title="Approve Leave"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={onConfirm}>
            Approve
          </Button>
        </>
      }
    >
      {leave ? (
        <p className="text-sm text-muted">
          Approve {LEAVE_TYPE_LABELS[leave.leaveType].toLowerCase()} leave for {leave.tenantName}? A gate pass will be
          generated.
        </p>
      ) : null}
    </Modal>
  );
}
