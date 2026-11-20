import { Card, CardHeader } from '@/components/common/Card';
import { colorTokens } from '@/constants/tokens';
import type { ChartPoint } from '@/types/dashboard';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface TrendChartProps {
  title: string;
  data: ChartPoint[];
}

export function TrendChart({ title, data }: TrendChartProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={colorTokens.border} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: colorTokens.muted, fontSize: 12 }} axisLine={false} />
            <YAxis
              tick={{ fill: colorTokens.muted, fontSize: 12 }}
              axisLine={false}
              tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            />
            <Tooltip
              formatter={(value) => [
                typeof value === 'number' ? value.toLocaleString('en-IN') : String(value ?? ''),
                'Amount',
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colorTokens.primary}
              strokeWidth={3}
              dot={{ r: 4, fill: colorTokens.primary, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
