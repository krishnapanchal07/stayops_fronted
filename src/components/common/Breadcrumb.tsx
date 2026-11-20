import type { BreadcrumbItem } from '@/types/ui';
import { breadcrumbsFromPath } from '@/utils/breadcrumbs';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();
  const crumbs = items ?? breadcrumbsFromPath(location.pathname);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((item, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link to={item.href} className="text-muted hover:text-primary">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-text' : 'text-muted'}>{item.label}</span>
              )}
              {!isLast ? <ChevronRight className="h-3.5 w-3.5 text-muted" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
