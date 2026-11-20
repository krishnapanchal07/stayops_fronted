import {
  InvoiceStatus,
  PaymentStatus,
  type Expense,
  type ExpenseCategory,
  type Invoice,
  type InvoiceItem,
  type InvoiceRecord,
  type Payment,
} from '@/types/finance';

export function financeToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calculateInvoiceTotal(items: InvoiceItem[], discount = 0, lateFee = 0): {
  subtotal: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal + lateFee - discount);
  return { subtotal, total };
}

export function calculatePaidAmount(payments: Payment[], invoiceId: string): number {
  return payments
    .filter((payment) => payment.invoiceId === invoiceId && payment.status === PaymentStatus.SUCCESS)
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function calculateCollectedAmount(payments: Payment[]): number {
  return payments
    .filter((payment) => payment.status === PaymentStatus.SUCCESS)
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export function calculateOutstandingAmount(total: number, paidAmount: number): number {
  return Math.max(0, total - paidAmount);
}

export function calculateInvoiceStatus(input: {
  total: number;
  paidAmount: number;
  dueDate: string;
  cancelled: boolean;
  today?: string;
}): InvoiceStatus {
  if (input.cancelled) return InvoiceStatus.CANCELLED;
  if (input.total <= 0) return InvoiceStatus.DRAFT;
  if (input.paidAmount >= input.total) return InvoiceStatus.PAID;
  if (input.paidAmount > 0) return InvoiceStatus.PARTIALLY_PAID;
  const today = input.today ?? financeToday();
  if (input.dueDate < today) return InvoiceStatus.OVERDUE;
  return InvoiceStatus.ISSUED;
}

export function hydrateInvoice(record: InvoiceRecord, payments: Payment[], today = financeToday()): Invoice {
  const { subtotal, total } = calculateInvoiceTotal(record.items, record.discount, record.lateFee);
  const paidAmount = calculatePaidAmount(payments, record.id);
  const outstandingAmount = record.cancelled ? 0 : calculateOutstandingAmount(total, paidAmount);
  return {
    ...record,
    subtotal,
    total,
    paidAmount: record.cancelled ? paidAmount : Math.min(paidAmount, total),
    outstandingAmount,
    status: calculateInvoiceStatus({
      total,
      paidAmount,
      dueDate: record.dueDate,
      cancelled: record.cancelled,
      today,
    }),
  };
}

export function calculateTenantDue(invoices: Invoice[]): number {
  return invoices
    .filter((invoice) => invoice.status !== InvoiceStatus.CANCELLED && invoice.status !== InvoiceStatus.PAID)
    .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
}

export function calculateOverdueAmount(invoices: Invoice[]): number {
  return invoices
    .filter((invoice) => invoice.status === InvoiceStatus.OVERDUE)
    .reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
}

export function calculateCollectionRate(collected: number, billed: number): number {
  if (billed <= 0) return 0;
  return Math.round((collected / billed) * 100);
}

export function calculateExpenseTotal(expenses: Expense[]): number {
  return expenses.filter((expense) => expense.status !== 'CANCELLED').reduce((sum, expense) => sum + expense.amount, 0);
}

export function calculateNetIncome(collected: number, expenses: number): number {
  return collected - expenses;
}

export function daysOverdue(dueDate: string, today = financeToday()): number {
  if (dueDate >= today) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const now = new Date(`${today}T00:00:00`);
  return Math.max(0, Math.round((now.getTime() - due.getTime()) / 86_400_000));
}

export function formatBillingPeriod(period: string): string {
  const [year, month] = period.split('-');
  if (!year || !month) return period;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(date);
}

export function currentBillingPeriod(today = financeToday()): string {
  return today.slice(0, 7);
}

export function expenseBreakdown(expenses: Expense[]): { category: ExpenseCategory; amount: number }[] {
  const totals = new Map<ExpenseCategory, number>();
  for (const expense of expenses) {
    if (expense.status === 'CANCELLED') continue;
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }
  return [...totals.entries()].map(([category, amount]) => ({ category, amount }));
}

export function collectionByMonth(payments: Payment[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== PaymentStatus.SUCCESS) continue;
    const key = payment.paymentDate.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + payment.amount);
  }
  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7)
    .map(([period, value]) => ({ label: formatBillingPeriod(period).split(' ')[0] ?? period, value }));
}

export function relativeTime(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  const now = new Date();
  const diff = Math.round((now.getTime() - date.getTime()) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatBillingPeriod(isoDate.slice(0, 7));
}
