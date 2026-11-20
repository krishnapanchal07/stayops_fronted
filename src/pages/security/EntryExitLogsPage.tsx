import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { EntryExitTable } from '@/components/security/EntryExitTable';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PATHS } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { visitorService } from '@/services/visitor/visitorService';
import { ENTRY_EXIT_STATUS_LABELS, EntryExitKind, EntryExitStatus, type EntryExitFilters } from '@/types/entryExit';
import { emptyEntryExitFilters, filterEntryExitLogs } from '@/utils/entryExitRules';
import { useCallback, useMemo, useState } from 'react';

export function EntryExitLogsPage() {
  const user = useCurrentUser();
  const propertyIds = user?.propertyIds;
  const logsLoader = useCallback(() => visitorService.getEntryExitLogs(emptyEntryExitFilters(), propertyIds), [propertyIds]);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const { data, status, error, reload } = useAsyncResource(logsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const [filters, setFilters] = useState<EntryExitFilters>(emptyEntryExitFilters());
  const logs = useMemo(() => filterEntryExitLogs(data ?? [], filters), [data, filters]);

  return (
    <div>
      <PageHeader
        title="Entry / Exit Logs"
        description="Operational history for visitor movement and student leave."
        breadcrumbs={[{ label: 'Home', href: PATHS.security.dashboard }, { label: 'Entry / Exit Logs' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load logs.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Property"
              name="propertyId"
              value={filters.propertyId}
              options={[
                { value: '', label: 'All properties' },
                ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
            />
            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={[
                { value: '', label: 'All statuses' },
                ...Object.values(EntryExitStatus).map((value) => ({ value, label: ENTRY_EXIT_STATUS_LABELS[value] })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value as EntryExitFilters['status'] }))
              }
            />
            <Select
              label="Kind"
              name="kind"
              value={filters.kind}
              options={[
                { value: '', label: 'All movements' },
                { value: EntryExitKind.VISITOR, label: 'Visitor' },
                { value: EntryExitKind.LEAVE, label: 'Leave' },
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, kind: event.target.value as EntryExitFilters['kind'] }))
              }
            />
            <SearchInput
              value={filters.query}
              placeholder="Search visitor, tenant, pass code"
              aria-label="Search logs"
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
            <DateInput
              label="From"
              name="fromDate"
              value={filters.fromDate}
              onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
            />
            <DateInput
              label="To"
              name="toDate"
              value={filters.toDate}
              onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
            />
          </div>

          {logs.length === 0 ? (
            <EmptyState title="No entry / exit records." description="Try adjusting your filters." />
          ) : (
            <EntryExitTable logs={logs} />
          )}
        </div>
      ) : null}
    </div>
  );
}
