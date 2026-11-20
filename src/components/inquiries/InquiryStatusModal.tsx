import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { INQUIRY_STATUS_LABELS, InquiryStatus, type Inquiry } from '@/types/inquiry';
import { allowedInquiryTransitions } from '@/utils/inquiryStats';
import { useState } from 'react';

interface InquiryStatusModalProps {
  open: boolean;
  inquiry: Inquiry | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (status: InquiryStatus, note?: string) => Promise<void>;
}

export function InquiryStatusModal({
  open,
  inquiry,
  submitting = false,
  onClose,
  onSubmit,
}: InquiryStatusModalProps) {
  const options = inquiry
    ? allowedInquiryTransitions(inquiry.status).map((value) => ({
        value,
        label: INQUIRY_STATUS_LABELS[value],
      }))
    : [];
  const [status, setStatus] = useState<InquiryStatus>(options[0]?.value ?? InquiryStatus.CONTACTED);
  const [note, setNote] = useState('');

  const needsConfirm = status === InquiryStatus.REJECTED || status === InquiryStatus.WITHDRAWN;

  return (
    <Modal
      open={open}
      title={inquiry ? `Change status · ${inquiry.fullName}` : 'Change status'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={needsConfirm ? 'danger' : 'primary'}
            onClick={() => inquiry && onSubmit(status, note.trim() || undefined)}
            disabled={submitting || !inquiry || options.length === 0}
          >
            {submitting ? 'Updating…' : 'Update Status'}
          </Button>
        </>
      }
    >
      {options.length === 0 ? (
        <p className="typo-secondary">This inquiry is closed and cannot change status.</p>
      ) : (
        <div className="space-y-4">
          <p className="typo-secondary">
            Current status is {inquiry ? INQUIRY_STATUS_LABELS[inquiry.status] : '—'}. Move it forward, reject, or
            withdraw. Conversion happens from the Convert action after approval.
          </p>
          <Select
            label="Next status"
            name="inquiryStatus"
            value={status}
            options={options}
            onChange={(event) => setStatus(event.target.value as InquiryStatus)}
          />
          <Textarea
            label="Note"
            name="statusNote"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            helperText="Optional note stored on the inquiry history."
          />
        </div>
      )}
    </Modal>
  );
}
