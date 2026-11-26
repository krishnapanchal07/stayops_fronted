import { useCallback, useEffect, useState } from 'react';
import { useAsyncResource } from './useAsyncResource';
import { financePage, type FinanceQuery } from '@/services/finance/api';

export function useFinanceTable<T>(kind: string, filters: FinanceQuery) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ id: 'createdAt', direction: 'desc' as 'asc' | 'desc' });
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const key = JSON.stringify({ ...filters, query, sortBy: sort.id, sortDirection: sort.direction });
  const [paging, setPaging] = useState({ key: '', page: 1 });
  const page = paging.key === key ? paging.page : 1;
  const requestKey = `${key}:${page}`;
  const loader = useCallback(
    async () => ({
      key: requestKey,
      page: await financePage<T>(kind, { ...JSON.parse(key), offset: (page - 1) * 20, limit: 20 }),
    }),
    [kind, key, page, requestKey],
  );
  const resource = useAsyncResource(loader);
  const current = resource.data?.key === requestKey ? resource.data.page : null;
  return {
    ...resource,
    data: current,
    search,
    setSearch,
    tableProps: {
      isLoading: resource.status !== 'error' && !current,
      searchable: false,
      serverPagination: {
        page,
        pageSize: 20,
        total: current?.total ?? 0,
        onPageChange: (next: number) => setPaging({ key, page: next }),
      },
      serverSorting: {
        ...sort,
        onSort: (id: string, direction: 'asc' | 'desc') => setSort({ id, direction }),
      },
    },
  };
}
