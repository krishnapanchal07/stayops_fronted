import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Payment } from '@/types/finance';
import { formatINR } from '@/utils/format';
import { useState } from 'react';

interface RefundPaymentModalProps {
  open: boolean;
  payment: Payment | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

export function RefundPaymentModal({ open, payment, submitting, onClose, onSubmit }: RefundPaymentModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!reason.trim()) {
      setError('A refund reason is required.');
      return;
    }
    await onSubmit(reason.trim());
  };

  return (
    <Modal
      key={payment?.id ?? 'refund-closed'}
      open={open}
      title="Record completed refund"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void submit()} disabled={submitting || !payment}>
            {submitting ? 'Saving…' : `Record refund ${payment ? formatINR(payment.amount) : ''}`}
          </Button>
        </>
      }
    >
      {payment ? (
        <div className="space-y-4">
          <p className="text-sm text-text">
            Record an already completed refund of {formatINR(payment.amount)} for {payment.paymentNumber}. The invoice outstanding will increase
            accordingly.
          </p>
          <Textarea
            label="Reason"
            name="reason"
            required
            rows={3}
            value={reason}
            error={error}
            onChange={(event) => {
              setReason(event.target.value);
              setError('');
            }}
          />
        </div>
      ) : null}
    </Modal>
  );
}
