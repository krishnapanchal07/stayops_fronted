import { Card, CardHeader } from '@/components/common/Card';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { PropertyOccupancy } from '@/components/dashboard/PropertyOccupancy';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import { formatINR } from '@/utils/format';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

export function AdminDashboardPage() {
  const user = useCurrentUser();
  const loader = useCallback(() => dashboardService.getAdminDashboard(), []);
  const { data, status, error, reload } = useAsyncResource(loader);
  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div>
      <div className="mb-6">
        <h1 className="typo-page-title">Welcome back, {firstName} 👋</h1>
        <p className="typo-secondary mt-1">Here’s what’s happening in your properties.</p>
      </div>

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

          <div className="grid gap-5 xl:grid-cols-2">
            <OccupancyChart
              percent={data.occupancy.percent}
              occupied={data.occupancy.occupied}
              vacant={data.occupancy.vacant}
              slices={data.occupancy.slices}
            />
            <TrendChart title="Monthly Revenue" data={data.monthlyRevenue} />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader title="Pending Payments" />
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="typo-muted">
                      <th className="pb-3 font-medium">Tenant</th>
                      <th className="pb-3 font-medium">Room</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Due Date</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pendingPayments.map((row) => (
                      <tr key={row.id} className="border-t border-border text-sm">
                        <td className="py-3 font-medium">{row.tenant}</td>
                        <td className="py-3 text-muted">{row.room}</td>
                        <td className="py-3">{formatINR(row.amount)}</td>
                        <td className="py-3 text-muted">{row.dueDate}</td>
                        <td className="py-3">
                          <StatusPill value={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Recent Complaints"
                action={
                  <Link to={PATHS.admin.complaints} className="text-sm font-medium text-primary">
                    View All
                  </Link>
                }
              />
              <ul className="space-y-4">
                {data.recentComplaints.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text">{item.title}</p>
                      <p className="typo-helper mt-0.5">
                        {item.id} · {item.room}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill value={item.priority} />
                      <StatusPill value={item.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ActivityList title="Recent Activity" items={data.recentActivity} />
            <PropertyOccupancy items={data.occupancyByProperty} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
