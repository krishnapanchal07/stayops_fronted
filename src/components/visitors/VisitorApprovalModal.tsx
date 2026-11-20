import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Visitor } from '@/types/visitor';

interface VisitorApprovalModalProps {
  visitor: Visitor | null;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function VisitorApprovalModal({ visitor, saving, onClose, onConfirm }: VisitorApprovalModalProps) {
  return (
    <Modal
      open={Boolean(visitor)}
      title="Approve Visitor"
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
      {visitor ? (
        <p className="text-sm text-muted">
          Approve {visitor.visitorName} to visit {visitor.tenantName} on {visitor.visitDate}? A visitor pass will be
          generated.
        </p>
      ) : null}
    </Modal>
  );
}
