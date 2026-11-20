import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Checkbox } from '@/components/forms/Checkbox';
import type { Inquiry } from '@/types/inquiry';
import { formatINR } from '@/utils/format';
import { useState } from 'react';

interface ConvertInquiryModalProps {
  open: boolean;
  inquiry: Inquiry | null;
  bedAvailable: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (allocateBed: boolean) => Promise<void>;
}

export function ConvertInquiryModal({
  open,
  inquiry,
  bedAvailable,
  submitting = false,
  onClose,
  onSubmit,
}: ConvertInquiryModalProps) {
  const [allocateBed, setAllocateBed] = useState(false);
  const canAllocate = Boolean(inquiry?.bedId) && bedAvailable;

  return (
    <Modal
      open={open}
      title={inquiry ? `Convert · ${inquiry.fullName}` : 'Convert to tenant'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => inquiry && onSubmit(canAllocate && allocateBed)} disabled={submitting || !inquiry}>
            {submitting ? 'Converting…' : 'Create Tenant'}
          </Button>
        </>
      }
    >
      {inquiry ? (
        <div className="space-y-4">
          <p className="typo-secondary">
            This creates a new onboarding tenant from the inquiry. The inquiry stays a separate record and is marked
            Converted.
          </p>
          <div className="rounded-xl bg-background px-4 py-3 text-sm">
            <p className="font-semibold text-text">{inquiry.listingTitle}</p>
            <p className="typo-secondary mt-1">
              {inquiry.propertyName} · {formatINR(inquiry.monthlyRent)} /month
            </p>
            <p className="typo-secondary mt-1">{inquiry.email}</p>
          </div>
          {canAllocate ? (
            <Checkbox
              label={`Assign ${inquiry.listingTitle} now`}
              name="allocateBed"
              checked={allocateBed}
              onChange={(event) => setAllocateBed(event.target.checked)}
            />
          ) : inquiry.bedId ? (
            <p className="typo-secondary">
              The requested bed is no longer available. You can still convert and allocate a bed later from Tenant
              Management.
            </p>
          ) : (
            <p className="typo-secondary">No specific bed was requested. Allocate a bed later from Tenant Management.</p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
