import { financeStore } from '@/services/finance/financeStore';
import { invoiceService } from '@/services/finance/invoiceService';
import { notificationStore } from '@/services/notification/notificationStore';
import { InvoiceStatus, PaymentStatus, type Payment, type PaymentFilters, type PaymentFormValues } from '@/types/finance';
import { formatINR } from '@/utils/format';
import { financeToday, hydrateInvoice } from '@/utils/financeCalc';
import { validatePaymentForm } from '@/utils/financeValidation';

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function nextNumber(prefix: string, values: string[]): string {
  const numbers = values.map((value) => Number.parseInt(value.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `${prefix}-${(numbers.length ? Math.max(...numbers) : 2000) + 1}`;
}

export function filterPayments(payments: Payment[], filters: PaymentFilters): Payment[] {
  const query = filters.query.trim().toLowerCase();
  return payments.filter((payment) => {
    if (filters.propertyId && payment.propertyId !== filters.propertyId) return false;
    if (filters.tenantId && payment.tenantId !== filters.tenantId) return false;
    if (filters.status && payment.status !== filters.status) return false;
    if (filters.method && payment.method !== filters.method) return false;
    if (filters.fromDate && payment.paymentDate < filters.fromDate) return false;
    if (filters.toDate && payment.paymentDate > filters.toDate) return false;
    if (filters.billingPeriod) {
      const invoice = financeStore.getInvoice(payment.invoiceId);
      if (!invoice || invoice.billingPeriod !== filters.billingPeriod) return false;
    }
    if (!query) return true;
    return (
      payment.paymentNumber.toLowerCase().includes(query) ||
      payment.invoiceNumber.toLowerCase().includes(query) ||
      payment.tenantName.toLowerCase().includes(query) ||
      (payment.roomNumber ?? '').toLowerCase().includes(query) ||
      payment.reference.toLowerCase().includes(query)
    );
  });
}

export const paymentService = {
  getPayments(): Promise<Payment[]> {
    return wait(financeStore.listPayments());
  },

  getPaymentById(id: string): Promise<Payment> {
    const payment = financeStore.getPayment(id);
    return payment ? wait(payment) : reject('Payment not found.');
  },

  getPaymentsByTenant(tenantId: string): Promise<Payment[]> {
    return wait(financeStore.listPayments().filter((payment) => payment.tenantId === tenantId));
  },

  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return wait(financeStore.listPayments().filter((payment) => payment.invoiceId === invoiceId));
  },

  searchPayments(filters: PaymentFilters): Promise<Payment[]> {
    return wait(filterPayments(financeStore.listPayments(), filters));
  },

  async recordPayment(values: PaymentFormValues, options?: { actor?: string }): Promise<Payment> {
    const invoice = await invoiceService.getInvoiceById(values.invoiceId);
    const errors = validatePaymentForm(values, invoice.outstandingAmount);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to record payment.');
    }
    if (invoice.cancelled || invoice.status === InvoiceStatus.CANCELLED) {
      return reject('Cancelled invoices cannot receive payments.');
    }
    if (invoice.outstandingAmount <= 0) {
      return reject('This invoice is already fully paid.');
    }
    if (values.tenantId && values.tenantId !== invoice.tenantId) {
      return reject('Selected invoice does not belong to this tenant.');
    }

    const payment: Payment = {
      id: `pay-${Date.now().toString(36)}`,
      paymentNumber: nextNumber(
        'PAY',
        financeStore.listPayments().map((item) => item.paymentNumber),
      ),
      receiptNumber: nextNumber(
        'RCT',
        financeStore.listPayments().map((item) => item.receiptNumber),
      ),
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      tenantId: invoice.tenantId,
      tenantName: invoice.tenantName,
      propertyId: invoice.propertyId,
      propertyName: invoice.propertyName,
      roomNumber: invoice.roomNumber,
      amount: values.amount,
      paymentDate: values.paymentDate || financeToday(),
      method: values.method,
      status: PaymentStatus.SUCCESS,
      reference: values.reference.trim(),
      notes: values.notes.trim(),
      createdAt: financeToday(),
    };
    financeStore.insertPayment(payment);
    notificationStore.push({
      title: 'Payment received',
      description: `${options?.actor ?? invoice.tenantName} paid ${formatINR(payment.amount)} for ${invoice.invoiceNumber}.`,
      tone: 'success',
    });
    return wait(payment);
  },

  refundPayment(id: string, reason: string): Promise<Payment> {
    const current = financeStore.getPayment(id);
    if (!current) return reject('Payment not found.');
    if (current.status !== PaymentStatus.SUCCESS) return reject('Only successful payments can be refunded.');
    if (!reason.trim()) return reject('A refund reason is required.');
    const updated = financeStore.persistPayment({
      ...current,
      status: PaymentStatus.REFUNDED,
      notes: reason.trim(),
    });
    const invoice = financeStore.getInvoice(current.invoiceId);
    if (invoice) {
      hydrateInvoice(invoice, financeStore.listPayments());
    }
    notificationStore.push({
      title: 'Payment refunded',
      description: `${updated.paymentNumber} of ${formatINR(updated.amount)} was refunded.`,
      tone: 'warning',
    });
    return wait(updated);
  },
};
