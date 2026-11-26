import type { InvoiceItem } from '@/types/finance';

export function financeToday(): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
}

export function calculateInvoiceTotal(items: InvoiceItem[], discount = 0, lateFee = 0): {
  subtotal: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal + lateFee - discount);
  return { subtotal, total };
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
