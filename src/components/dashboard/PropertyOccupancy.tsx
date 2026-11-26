import { Card, CardHeader } from '@/components/common/Card';
import type { PropertyOccupancy as PropertyOccupancyRow } from '@/types/dashboard';

interface PropertyOccupancyProps {
  items: PropertyOccupancyRow[];
}

export function PropertyOccupancy({ items }: PropertyOccupancyProps) {
  return (
    <Card>
      <CardHeader title="Occupancy by Property" />
      <ul className="space-y-4">
        {items.map((item) => {
          const percent = item.total ? Math.round((item.occupied / item.total) * 100) : 0;
          return (
            <li key={item.id}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-text">{item.name}</span>
                <span className="typo-muted">
                  {item.occupied}/{item.total} · {percent}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
