import { workflowRequest } from '@/services/http/workflows';
import { financeCreate, financeList, financePage, type FinanceQuery } from './api';
import type { Payment, PaymentFilters, PaymentFormValues } from '@/types/finance';
export const paymentService = {
  getPayments: () => financeList<Payment>('payments'),
  getPaymentPage: (filters: FinanceQuery) => financePage<Payment>('payments', filters),
  getPaymentById: (id: string): Promise<Payment> =>
    workflowRequest('get', `/finance/payments/${encodeURIComponent(id)}`),
  getPaymentsByTenant: (tenantId: string) => financeList<Payment>('payments', { tenantId }),
  getPaymentsByInvoice: (invoiceId: string) => financeList<Payment>('payments', { invoiceId }),
  searchPayments: (filters: PaymentFilters) => financeList<Payment>('payments', { ...filters }),
  recordPayment: (values: PaymentFormValues, _options?: { actor?: string }) => {
    void _options;
    return financeCreate<Payment>('payments', values);
  },
  refundPayment: (id: string, reason: string): Promise<Payment> =>
    workflowRequest('post', `/finance/payments/${encodeURIComponent(id)}/refund`, { reason }),
};
