import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { validateEscalation } from '@/utils/complaintValidation';
import { useState } from 'react';

interface EscalateComplaintModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function EscalateComplaintModal({ open, submitting, onClose, onSubmit }: EscalateComplaintModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal
      open={open}
      title="Escalate Complaint"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              const nextError = validateEscalation(reason);
              setError(nextError);
              if (nextError) return;
              onSubmit(reason);
            }}
          >
            {submitting ? 'Escalating…' : 'Escalate'}
          </Button>
        </>
      }
    >
      <Textarea
        label="Reason"
        name="reason"
        required
        error={error ?? undefined}
        value={reason}
        placeholder="Why does this need escalation?"
        onChange={(event) => setReason(event.target.value)}
      />
    </Modal>
  );
}
