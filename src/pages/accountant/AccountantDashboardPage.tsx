import { FinanceFilters, type FinanceDashboardFilters } from '@/components/finance/FinanceFilters';
import { Card, CardHeader } from '@/components/common/Card';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { PaymentMethodsChart } from '@/components/dashboard/PaymentMethodsChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import { formatINR } from '@/utils/format';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

export function AccountantDashboardPage() {
  const user = useCurrentUser();
  const [financeFilters,setFinanceFilters]=useState<FinanceDashboardFilters>({propertyId:'',fromDate:'',toDate:''});
  const loader = useCallback(() => dashboardService.getAccountantDashboard({...financeFilters}), [financeFilters]);
  const { data, status, error, reload } = useAsyncResource(loader);
  const firstName = user?.name.split(' ')[0] ?? 'Accountant';

  return (
    <div>
      <div className="mb-6">
        <h1 className="typo-page-title">Welcome, {firstName} 👋</h1>
        <p className="typo-secondary mt-1">Here’s the financial overview for StayOps.</p>
      </div>

      <FinanceFilters value={financeFilters} onChange={setFinanceFilters} />
      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((metric) => (
              <StatCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <TrendChart title="Collection Trend" data={data.collectionTrend} />
            </div>
            <Card>
              <CardHeader
                title="Due Today"
                action={
                  <Link to={PATHS.accountant.outstanding} className="text-sm font-medium text-primary">
                    View All
                  </Link>
                }
              />
              <ul className="space-y-3">
                {data.dueToday.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.tenant}</p>
                      <p className="typo-helper">{item.room}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatINR(item.amount)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ActivityList title="Recent Payments" items={data.recentPayments} />
            <PaymentMethodsChart items={data.paymentMethods} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
