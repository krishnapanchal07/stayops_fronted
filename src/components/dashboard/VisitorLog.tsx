import { Card, CardHeader } from '@/components/common/Card';
import type { VisitorLogItem } from '@/types/dashboard';
import type { ReactNode } from 'react';

interface VisitorLogProps {
  title: string;
  items: VisitorLogItem[];
  action?: ReactNode;
}

export function VisitorLog({ title, items, action }: VisitorLogProps) {
  return (
    <Card>
      <CardHeader title={title} action={action} />
      <ul className="space-y-3">
        {items.length === 0 ? <li className="typo-helper">No visitors in this list.</li> : null}
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text">{item.name}</p>
              <p className="typo-helper">{item.tenant}</p>
            </div>
            <div className="text-right">
              <p className="typo-helper">{item.time}</p>
              <p className="mt-1 text-xs font-medium text-muted">{item.gate}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
