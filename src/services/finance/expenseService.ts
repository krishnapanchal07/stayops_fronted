import { workflowRequest } from '@/services/http/workflows';
import { financeCreate, financeList, financePage, type FinanceQuery } from './api';
import type { Expense, ExpenseFilters, ExpenseFormValues } from '@/types/finance';
export const expenseService = {
  getExpenses: () => financeList<Expense>('expenses'),
  getExpensePage: (filters: FinanceQuery) => financePage<Expense>('expenses', filters),
  getExpenseById: (id: string): Promise<Expense> =>
    workflowRequest('get', `/finance/expenses/${encodeURIComponent(id)}`),
  searchExpenses: (filters: ExpenseFilters) => financeList<Expense>('expenses', { ...filters }),
  createExpense: (values: ExpenseFormValues, _createdBy?: string) => {
    void _createdBy;
    return financeCreate<Expense>('expenses', values);
  },
  updateExpense: (id: string, values: ExpenseFormValues): Promise<Expense> =>
    workflowRequest('patch', `/finance/expenses/${encodeURIComponent(id)}`, values),
  deleteExpense: (id: string): Promise<void> =>
    workflowRequest('post', `/finance/expenses/${encodeURIComponent(id)}/cancel`),
};
