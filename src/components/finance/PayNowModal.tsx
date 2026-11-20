import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PAYMENT_METHOD_LABELS, PaymentMethod, type Invoice, type PaymentFormValues } from '@/types/finance';
import { formatINR } from '@/utils/format';
import { emptyPaymentForm, validatePaymentForm, type PaymentFormErrors } from '@/utils/financeValidation';
import { useState } from 'react';

const TENANT_METHODS = [PaymentMethod.UPI, PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER];

interface PayNowModalProps {
  open: boolean;
  invoice: Invoice | null;
  tenantId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

export function PayNowModal({ open, invoice, tenantId, submitting, onClose, onSubmit }: PayNowModalProps) {
  const [values, setValues] = useState<PaymentFormValues>(() => ({
    ...emptyPaymentForm(),
    tenantId,
    invoiceId: invoice?.id ?? '',
    amount: invoice?.outstandingAmount ?? 0,
  }));
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form');

  const outstanding = invoice?.outstandingAmount ?? 0;

  const submit = async () => {
    if (!invoice) return;
    const next = { ...values, tenantId, invoiceId: invoice.id };
    const nextErrors = validatePaymentForm(next, outstanding);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setPhase('processing');
    try {
      await onSubmit(next);
      setPhase('success');
    } catch {
      setPhase('form');
    }
  };

  return (
    <Modal
      key={invoice ? `${invoice.id}-${invoice.outstandingAmount}` : 'pay-closed'}
      open={open}
      title={phase === 'success' ? 'Payment successful' : 'Pay invoice'}
      onClose={onClose}
      className="max-w-md"
      footer={
        phase === 'success' ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={submitting || phase === 'processing'}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={submitting || phase === 'processing' || !invoice}>
              {phase === 'processing' ? 'Processing…' : `Pay ${formatINR(values.amount || 0)}`}
            </Button>
          </>
        )
      }
    >
      {!invoice ? null : phase === 'success' ? (
        <p className="text-sm text-text">
          Payment recorded successfully for {invoice.invoiceNumber}. This is a mock payment for Phase 2.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-background p-3 text-sm">
            <p className="font-semibold">{invoice.invoiceNumber}</p>
            <p className="typo-helper mt-1">Outstanding {formatINR(outstanding)}</p>
          </div>
          <TextInput
            label="Amount"
            name="amount"
            type="number"
            min={1}
            max={outstanding}
            value={values.amount || ''}
            error={errors.amount}
            onChange={(event) => setValues((current) => ({ ...current, amount: Number(event.target.value) }))}
          />
          <Select
            label="Payment method"
            name="method"
            value={values.method}
            options={TENANT_METHODS.map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }))}
            onChange={(event) => setValues((current) => ({ ...current, method: event.target.value as PaymentFormValues['method'] }))}
          />
          <DateInput
            label="Payment date"
            name="paymentDate"
            value={values.paymentDate}
            error={errors.paymentDate}
            onChange={(event) => setValues((current) => ({ ...current, paymentDate: event.target.value }))}
          />
          <TextInput
            label="Reference"
            name="reference"
            value={values.reference}
            placeholder="UPI-ABC1024"
            onChange={(event) => setValues((current) => ({ ...current, reference: event.target.value }))}
          />
        </div>
      )}
    </Modal>
  );
}
