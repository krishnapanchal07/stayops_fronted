import { expenseService } from '@/services/finance/expenseService';
import { financeStore } from '@/services/finance/financeStore';
import { invoiceService } from '@/services/finance/invoiceService';
import { paymentService } from '@/services/finance/paymentService';
import { tenantStore } from '@/services/tenant/tenantStore';
import { InvoiceStatus, PAYMENT_METHOD_LABELS, PaymentStatus, type FinanceOverview, type Invoice, type Payment, type TenantFinancialSummary } from '@/types/finance';
import {
  calculateCollectedAmount,
  calculateCollectionRate,
  calculateExpenseTotal,
  calculateNetIncome,
  calculateOverdueAmount,
  calculateTenantDue,
  collectionByMonth,
  currentBillingPeriod,
  daysOverdue,
  expenseBreakdown,
  financeToday,
  relativeTime,
} from '@/utils/financeCalc';
import { formatINR, formatShortDate } from '@/utils/format';

function wait<T>(value: T, ms = 140): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function currentMonthPaid(payments: Payment[], invoices: Invoice[]): number {
  const period = currentBillingPeriod();
  return payments
    .filter((payment) => {
      if (payment.status !== PaymentStatus.SUCCESS) return false;
      const invoice = invoices.find((item) => item.id === payment.invoiceId);
      return invoice?.billingPeriod === period || payment.paymentDate.slice(0, 7) === period;
    })
    .reduce((sum, payment) => sum + payment.amount, 0);
}

function currentMonthCharges(invoices: Invoice[]): number {
  const period = currentBillingPeriod();
  return invoices.filter((invoice) => invoice.billingPeriod === period && !invoice.cancelled).reduce((sum, invoice) => sum + invoice.total, 0);
}

function nextDueDate(invoices: Invoice[]): string | null {
  const dates = invoices
    .filter((invoice) => invoice.outstandingAmount > 0 && !invoice.cancelled)
    .map((invoice) => invoice.dueDate)
    .sort();
  return dates[0] ?? null;
}

export const financeService = {
  getInvoices: invoiceService.getInvoices,
  getInvoiceById: invoiceService.getInvoiceById,
  getInvoicesByTenant: invoiceService.getInvoicesByTenant,
  searchInvoices: invoiceService.searchInvoices,
  createInvoice: invoiceService.createInvoice,
  updateInvoice: invoiceService.updateInvoice,
  cancelInvoice: invoiceService.cancelInvoice,

  getPayments: paymentService.getPayments,
  getPaymentById: paymentService.getPaymentById,
  getPaymentsByTenant: paymentService.getPaymentsByTenant,
  getPaymentsByInvoice: paymentService.getPaymentsByInvoice,
  searchPayments: paymentService.searchPayments,
  recordPayment: paymentService.recordPayment,
  refundPayment: paymentService.refundPayment,

  getExpenses: expenseService.getExpenses,
  getExpenseById: expenseService.getExpenseById,
  searchExpenses: expenseService.searchExpenses,
  createExpense: expenseService.createExpense,
  updateExpense: expenseService.updateExpense,
  deleteExpense: expenseService.deleteExpense,

  async getInvoiceSummary() {
    const invoices = await invoiceService.getInvoices();
    const payments = financeStore.listPayments();
    const billed = invoices.filter((invoice) => !invoice.cancelled).reduce((sum, invoice) => sum + invoice.total, 0);
    const collected = calculateCollectedAmount(payments);
    const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
    const overdue = calculateOverdueAmount(invoices);
    return { billed, collected, outstanding, overdue, count: invoices.length };
  },

  async getPaymentSummary() {
    const payments = financeStore.listPayments();
    const invoices = await invoiceService.getInvoices();
    const collected = calculateCollectedAmount(payments);
    const pending = payments.filter((payment) => payment.status === PaymentStatus.PENDING).reduce((sum, payment) => sum + payment.amount, 0);
    const overdue = calculateOverdueAmount(invoices);
    const today = financeToday();
    const todayCollection = payments
      .filter((payment) => payment.status === PaymentStatus.SUCCESS && payment.paymentDate === today)
      .reduce((sum, payment) => sum + payment.amount, 0);
    return { collected, pending, overdue, todayCollection };
  },

  async getExpenseSummary() {
    const expenses = financeStore.listExpenses();
    const today = financeToday();
    const year = today.slice(0, 4);
    const month = today.slice(0, 7);
    return {
      total: calculateExpenseTotal(expenses),
      thisMonth: calculateExpenseTotal(expenses.filter((expense) => expense.expenseDate.startsWith(month))),
      thisYear: calculateExpenseTotal(expenses.filter((expense) => expense.expenseDate.startsWith(year))),
      breakdown: expenseBreakdown(expenses),
    };
  },

  async getFinanceOverview(): Promise<FinanceOverview> {
    const [invoices, payments, expenses] = await Promise.all([
      invoiceService.getInvoices(),
      paymentService.getPayments(),
      expenseService.getExpenses(),
    ]);
    const billed = invoices.filter((invoice) => !invoice.cancelled).reduce((sum, invoice) => sum + invoice.total, 0);
    const collected = calculateCollectedAmount(payments);
    const outstanding = invoices.reduce((sum, invoice) => sum + invoice.outstandingAmount, 0);
    const overdueInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.OVERDUE);
    const overdue = calculateOverdueAmount(invoices);
    const expenseTotal = calculateExpenseTotal(expenses);
    const today = financeToday();
    const month = today.slice(0, 7);
    const year = today.slice(0, 4);
    const openInvoices = invoices.filter((invoice) => invoice.outstandingAmount > 0 && !invoice.cancelled);

    return {
      billed,
      collected,
      outstanding,
      overdue,
      overdueAccounts: overdueInvoices.length,
      thisMonthCollected: currentMonthPaid(payments, invoices),
      todayCollected: payments
        .filter((payment) => payment.status === PaymentStatus.SUCCESS && payment.paymentDate === today)
        .reduce((sum, payment) => sum + payment.amount, 0),
      pendingPayments: payments.filter((payment) => payment.status === PaymentStatus.PENDING).reduce((sum, payment) => sum + payment.amount, 0),
      expenses: expenseTotal,
      thisMonthExpenses: calculateExpenseTotal(expenses.filter((expense) => expense.expenseDate.startsWith(month))),
      thisYearExpenses: calculateExpenseTotal(expenses.filter((expense) => expense.expenseDate.startsWith(year))),
      netIncome: calculateNetIncome(collected, expenseTotal),
      collectionRate: calculateCollectionRate(collected, billed),
      expenseBreakdown: expenseBreakdown(expenses),
      collectionTrend: collectionByMonth(payments),
      dueToday: invoices
        .filter((invoice) => invoice.dueDate === today && invoice.outstandingAmount > 0 && !invoice.cancelled)
        .map((invoice) => ({
          id: invoice.id,
          tenant: invoice.tenantName,
          room: invoice.roomNumber ?? '—',
          amount: invoice.outstandingAmount,
          dueDate: invoice.dueDate,
          invoiceId: invoice.id,
        })),
      recentPayments: [...payments]
        .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))
        .slice(0, 5)
        .map((payment) => ({
          id: payment.id,
          title: payment.status === PaymentStatus.SUCCESS ? 'Payment received' : `Payment ${payment.status.toLowerCase()}`,
          detail: `${payment.tenantName} · ${formatINR(payment.amount)} · ${payment.invoiceNumber}`,
          time: relativeTime(payment.paymentDate),
        })),
      paymentMethods: Object.entries(
        payments
          .filter((payment) => payment.status === PaymentStatus.SUCCESS)
          .reduce<Record<string, number>>((acc, payment) => {
            const name = PAYMENT_METHOD_LABELS[payment.method];
            acc[name] = (acc[name] ?? 0) + payment.amount;
            return acc;
          }, {}),
      ).map(([name, value]) => ({ name, value })),
      pendingInvoiceRows: openInvoices.slice(0, 6).map((invoice) => ({
        id: invoice.id,
        tenant: invoice.tenantName,
        room: invoice.roomNumber ?? '—',
        amount: invoice.outstandingAmount,
        dueDate: formatShortDate(invoice.dueDate),
        status: invoice.status === InvoiceStatus.OVERDUE ? 'Overdue' : 'Due',
      })),
    };
  },

  async getTenantFinancialSummary(tenantId: string): Promise<TenantFinancialSummary> {
    const tenant = tenantStore.get(tenantId);
    const invoices = await invoiceService.getInvoicesByTenant(tenantId);
    const payments = await paymentService.getPaymentsByTenant(tenantId);
    const openInvoices = invoices.filter((invoice) => invoice.outstandingAmount > 0 && !invoice.cancelled);
    const recentPayments = [...payments].sort((left, right) => right.paymentDate.localeCompare(left.paymentDate)).slice(0, 5);
    return wait({
      tenantId,
      currentDue: calculateTenantDue(invoices),
      overdue: calculateOverdueAmount(invoices),
      totalPaid: calculateCollectedAmount(payments),
      currentMonthCharges: currentMonthCharges(invoices),
      securityDeposit: tenant?.securityDeposit ?? 0,
      nextDueDate: nextDueDate(invoices),
      recentPayments,
      openInvoices,
    });
  },

  async getDueToday() {
    const today = financeToday();
    const invoices = (await invoiceService.getInvoices()).filter(
      (invoice) => invoice.dueDate === today && invoice.outstandingAmount > 0 && !invoice.cancelled,
    );
    return invoices.map((invoice) => ({
      invoice,
      tenantName: invoice.tenantName,
      roomNumber: invoice.roomNumber,
      propertyName: invoice.propertyName,
      amount: invoice.outstandingAmount,
      dueDate: invoice.dueDate,
    }));
  },

  async getOutstandingDues() {
    const invoices = (await invoiceService.getInvoices()).filter((invoice) => invoice.outstandingAmount > 0 && !invoice.cancelled);
    return invoices.map((invoice) => ({
      ...invoice,
      daysOverdue: invoice.status === InvoiceStatus.OVERDUE ? daysOverdue(invoice.dueDate) : 0,
    }));
  },

  async getCollectionTrend() {
    const payments = await paymentService.getPayments();
    return collectionByMonth(payments);
  },

  async getPaymentMethodBreakdown() {
    const overview = await financeService.getFinanceOverview();
    return overview.paymentMethods;
  },

  async getRecentPayments(limit = 5): Promise<Payment[]> {
    const payments = await paymentService.getPayments();
    return [...payments].sort((left, right) => right.paymentDate.localeCompare(left.paymentDate)).slice(0, limit);
  },
};
