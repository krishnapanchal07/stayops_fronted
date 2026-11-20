interface OccupancyIndicatorProps {
  percent: number;
  occupied: number;
  capacity: number;
}

export function OccupancyIndicator({ percent, occupied, capacity }: OccupancyIndicatorProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-text">{percent}%</span>
        <span className="typo-muted">
          {occupied} / {capacity}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-primary-soft">
        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}
