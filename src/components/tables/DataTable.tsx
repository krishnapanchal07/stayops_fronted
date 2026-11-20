import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Pagination } from '@/components/common/Pagination';
import { SearchInput } from '@/components/forms/SearchInput';
import type { DataTableColumn } from '@/types/ui';
import { cn } from '@/utils/cn';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  pageSize?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  renderMobile?: (row: T) => ReactNode;
}

type SortDirection = 'asc' | 'desc';

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder = 'Search…',
  searchFilter,
  pageSize = 6,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle,
  emptyDescription,
  renderMobile,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortId, setSortId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data;

    return data.filter((row) => {
      if (searchFilter) {
        return searchFilter(row, normalized);
      }

      return columns.some((column) => {
        if (!column.accessor) return false;
        return String(row[column.accessor]).toLowerCase().includes(normalized);
      });
    });
  }, [columns, data, query, searchFilter]);

  const sorted = useMemo(() => {
    if (!sortId) return filtered;
    const column = columns.find((item) => item.id === sortId);
    if (!column?.accessor) return filtered;

    return [...filtered].sort((a, b) => {
      const result = compareValues(a[column.accessor!], b[column.accessor!]);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [columns, filtered, sortDirection, sortId]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable) return;
    if (sortId !== column.id) {
      setSortId(column.id);
      setSortDirection('asc');
      return;
    }
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {searchable ? (
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
            />
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <LoadingSpinner label="Loading table data" />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : pageRows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className={cn('overflow-x-auto', renderMobile && 'hidden md:block')}>
          <table className="min-w-full text-left">
            <thead className="bg-background">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      'typo-muted px-4 py-3 font-semibold tracking-wide uppercase',
                      column.className,
                    )}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-text"
                        onClick={() => toggleSort(column)}
                      >
                        {column.header}
                        {sortId !== column.id ? (
                          <ArrowUpDown className="h-3.5 w-3.5" />
                        ) : sortDirection === 'asc' ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-border">
                  {columns.map((column) => (
                    <td key={column.id} className={cn('typo-table px-4 py-3', column.className)}>
                      {column.render
                        ? column.render(row)
                        : column.accessor
                          ? String(row[column.accessor] ?? '')
                          : null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && pageRows.length > 0 && renderMobile ? (
        <div className="space-y-3 p-4 md:hidden">
          {pageRows.map((row) => (
            <div key={rowKey(row)}>{renderMobile(row)}</div>
          ))}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
