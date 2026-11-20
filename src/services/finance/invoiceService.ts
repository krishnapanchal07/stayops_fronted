import { financeStore } from '@/services/finance/financeStore';
import { notificationStore } from '@/services/notification/notificationStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import { InvoiceStatus, type Invoice, type InvoiceFilters, type InvoiceFormValues, type InvoiceRecord } from '@/types/finance';
import { financeToday, formatBillingPeriod, hydrateInvoice } from '@/utils/financeCalc';
import { validateInvoiceForm } from '@/utils/financeValidation';

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function hydrateAll(): Invoice[] {
  const payments = financeStore.listPayments();
  return financeStore.listInvoices().map((record) => hydrateInvoice(record, payments));
}

function nextInvoiceNumber(): string {
  const numbers = financeStore
    .listInvoices()
    .map((invoice) => Number.parseInt(invoice.invoiceNumber.replace(/\D/g, ''), 10))
    .filter(Number.isFinite);
  return `INV-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`;
}

export function filterInvoices(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
  const query = filters.query.trim().toLowerCase();
  return invoices.filter((invoice) => {
    if (filters.propertyId && invoice.propertyId !== filters.propertyId) return false;
    if (filters.tenantId && invoice.tenantId !== filters.tenantId) return false;
    if (filters.status && invoice.status !== filters.status) return false;
    if (filters.billingPeriod && invoice.billingPeriod !== filters.billingPeriod) return false;
    if (filters.dueStatus === 'PAID' && invoice.status !== InvoiceStatus.PAID) return false;
    if (filters.dueStatus === 'OVERDUE' && invoice.status !== InvoiceStatus.OVERDUE) return false;
    if (filters.dueStatus === 'DUE' && (invoice.outstandingAmount <= 0 || invoice.cancelled)) return false;
    if (!query) return true;
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.tenantName.toLowerCase().includes(query) ||
      invoice.tenantCode.toLowerCase().includes(query) ||
      (invoice.roomNumber ?? '').toLowerCase().includes(query)
    );
  });
}

export const invoiceService = {
  getInvoices(): Promise<Invoice[]> {
    return wait(hydrateAll());
  },

  getInvoiceById(id: string): Promise<Invoice> {
    const record = financeStore.getInvoice(id);
    if (!record) return reject('Invoice not found.');
    return wait(hydrateInvoice(record, financeStore.listPayments()));
  },

  getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
    return wait(hydrateAll().filter((invoice) => invoice.tenantId === tenantId));
  },

  searchInvoices(filters: InvoiceFilters): Promise<Invoice[]> {
    return wait(filterInvoices(hydrateAll(), filters));
  },

  async createInvoice(values: InvoiceFormValues): Promise<Invoice> {
    const errors = validateInvoiceForm(values);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to create invoice.');
    }
    const tenant = tenantStore.get(values.tenantId);
    if (!tenant) return reject('Tenant not found.');

    const record: InvoiceRecord = {
      id: `inv-${Date.now().toString(36)}`,
      invoiceNumber: nextInvoiceNumber(),
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      tenantCode: tenant.tenantCode,
      propertyId: tenant.propertyId ?? '',
      propertyName: tenant.propertyName ?? 'Unassigned',
      roomId: tenant.roomId,
      roomNumber: tenant.roomNumber,
      bedLabel: tenant.bedLabel,
      billingPeriod: values.billingPeriod,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      items: values.items.map((item, index) => ({ ...item, id: item.id || `item-${index + 1}` })),
      discount: values.discount,
      lateFee: values.lateFee,
      cancelled: false,
      createdAt: financeToday(),
      updatedAt: financeToday(),
    };
    financeStore.insertInvoice(record);
    notificationStore.push({
      title: 'Invoice generated',
      description: `${record.invoiceNumber} issued to ${tenant.fullName} for ${formatBillingPeriod(record.billingPeriod)}.`,
      tone: 'info',
    });
    return wait(hydrateInvoice(record, financeStore.listPayments()));
  },

  async updateInvoice(id: string, values: InvoiceFormValues): Promise<Invoice> {
    const current = financeStore.getInvoice(id);
    if (!current) return reject('Invoice not found.');
    const live = hydrateInvoice(current, financeStore.listPayments());
    if (live.paidAmount > 0) return reject('Paid invoices cannot be edited. Cancel and issue a new invoice if needed.');
    const errors = validateInvoiceForm(values);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to update invoice.');
    }
    const updated: InvoiceRecord = {
      ...current,
      billingPeriod: values.billingPeriod,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      items: values.items,
      discount: values.discount,
      lateFee: values.lateFee,
      updatedAt: financeToday(),
    };
    return wait(hydrateInvoice(financeStore.persistInvoice(updated), financeStore.listPayments()));
  },

  cancelInvoice(id: string): Promise<Invoice> {
    const current = financeStore.getInvoice(id);
    if (!current) return reject('Invoice not found.');
    const live = hydrateInvoice(current, financeStore.listPayments());
    if (live.status === InvoiceStatus.PAID) return reject('A fully paid invoice cannot be cancelled.');
    const updated = financeStore.persistInvoice({ ...current, cancelled: true, updatedAt: financeToday() });
    return wait(hydrateInvoice(updated, financeStore.listPayments()));
  },
};
