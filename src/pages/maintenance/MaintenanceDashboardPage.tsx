import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

export function MaintenanceDashboardPage() {
  const user = useCurrentUser();
  const staffId = user?.id;
  const loader = useCallback(() => dashboardService.getMaintenanceDashboard(staffId), [staffId]);
  const { data, status, error, reload } = useAsyncResource(loader);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Assigned work, urgency, and recent complaint tickets for maintenance."
      />

      {status === 'loading' ? <DashboardSkeleton cards={5} /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {data.stats.map((metric) => (
              <StatCard key={metric.id} metric={metric} />
            ))}
          </div>

          <Card>
            <CardHeader
              title="Recent Assigned Complaints"
              action={
                <Link to={PATHS.maintenance.tasks} className="text-sm font-medium text-primary">
                  View All
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="typo-muted">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Room</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTasks.map((item) => (
                    <tr key={item.id} className="border-t border-border text-sm">
                      <td className="py-3 font-medium">{item.id}</td>
                      <td className="py-3">{item.title}</td>
                      <td className="py-3 text-muted">{item.room}</td>
                      <td className="py-3">
                        <StatusPill value={item.priority} />
                      </td>
                      <td className="py-3">
                        <StatusPill value={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
