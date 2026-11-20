export type FinanceScope = 'admin' | 'accountant' | 'tenant';

export function invoiceDetailPath(scope: FinanceScope, invoiceId: string): string {
  if (scope === 'tenant') return `/tenant/payments/invoices/${invoiceId}`;
  return `/${scope}/invoices/${invoiceId}`;
}

export function paymentDetailPath(scope: FinanceScope, paymentId: string): string {
  if (scope === 'tenant') return `/tenant/payments/receipts/${paymentId}`;
  return `/${scope}/payments/${paymentId}`;
}

export function expenseDetailPath(scope: Exclude<FinanceScope, 'tenant'>, expenseId: string): string {
  return `/${scope}/expenses/${expenseId}`;
}

export function paymentsListPath(scope: FinanceScope): string {
  return `/${scope}/payments`;
}

export function invoicesListPath(scope: Exclude<FinanceScope, 'tenant'>): string {
  return `/${scope}/invoices`;
}

export function expensesListPath(scope: Exclude<FinanceScope, 'tenant'>): string {
  return `/${scope}/expenses`;
}

export function financeHomePath(scope: FinanceScope): string {
  return `/${scope}/dashboard`;
}

export function scopeFromPath(pathname: string): FinanceScope {
  if (pathname.startsWith('/accountant')) return 'accountant';
  if (pathname.startsWith('/tenant')) return 'tenant';
  return 'admin';
}
