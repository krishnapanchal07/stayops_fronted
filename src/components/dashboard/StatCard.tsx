import { Card } from '@/components/common/Card';
import type { StatMetric } from '@/types/dashboard';
import { cn } from '@/utils/cn';
import {
  AlertTriangle,
  Banknote,
  BedDouble,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FolderOpen,
  Layers,
  Shield,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const toneClasses = {
  primary: 'bg-primary-soft text-primary',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

const iconById: Record<string, LucideIcon> = {
  properties: Building2,
  tenants: Users,
  rooms: DoorOpen,
  room: BedDouble,
  revenue: Banknote,
  collection: Banknote,
  month: CreditCard,
  due: CreditCard,
  overdue: AlertTriangle,
  complaints: AlertTriangle,
  notices: Bell,
  documents: FolderOpen,
  today: UserPlus,
  expected: UserPlus,
  visitors: UserPlus,
  inside: Shield,
  passes: ClipboardList,
  assigned: Wrench,
  new: ClipboardList,
  progress: Wrench,
  urgent: AlertTriangle,
  done: ClipboardList,
  occupancy: BedDouble,
  leaves: ClipboardList,
  beds: BedDouble,
  available: DoorOpen,
  active: Building2,
  buildings: Building2,
  floors: Layers,
};

interface StatCardProps {
  metric: StatMetric;
}

export function StatCard({ metric }: StatCardProps) {
  const Icon = iconById[metric.id] ?? ClipboardList;
  const TrendIcon =
    metric.trend?.direction === 'down'
      ? TrendingDown
      : metric.trend?.direction === 'up'
        ? TrendingUp
        : null;

  return (
    <Card>
      <div className="flex items-start gap-4">
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
            toneClasses[metric.tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="typo-muted">{metric.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-text">{metric.value}</p>
          {metric.trend ? (
            <p
              className={cn(
                'mt-1 inline-flex items-center gap-1 text-xs font-medium',
                metric.trend.direction === 'down' ? 'text-danger' : 'text-success',
              )}
            >
              {TrendIcon ? <TrendIcon className="h-3.5 w-3.5" /> : null}
              {metric.trend.label}
            </p>
          ) : metric.hint ? (
            <p className="typo-helper mt-1">{metric.hint}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
