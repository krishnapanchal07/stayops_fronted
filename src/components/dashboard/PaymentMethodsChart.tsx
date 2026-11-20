import { Card, CardHeader } from '@/components/common/Card';
import type { PaymentMethodShare } from '@/types/dashboard';

interface PaymentMethodsChartProps {
  items: PaymentMethodShare[];
}

export function PaymentMethodsChart({ items }: PaymentMethodsChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader title="Payment Methods" />
      <ul className="space-y-4">
        {items.map((item) => {
          const percent = total === 0 ? 0 : Math.round((item.value / total) * 100);
          return (
            <li key={item.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-text">{item.name}</span>
                <span className="typo-muted">{percent}%</span>
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
