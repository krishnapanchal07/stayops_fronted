import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/types/finance';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { expensesListPath, financeHomePath, scopeFromPath } from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import { formatINR, formatShortDate } from '@/utils/format';
import { useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export function ExpenseDetailsPage() {
  const { expenseId = '' } = useParams();
  const location = useLocation();
  const scope = scopeFromPath(location.pathname);
  const listScope = scope === 'tenant' ? 'admin' : scope;
  const loader = useCallback(() => financeService.getExpenseById(expenseId), [expenseId]);
  const { data: expense, status, error, reload } = useAsyncResource(loader);

  return (
    <div>
      <PageHeader
        title={expense?.expenseNumber ?? 'Expense'}
        description="Property operating cost details."
        showBack
        breadcrumbs={[
          { label: 'Home', href: financeHomePath(scope) },
          { label: 'Expenses', href: expensesListPath(listScope) },
          { label: expense?.expenseNumber ?? 'Expense' },
        ]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Expense not found.'} onRetry={reload} />
      ) : null}

      {status === 'success' && expense ? (
        <Card>
          <CardHeader title="Expense details" />
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="typo-muted">Expense ID</dt>
              <dd className="mt-1 font-semibold">{expense.expenseNumber}</dd>
            </div>
            <div>
              <dt className="typo-muted">Date</dt>
              <dd className="mt-1 font-medium">{formatShortDate(expense.expenseDate)}</dd>
            </div>
            <div>
              <dt className="typo-muted">Property</dt>
              <dd className="mt-1 font-medium">{expense.propertyName}</dd>
            </div>
            <div>
              <dt className="typo-muted">Category</dt>
              <dd className="mt-1 font-medium">{EXPENSE_CATEGORY_LABELS[expense.category]}</dd>
            </div>
            <div>
              <dt className="typo-muted">Description</dt>
              <dd className="mt-1 font-medium">{expense.description}</dd>
            </div>
            <div>
              <dt className="typo-muted">Vendor</dt>
              <dd className="mt-1 font-medium">{expense.vendor || '—'}</dd>
            </div>
            <div>
              <dt className="typo-muted">Amount</dt>
              <dd className="mt-1 font-semibold">{formatINR(expense.amount)}</dd>
            </div>
            <div>
              <dt className="typo-muted">Payment method</dt>
              <dd className="mt-1 font-medium">{PAYMENT_METHOD_LABELS[expense.paymentMethod]}</dd>
            </div>
            <div>
              <dt className="typo-muted">Status</dt>
              <dd className="mt-1">
                <StatusPill value={EXPENSE_STATUS_LABELS[expense.status]} />
              </dd>
            </div>
            <div>
              <dt className="typo-muted">Created by</dt>
              <dd className="mt-1 font-medium">{expense.createdBy}</dd>
            </div>
            {expense.notes ? (
              <div className="sm:col-span-2">
                <dt className="typo-muted">Notes</dt>
                <dd className="mt-1 font-medium">{expense.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      ) : null}
    </div>
  );
}
