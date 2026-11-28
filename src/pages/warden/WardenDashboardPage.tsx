import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { OccupancyChart } from '@/components/dashboard/OccupancyChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

export function WardenDashboardPage() {
  const loader = useCallback(() => dashboardService.getWardenDashboard(), []);
  const { data, status, error, reload } = useAsyncResource(loader);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Occupancy and complaints at your assigned properties."
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
          </div>
          <Link to={PATHS.warden.complaints} className="text-sm font-medium text-primary">View complaints</Link>
        </div>
      ) : null}
    </div>
  );
}
