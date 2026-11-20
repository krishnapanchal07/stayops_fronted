import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { COMPLAINT_STATUS_LABELS, type Complaint, type ComplaintStatus } from '@/types/complaint';
import { allowedComplaintTransitions } from '@/utils/complaintRules';
import { useState } from 'react';

interface ChangeComplaintStatusModalProps {
  open: boolean;
  complaint: Complaint | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (status: ComplaintStatus) => void;
}

export function ChangeComplaintStatusModal({
  open,
  complaint,
  submitting,
  onClose,
  onSubmit,
}: ChangeComplaintStatusModalProps) {
  const options = complaint ? allowedComplaintTransitions(complaint.status) : [];
  const [status, setStatus] = useState<ComplaintStatus | ''>(options[0] ?? '');

  return (
    <Modal
      open={open}
      title="Change Status"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting || !status}
            onClick={() => {
              if (!status) return;
              onSubmit(status);
            }}
          >
            {submitting ? 'Updating…' : 'Update Status'}
          </Button>
        </>
      }
    >
      {complaint && options.length > 0 ? (
        <Select
          label="Next Status"
          name="status"
          value={status}
          options={options.map((value) => ({ value, label: COMPLAINT_STATUS_LABELS[value] }))}
          onChange={(event) => setStatus(event.target.value as ComplaintStatus)}
        />
      ) : (
        <p className="typo-secondary">No further status changes are allowed from the current state.</p>
      )}
    </Modal>
  );
}
