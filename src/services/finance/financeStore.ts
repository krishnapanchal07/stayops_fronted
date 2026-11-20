import seedExpenses from '@/mock/expenses.json';
import seedInvoices from '@/mock/invoices.json';
import seedPayments from '@/mock/payments.json';
import type { Expense, InvoiceRecord, Payment } from '@/types/finance';

function clone<T>(value: T): T {
  return structuredClone(value);
}

let invoices: InvoiceRecord[] = clone(seedInvoices as InvoiceRecord[]);
let payments: Payment[] = clone(seedPayments as Payment[]);
let expenses: Expense[] = clone(seedExpenses as Expense[]);

export const financeStore = {
  listInvoices(): InvoiceRecord[] {
    return clone(invoices);
  },
  getInvoice(id: string): InvoiceRecord | undefined {
    const item = invoices.find((invoice) => invoice.id === id);
    return item ? clone(item) : undefined;
  },
  insertInvoice(record: InvoiceRecord): InvoiceRecord {
    invoices = [record, ...invoices];
    return clone(record);
  },
  persistInvoice(record: InvoiceRecord): InvoiceRecord {
    invoices = invoices.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },

  listPayments(): Payment[] {
    return clone(payments);
  },
  getPayment(id: string): Payment | undefined {
    const item = payments.find((payment) => payment.id === id);
    return item ? clone(item) : undefined;
  },
  insertPayment(record: Payment): Payment {
    payments = [record, ...payments];
    return clone(record);
  },
  persistPayment(record: Payment): Payment {
    payments = payments.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },

  listExpenses(): Expense[] {
    return clone(expenses);
  },
  getExpense(id: string): Expense | undefined {
    const item = expenses.find((expense) => expense.id === id);
    return item ? clone(item) : undefined;
  },
  insertExpense(record: Expense): Expense {
    expenses = [record, ...expenses];
    return clone(record);
  },
  persistExpense(record: Expense): Expense {
    expenses = expenses.map((item) => (item.id === record.id ? record : item));
    return clone(record);
  },
  removeExpense(id: string): void {
    expenses = expenses.filter((item) => item.id !== id);
  },
};
