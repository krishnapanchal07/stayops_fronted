import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LayoutDashboard } from 'lucide-react';

interface RoleDashboardPlaceholderProps {
  title: string;
  description: string;
}

export function RoleDashboardPlaceholder({ title, description }: RoleDashboardPlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card padding={false}>
        <EmptyState
          title="Dashboard data comes in Part 3"
          description="This route exists so role-specific layout, sidebar, and breadcrumbs can be verified now."
          icon={<LayoutDashboard className="h-8 w-8" />}
        />
      </Card>
    </div>
  );
}
