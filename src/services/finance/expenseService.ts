import { propertyService } from '@/services/property/propertyService';
import { financeStore } from '@/services/finance/financeStore';
import type { Expense, ExpenseFilters, ExpenseFormValues } from '@/types/finance';
import { financeToday } from '@/utils/financeCalc';
import { validateExpenseForm } from '@/utils/financeValidation';

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

export function filterExpenses(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const query = filters.query.trim().toLowerCase();
  return expenses.filter((expense) => {
    if (filters.propertyId && expense.propertyId !== filters.propertyId) return false;
    if (filters.category && expense.category !== filters.category) return false;
    if (filters.status && expense.status !== filters.status) return false;
    if (filters.fromDate && expense.expenseDate < filters.fromDate) return false;
    if (filters.toDate && expense.expenseDate > filters.toDate) return false;
    if (!query) return true;
    return (
      expense.description.toLowerCase().includes(query) ||
      expense.vendor.toLowerCase().includes(query) ||
      expense.propertyName.toLowerCase().includes(query) ||
      expense.expenseNumber.toLowerCase().includes(query)
    );
  });
}

export const expenseService = {
  getExpenses(): Promise<Expense[]> {
    return wait(financeStore.listExpenses());
  },

  getExpenseById(id: string): Promise<Expense> {
    const expense = financeStore.getExpense(id);
    return expense ? wait(expense) : reject('Expense not found.');
  },

  searchExpenses(filters: ExpenseFilters): Promise<Expense[]> {
    return wait(filterExpenses(financeStore.listExpenses(), filters));
  },

  async createExpense(values: ExpenseFormValues, createdBy: string): Promise<Expense> {
    const errors = validateExpenseForm(values);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to save expense.');
    }
    const property = await propertyService.getPropertyById(values.propertyId);
    const numbers = financeStore.listExpenses().map((item) => Number.parseInt(item.expenseNumber.replace(/\D/g, ''), 10));
    const expense: Expense = {
      id: `exp-${Date.now().toString(36)}`,
      expenseNumber: `EXP-${(numbers.length ? Math.max(...numbers) : 3000) + 1}`,
      propertyId: property.id,
      propertyName: property.name,
      category: values.category,
      description: values.description.trim(),
      amount: values.amount,
      expenseDate: values.expenseDate,
      vendor: values.vendor.trim(),
      paymentMethod: values.paymentMethod,
      status: values.status,
      notes: values.notes.trim(),
      createdAt: financeToday(),
      createdBy,
    };
    return wait(financeStore.insertExpense(expense));
  },

  async updateExpense(id: string, values: ExpenseFormValues): Promise<Expense> {
    const current = financeStore.getExpense(id);
    if (!current) return reject('Expense not found.');
    const errors = validateExpenseForm(values);
    if (Object.keys(errors).length > 0) {
      return reject(Object.values(errors)[0] ?? 'Unable to save expense.');
    }
    const property = await propertyService.getPropertyById(values.propertyId);
    return wait(
      financeStore.persistExpense({
        ...current,
        propertyId: property.id,
        propertyName: property.name,
        category: values.category,
        description: values.description.trim(),
        amount: values.amount,
        expenseDate: values.expenseDate,
        vendor: values.vendor.trim(),
        paymentMethod: values.paymentMethod,
        status: values.status,
        notes: values.notes.trim(),
      }),
    );
  },

  deleteExpense(id: string): Promise<void> {
    if (!financeStore.getExpense(id)) return reject('Expense not found.');
    financeStore.removeExpense(id);
    return wait(undefined);
  },
};
