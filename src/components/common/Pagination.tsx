import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function getVisiblePages(page: number, pageCount: number): number[] {
  const pages = new Set<number>([1, pageCount, page, page - 1, page + 1]);
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = getVisiblePages(page, pageCount);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="typo-helper">
        Showing {start} to {end} of {total} results
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          label="Previous page"
          size="sm"
          variant="ghost"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </IconButton>
        {pages.map((value, index) => {
          const previous = pages[index - 1];
          return (
            <span key={value} className="flex items-center">
              {previous && value - previous > 1 ? (
                <span className="px-1 text-muted">…</span>
              ) : null}
              <button
                type="button"
                className={cn(
                  'h-8 min-w-8 rounded-lg px-2 text-sm',
                  value === page
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-background',
                )}
                onClick={() => onPageChange(value)}
                aria-current={value === page ? 'page' : undefined}
              >
                {value}
              </button>
            </span>
          );
        })}
        <IconButton
          label="Next page"
          size="sm"
          variant="ghost"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}
