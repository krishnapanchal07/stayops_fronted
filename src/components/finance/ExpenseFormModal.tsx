import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  ExpenseCategory,
  ExpenseStatus,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  type ExpenseFormValues,
} from '@/types/finance';
interface PropertyOption {
  id: string;
  name: string;
}
import { emptyExpenseForm, validateExpenseForm, type ExpenseFormErrors } from '@/utils/financeValidation';
import { useState } from 'react';

interface ExpenseFormModalProps {
  open: boolean;
  properties: PropertyOption[];
  submitting: boolean;
  initial?: ExpenseFormValues;
  title?: string;
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues) => Promise<void>;
}

export function ExpenseFormModal({
  open,
  properties,
  submitting,
  initial,
  title = 'Add Expense',
  onClose,
  onSubmit,
}: ExpenseFormModalProps) {
  const [values, setValues] = useState<ExpenseFormValues>(initial ?? emptyExpenseForm());
  const [errors, setErrors] = useState<ExpenseFormErrors>({});

  const submit = async () => {
    const nextErrors = validateExpenseForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(values);
  };

  return (
    <Modal
      key={initial?.description ?? 'expense-create'}
      open={open}
      title={title}
      onClose={onClose}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'Saving…' : title}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Property"
          name="propertyId"
          required
          value={values.propertyId}
          error={errors.propertyId}
          options={[
            { value: '', label: 'Select property' },
            ...properties.map((property) => ({ value: property.id, label: property.name })),
          ]}
          onChange={(event) => setValues((current) => ({ ...current, propertyId: event.target.value }))}
        />
        <Select
          label="Category"
          name="category"
          required
          value={values.category}
          error={errors.category}
          options={Object.values(ExpenseCategory).map((category) => ({
            value: category,
            label: EXPENSE_CATEGORY_LABELS[category],
          }))}
          onChange={(event) => setValues((current) => ({ ...current, category: event.target.value as ExpenseCategory }))}
        />
        <TextInput
          label="Description"
          name="description"
          required
          value={values.description}
          error={errors.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Amount"
            name="amount"
            type="number"
            required
            min={1}
            value={values.amount || ''}
            error={errors.amount}
            onChange={(event) => setValues((current) => ({ ...current, amount: Number(event.target.value) }))}
          />
          <DateInput
            label="Expense date"
            name="expenseDate"
            required
            value={values.expenseDate}
            error={errors.expenseDate}
            onChange={(event) => setValues((current) => ({ ...current, expenseDate: event.target.value }))}
          />
        </div>
        <TextInput
          label="Vendor"
          name="vendor"
          value={values.vendor}
          onChange={(event) => setValues((current) => ({ ...current, vendor: event.target.value }))}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Payment method"
            name="paymentMethod"
            value={values.paymentMethod}
            options={Object.values(PaymentMethod).map((method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }))}
            onChange={(event) =>
              setValues((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod }))
            }
          />
          <Select
            label="Status"
            name="status"
            value={values.status}
            options={Object.values(ExpenseStatus).map((status) => ({ value: status, label: EXPENSE_STATUS_LABELS[status] }))}
            onChange={(event) => setValues((current) => ({ ...current, status: event.target.value as ExpenseStatus }))}
          />
        </div>
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
