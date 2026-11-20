import { Card, CardHeader } from '@/components/common/Card';
import { colorTokens } from '@/constants/tokens';
import type { OccupancySlice } from '@/types/dashboard';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

interface OccupancyChartProps {
  percent: number;
  occupied: number;
  vacant: number;
  slices: OccupancySlice[];
}

export function OccupancyChart({ percent, occupied, vacant, slices }: OccupancyChartProps) {
  return (
    <Card>
      <CardHeader title="Occupancy Overview" />
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-52 w-full max-w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={84}
                paddingAngle={3}
                stroke="none"
              >
                <Cell fill={colorTokens.primary} />
                <Cell fill={colorTokens.primaryMuted} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-text">{percent}%</p>
            <p className="typo-muted">Occupied</p>
          </div>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Occupied <span className="font-semibold text-text">{occupied}</span>
          </li>
          <li className="flex items-center gap-2 text-muted">
            <span className="h-2.5 w-2.5 rounded-full bg-primary-muted" />
            Vacant <span className="font-semibold text-text">{vacant}</span>
          </li>
        </ul>
      </div>
    </Card>
  );
}
