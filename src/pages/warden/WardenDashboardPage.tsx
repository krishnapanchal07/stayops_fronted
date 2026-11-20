import { Card, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { PageHeader } from '@/components/common/PageHeader';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { VisitorLog } from '@/components/dashboard/VisitorLog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

export function WardenDashboardPage() {
  const user = useCurrentUser();
  const propertyIds = user?.propertyIds;
  const loader = useCallback(() => dashboardService.getWardenDashboard(propertyIds), [propertyIds]);
  const { data, status, error, reload } = useAsyncResource(loader);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Occupancy, pending requests, and visitor activity for your property."
      />

      {status === 'loading' ? <DashboardSkeleton cards={6} /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.stats.map((metric) => (
              <StatCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <OccupancyChart
              percent={data.occupancy.percent}
              occupied={data.occupancy.occupied}
              vacant={data.occupancy.vacant}
              slices={data.occupancy.slices}
            />
            <VisitorLog
              title="Expected Visitors"
              items={data.expectedVisitors}
              action={
                <Link to={PATHS.warden.visitors} className="text-sm font-medium text-primary">
                  View All
                </Link>
              }
            />
            <ActivityList
              title="Pending Leave Requests"
              items={data.pendingLeaves}
              action={
                <Link to={PATHS.warden.leaveRequests} className="text-sm font-medium text-primary">
                  Review
                </Link>
              }
            />
          </div>

          <Card>
            <CardHeader
              title="Recent Notices"
              action={
                <Link to={PATHS.warden.notices} className="text-sm font-medium text-primary">
                  View All
                </Link>
              }
            />
            <ul className="space-y-3">
              {data.recentNotices.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <Link to={`${PATHS.warden.notices}/${item.id}`} className="min-w-0">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="typo-helper mt-0.5">{item.date}</p>
                  </Link>
                  {item.isNew ? <Badge variant="warning">New</Badge> : null}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
