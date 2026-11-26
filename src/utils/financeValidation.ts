import { financeToday } from '@/utils/financeCalc';
import { ChargeType, type ExpenseFilters, type ExpenseFormValues, type InvoiceFilters, type InvoiceFormValues, type PaymentFilters, type PaymentFormValues } from '@/types/finance';
import { formatINR } from '@/utils/format';

export type InvoiceFormErrors = Partial<Record<keyof InvoiceFormValues | 'itemsAmount', string>>;
export type PaymentFormErrors = Partial<Record<keyof PaymentFormValues, string>>;
export type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

export function emptyInvoiceForm(): InvoiceFormValues {
  const today = financeToday();
  return {
    tenantId: '',
    billingPeriod: today.slice(0, 7),
    issueDate: today,
    dueDate: today,
    items: [{ id: 'item-rent', type: ChargeType.RENT, description: 'Monthly rent', amount: 0 }],
    discount: 0,
    lateFee: 0,
  };
}

export function emptyPaymentForm(): PaymentFormValues {
  return {
    tenantId: '',
    invoiceId: '',
    amount: 0,
    method: 'UPI',
    paymentDate: financeToday(),
    reference: '',
    notes: '',
  };
}

export function emptyExpenseForm(): ExpenseFormValues {
  return {
    propertyId: '',
    category: 'MAINTENANCE',
    description: '',
    amount: 0,
    expenseDate: financeToday(),
    vendor: '',
    paymentMethod: 'BANK_TRANSFER',
    status: 'PAID',
    notes: '',
  };
}

export function validateInvoiceForm(values: InvoiceFormValues): InvoiceFormErrors {
  const errors: InvoiceFormErrors = {};
  if (!values.tenantId) errors.tenantId = 'Select a tenant.';
  if (!values.billingPeriod) errors.billingPeriod = 'Billing month is required.';
  if (!values.issueDate) errors.issueDate = 'Issue date is required.';
  if (!values.dueDate) errors.dueDate = 'Due date is required.';
  if (values.issueDate && values.dueDate && values.dueDate < values.issueDate) {
    errors.dueDate = 'Due date cannot be before the issue date.';
  }
  if (values.discount < 0) errors.discount = 'Discount cannot be negative.';
  if (values.lateFee < 0) errors.lateFee = 'Late fee cannot be negative.';
  if (values.items.length === 0) {
    errors.items = 'Add at least one invoice item.';
  } else if (values.items.some((item) => !item.description.trim() || item.amount <= 0)) {
    errors.itemsAmount = 'Each item needs a description and an amount greater than 0.';
  }
  const subtotal = values.items.reduce((sum, item) => sum + item.amount, 0);
  if (subtotal + values.lateFee - values.discount <= 0) {
    errors.itemsAmount = 'Invoice total must be greater than 0.';
  }
  return errors;
}

export function validatePaymentForm(values: PaymentFormValues, outstanding: number): PaymentFormErrors {
  const errors: PaymentFormErrors = {};
  if (!values.tenantId) errors.tenantId = 'Select a tenant.';
  if (!values.invoiceId) errors.invoiceId = 'Select an invoice.';
  if (!values.paymentDate) errors.paymentDate = 'Payment date is required.';
  if (!values.method) errors.method = 'Select a payment method.';
  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    errors.amount = 'Enter an amount greater than 0.';
  } else if (values.amount > outstanding) {
    errors.amount = `Amount cannot exceed the outstanding ${formatINR(outstanding)}.`;
  }
  return errors;
}

export function validateExpenseForm(values: ExpenseFormValues): ExpenseFormErrors {
  const errors: ExpenseFormErrors = {};
  if (!values.propertyId) errors.propertyId = 'Select a property.';
  if (!values.category) errors.category = 'Select a category.';
  if (!values.description.trim()) errors.description = 'Description is required.';
  if (!values.expenseDate) errors.expenseDate = 'Expense date is required.';
  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    errors.amount = 'Amount must be greater than 0.';
  }
  return errors;
}

export function emptyInvoiceFilters(): InvoiceFilters {
  return { query: '', propertyId: '', tenantId: '', status: '', billingPeriod: '', dueStatus: '' };
}

export function emptyPaymentFilters(): PaymentFilters {
  return { query: '', propertyId: '', tenantId: '', status: '', method: '', billingPeriod: '', fromDate: '', toDate: '' };
}

export function emptyExpenseFilters(): ExpenseFilters {
  return { query: '', propertyId: '', category: '', status: '', fromDate: '', toDate: '' };
}
