import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { VisitorLog } from '@/components/dashboard/VisitorLog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import { ClipboardCheck, LogIn, LogOut, Users } from 'lucide-react';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';

const actions = [
  { id: 'verify', label: 'Verify Visitor', path: PATHS.security.checkIn, icon: LogIn },
  { id: 'checkout', label: 'Check-Out Visitor', path: PATHS.security.checkOut, icon: LogOut },
  { id: 'gate', label: 'Verify Gate Pass', path: PATHS.security.gatePasses, icon: ClipboardCheck },
  { id: 'inside', label: 'Currently Inside', path: PATHS.security.checkOut, icon: Users },
] as const;

export function SecurityDashboardPage() {
  const user = useCurrentUser();
  const propertyIds = user?.propertyIds;
  const loader = useCallback(() => dashboardService.getSecurityDashboard(propertyIds), [propertyIds]);
  const { data, status, error, reload } = useAsyncResource(loader);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visitor movement, expected arrivals, and gate-pass activity for today."
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.id}
                  to={action.path}
                  className="flex min-h-24 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-5 shadow-sm hover:border-primary hover:bg-primary-soft"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="text-base font-semibold text-text">{action.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((metric) => (
              <StatCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <VisitorLog
              title="Recent Check-ins"
              items={data.recentCheckIns}
              action={
                <Link to={PATHS.security.checkIn} className="text-sm font-medium text-primary">
                  Check In
                </Link>
              }
            />
            <VisitorLog
              title="Recent Check-outs"
              items={data.recentCheckOuts}
              action={
                <Link to={PATHS.security.checkOut} className="text-sm font-medium text-primary">
                  Check Out
                </Link>
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
