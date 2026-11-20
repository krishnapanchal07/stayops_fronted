import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';
import { breadcrumbsFromPath } from '@/utils/breadcrumbs';
import { useLocation } from 'react-router-dom';

export function ModulePlaceholderPage() {
  const location = useLocation();
  const crumbs = breadcrumbsFromPath(location.pathname);
  const title = crumbs[crumbs.length - 1]?.label ?? 'Module';

  return (
    <div>
      <PageHeader
        title={title}
        description="This module is a route placeholder. Business screens arrive in later phases."
      />
      <Card padding={false}>
        <EmptyState
          title={`${title} is not built yet`}
          description="Phase 1 Part 1 only establishes layout, routing, and the design system. Module workflows start in Phase 2."
        />
      </Card>
    </div>
  );
}
