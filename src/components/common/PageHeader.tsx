import { Breadcrumb } from '@/components/common/Breadcrumb';
import { Button } from '@/components/ui/Button';
import type { BreadcrumbItem } from '@/types/ui';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  showBack?: boolean;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  showBack,
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 [overflow-wrap:anywhere]">
        <Breadcrumb items={breadcrumbs} />
        <h1 className="typo-page-title mt-2">{title}</h1>
        {description ? <p className="typo-secondary mt-1">{description}</p> : null}
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 px-0"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
