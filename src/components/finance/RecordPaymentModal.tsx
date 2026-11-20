import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InvoiceStatus, PAYMENT_METHOD_LABELS, PaymentMethod, type Invoice, type PaymentFormValues } from '@/types/finance';
import type { Tenant } from '@/types/tenant';
import { formatINR } from '@/utils/format';
import { emptyPaymentForm, validatePaymentForm, type PaymentFormErrors } from '@/utils/financeValidation';
import { useMemo, useState } from 'react';

interface RecordPaymentModalProps {
  open: boolean;
  tenants: Tenant[];
  invoices: Invoice[];
  submitting: boolean;
  presetTenantId?: string;
  presetInvoiceId?: string;
  onClose: () => void;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
}

export function RecordPaymentModal({
  open,
  tenants,
  invoices,
  submitting,
  presetTenantId = '',
  presetInvoiceId = '',
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const [values, setValues] = useState<PaymentFormValues>(() => ({
    ...emptyPaymentForm(),
    tenantId: presetTenantId,
    invoiceId: presetInvoiceId,
  }));
  const [errors, setErrors] = useState<PaymentFormErrors>({});

  const openInvoices = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.outstandingAmount > 0 &&
          !invoice.cancelled &&
          invoice.status !== InvoiceStatus.CANCELLED &&
          (!values.tenantId || invoice.tenantId === values.tenantId),
      ),
    [invoices, values.tenantId],
  );
  const selected = invoices.find((invoice) => invoice.id === values.invoiceId);

  const applyInvoice = (invoiceId: string) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    setValues((current) => ({
      ...current,
      invoiceId,
      tenantId: invoice?.tenantId ?? current.tenantId,
      amount: invoice?.outstandingAmount ?? 0,
    }));
  };

  const submit = async () => {
    const nextErrors = validatePaymentForm(values, selected?.outstandingAmount ?? 0);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(values);
  };

  return (
    <Modal
      key={`${presetTenantId}-${presetInvoiceId}-${open}`}
      open={open}
      title="Record Payment"
      onClose={onClose}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'Saving…' : 'Record payment'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Tenant"
          name="tenantId"
          required
          value={values.tenantId}
          error={errors.tenantId}
          options={[
            { value: '', label: 'Select tenant' },
            ...tenants.map((tenant) => ({ value: tenant.id, label: `${tenant.fullName} · ${tenant.tenantCode}` })),
          ]}
          onChange={(event) =>
            setValues((current) => ({ ...current, tenantId: event.target.value, invoiceId: '', amount: 0 }))
          }
        />
        <Select
          label="Invoice"
          name="invoiceId"
          required
          value={values.invoiceId}
          error={errors.invoiceId}
          options={[
            { value: '', label: values.tenantId ? 'Select open invoice' : 'Select a tenant first' },
            ...openInvoices.map((invoice) => ({
              value: invoice.id,
              label: `${invoice.invoiceNumber} · ${formatINR(invoice.outstandingAmount)} due`,
            })),
          ]}
          onChange={(event) => applyInvoice(event.target.value)}
        />
        {selected ? (
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-background p-3 text-sm">
            <div>
              <p className="typo-muted">Total</p>
              <p className="mt-1 font-semibold">{formatINR(selected.total)}</p>
            </div>
            <div>
              <p className="typo-muted">Paid</p>
              <p className="mt-1 font-semibold text-success">{formatINR(selected.paidAmount)}</p>
            </div>
            <div>
              <p className="typo-muted">Outstanding</p>
              <p className="mt-1 font-semibold text-danger">{formatINR(selected.outstandingAmount)}</p>
            </div>
          </div>
        ) : null}
        <TextInput
          label="Amount"
          name="amount"
          type="number"
          required
          min={1}
          max={selected?.outstandingAmount}
          value={values.amount || ''}
          error={errors.amount}
          onChange={(event) => setValues((current) => ({ ...current, amount: Number(event.target.value) }))}
        />
        <Select
          label="Payment method"
          name="method"
          value={values.method}
          options={Object.values(PaymentMethod).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }))}
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
          placeholder="TXN-849203"
          onChange={(event) => setValues((current) => ({ ...current, reference: event.target.value }))}
        />
        <Textarea
          label="Notes"
          name="notes"
          rows={3}
          value={values.notes}
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
        />
      </div>
    </Modal>
  );
}
