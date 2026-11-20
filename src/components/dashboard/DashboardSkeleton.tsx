import { Card } from '@/components/common/Card';
import { Skeleton } from '@/components/feedback/Skeleton';

interface DashboardSkeletonProps {
  cards?: number;
}

export function DashboardSkeleton({ cards = 4 }: DashboardSkeletonProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <Card key={index}>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-52 w-full" />
        </Card>
        <Card>
          <Skeleton className="mb-4 h-5 w-40" />
          <Skeleton className="h-52 w-full" />
        </Card>
      </div>
    </div>
  );
}
