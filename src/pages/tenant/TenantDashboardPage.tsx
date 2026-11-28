import { Card, CardHeader } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { dashboardService } from '@/services/dashboard/dashboardService';
import type { TenantDashboardData } from '@/types/dashboard';
import { formatINR, greetingForHour } from '@/utils/format';
import { BedDouble, Bell, CalendarClock, CreditCard, MessageSquareWarning, Search, UserPlus } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const STAT_LINKS: Record<string, string> = {
  room: PATHS.tenant.myRoom,
  notices: PATHS.tenant.notices,
  due: PATHS.tenant.payments,
  complaints: PATHS.tenant.complaints,
};

const quickActions = [
  { id: 'my-room', label: 'My Room', icon: BedDouble, path: PATHS.tenant.myRoom },
  { id: 'notices', label: 'Notices', icon: Bell, path: PATHS.tenant.notices },
  { id: 'find-room', label: 'Find Room', icon: Search, path: PATHS.tenant.findRoom },
  { id: 'pay', label: 'Pay Rent', icon: CreditCard, path: PATHS.tenant.payments },
  { id: 'complaint', label: 'Raise Complaint', icon: MessageSquareWarning, path: PATHS.tenant.complaints },
  { id: 'visitor', label: 'Add Visitor', icon: UserPlus, path: PATHS.tenant.visitors },
  { id: 'leave', label: 'Apply Leave', icon: CalendarClock, path: PATHS.tenant.leave },
] as const;

export function TenantDashboardPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const userId = user?.id ?? '';
  const loader = useCallback(async (): Promise<TenantDashboardData> => {
    if (!userId) return Promise.reject(new Error('Unable to load dashboard.'));
    return dashboardService.getTenantDashboard(userId);
  }, [userId]);
  const { data, status, error, reload } = useAsyncResource(loader);

  const paidPercent = data?.rent.total ? Math.min(100,Math.round((data.rent.paid+data.rent.testPaid)/data.rent.total*100)) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="typo-page-title">
          {greetingForHour()}, {user?.name.split(' ')[0] ?? 'there'} 👋
        </h1>
        <p className="typo-secondary mt-1">Here’s what’s happening with your stay today.</p>
      </div>

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && data ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((metric) => {
              const href = STAT_LINKS[metric.id];
              return href ? (
                <Link key={metric.id} to={href} className="block hover:opacity-95">
                  <StatCard metric={metric} />
                </Link>
              ) : (
                <StatCard key={metric.id} metric={metric} />
              );
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Rent Overview" />
              <p className="typo-helper mb-4">Invoice totals and payment balances come from your saved financial records.</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="typo-muted">Total Rent</p>
                  <p className="mt-1 font-semibold">{formatINR(data.rent.total)}</p>
                </div>
                <div>
                  <p className="typo-muted">Actually Paid</p>
                  <p className="mt-1 font-semibold text-success">{formatINR(data.rent.paid)}</p>
                </div>
                <div>
                  <p className="typo-muted">Due</p>
                  <p className="mt-1 font-semibold text-danger">{formatINR(data.rent.due)}</p>
                </div>
              </div>
              {data.rent.testPaid > 0 ? <p className="typo-helper mt-2">Test Mode applied this month: {formatINR(data.rent.testPaid)}</p> : null}
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: `${paidPercent}%` }} />
              </div>
              <p className="typo-helper mt-2">Due date {data.rent.dueDate}</p>
              <Button className="mt-5" fullWidth onClick={() => navigate(PATHS.tenant.payments)}>
                View Payments
              </Button>
            </Card>

            <Card>
              <CardHeader title="Quick Actions" />
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.id}
                      to={action.path}
                      className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background px-3 py-4 text-center hover:border-primary hover:bg-primary-soft"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium text-text">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Upcoming Payments"
                action={
                  <Link to={PATHS.tenant.payments} className="text-sm font-medium text-primary">
                    View All
                  </Link>
                }
              />
              {data.upcomingPayments.length===0 ? <p className="typo-secondary">No outstanding invoices.</p> : null}
              <ul className="space-y-3">
                {data.upcomingPayments.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="typo-helper">{item.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatINR(item.amount)}</p>
                      <StatusPill value={item.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader
                title="Recent Notices"
                action={
                  <Link to={PATHS.tenant.notices} className="text-sm font-medium text-primary">
                    View All
                  </Link>
                }
              />
              <p className="typo-secondary">Notices are not connected to your tenant profile yet.</p>
              <ul className="space-y-3">
                {data.recentNotices.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3">
                    <Link to={`${PATHS.tenant.notices}/${item.id}`} className="min-w-0">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="typo-helper">{item.date}</p>
                    </Link>
                    {item.isNew ? <Badge variant="warning">New</Badge> : null}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
