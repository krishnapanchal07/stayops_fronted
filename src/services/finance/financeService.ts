import { workflowRequest, workflowList } from '@/services/http/workflows';
import { invoiceService } from './invoiceService';
import { paymentService } from './paymentService';
import { expenseService } from './expenseService';
import { financeUrl, type FinanceQuery } from './api';
import type { FinanceOverview, TenantFinancialSummary, ExpenseCategory } from '@/types/finance';
import type { Tenant } from '@/types/tenant';
export const financeService = {
  ...invoiceService,
  ...paymentService,
  ...expenseService,
  getProperties: (): Promise<{ id: string; name: string }[]> =>
    workflowRequest('get', '/finance/options/properties'),
  getTenants: (propertyId = ''): Promise<Tenant[]> =>
    workflowList(`/finance/options/tenants?${new URLSearchParams({ propertyId })}`),
  getInvoiceSummary: (): Promise<{
    testCollected: number;
    billed: number;
    collected: number;
    outstanding: number;
    overdue: number;
    count: number;
  }> => workflowRequest('get', '/finance/invoices/summary'),
  getPaymentSummary: (): Promise<{
    testCollected: number;
    collected: number;
    pending: number;
    overdue: number;
    todayCollection: number;
  }> => workflowRequest('get', '/finance/payments/summary'),
  getExpenseSummary: (): Promise<{
    total: number;
    thisMonth: number;
    thisYear: number;
    breakdown: { category: ExpenseCategory; amount: number }[];
  }> => workflowRequest('get', '/finance/expenses/summary'),
  getFinanceOverview: (filters: FinanceQuery = {}): Promise<FinanceOverview> =>
    workflowRequest('get', financeUrl('overview', filters)),
  getTenantFinancialSummary: (tenantId: string): Promise<TenantFinancialSummary> =>
    workflowRequest('get', `/finance/tenants/${encodeURIComponent(tenantId)}/summary`),
  getMyFinancialSummary: (): Promise<TenantFinancialSummary> =>
    workflowRequest('get', '/finance/tenants/me/summary'),
};
