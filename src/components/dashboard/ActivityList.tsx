import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { ActivityItem } from '@/types/dashboard';
import type { ReactNode } from 'react';

interface ActivityListProps {
  title: string;
  items: ActivityItem[];
  action?: ReactNode;
  emptyTitle?: string;
}

export function ActivityList({ title, items, action, emptyTitle }: ActivityListProps) {
  return (
    <Card>
      <CardHeader title={title} action={action} />
      {items.length === 0 ? (
        <EmptyState title={emptyTitle ?? 'Nothing here yet'} />
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">{item.title}</p>
                <p className="typo-helper mt-0.5">{item.detail}</p>
              </div>
              <span className="typo-muted shrink-0">{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
