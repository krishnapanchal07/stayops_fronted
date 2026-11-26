import { workflowRequest } from '@/services/http/workflows';
import { financeCreate, financeList, financePage, type FinanceQuery } from './api';
import type { Invoice, InvoiceFilters, InvoiceFormValues } from '@/types/finance';
export const invoiceService = {
  getInvoices: () => financeList<Invoice>('invoices'),
  getInvoicePage: (filters: FinanceQuery) => financePage<Invoice>('invoices', filters),
  getInvoiceById: (id: string): Promise<Invoice> =>
    workflowRequest('get', `/finance/invoices/${encodeURIComponent(id)}`),
  getInvoicesByTenant: (tenantId: string) => financeList<Invoice>('invoices', { tenantId }),
  searchInvoices: (filters: InvoiceFilters) => financeList<Invoice>('invoices', { ...filters }),
  createInvoice: (values: InvoiceFormValues) => financeCreate<Invoice>('invoices', values),
  updateInvoice: (id: string, values: InvoiceFormValues): Promise<Invoice> =>
    workflowRequest('patch', `/finance/invoices/${encodeURIComponent(id)}`, values),
  cancelInvoice: (id: string): Promise<Invoice> =>
    workflowRequest('post', `/finance/invoices/${encodeURIComponent(id)}/cancel`),
};
