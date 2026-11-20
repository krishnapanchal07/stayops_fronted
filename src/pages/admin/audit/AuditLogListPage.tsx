import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { ROLE_LABELS, RoleCode } from '@/constants/roles';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { PATHS, auditLogDetailPath } from '@/routes/paths';
import { auditService, emptyAuditFilters, filterAuditLogs } from '@/services/audit/auditService';
import { propertyService } from '@/services/property/propertyService';
import {
  AUDIT_ACTION_LABELS,
  AUDIT_RESOURCE_LABELS,
  AuditAction,
  AuditResourceType,
  type AuditFilters,
  type AuditLog,
} from '@/types/audit';
import type { DataTableColumn } from '@/types/ui';
import { formatDateTime } from '@/utils/format';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuditLogListPage() {
  const navigate = useNavigate();
  const logsLoader = useCallback(() => auditService.getAuditLogs(), []);
  const summaryLoader = useCallback(() => auditService.getAuditSummary(), []);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const { data, status, error, reload } = useAsyncResource(logsLoader);
  const { data: summary } = useAsyncResource(summaryLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const [filters, setFilters] = useState<AuditFilters>(emptyAuditFilters());

  const logs = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterAuditLogs(logs, filters), [filters, logs]);
  const actors = useMemo(
    () =>
      [...new Map(logs.map((log) => [log.actorId, { id: log.actorId, name: log.actorName }])).values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      ),
    [logs],
  );
  const filtersActive = Object.values(filters).some(Boolean);

  const columns: DataTableColumn<AuditLog>[] = [
    {
      id: 'time',
      header: 'Time',
      accessor: 'timestamp',
      sortable: true,
      render: (row) => formatDateTime(row.timestamp),
    },
    {
      id: 'actor',
      header: 'Actor',
      accessor: 'actorName',
      sortable: true,
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'actorRole',
      render: (row) => ROLE_LABELS[row.actorRole],
    },
    {
      id: 'action',
      header: 'Action',
      accessor: 'action',
      render: (row) => <StatusPill value={AUDIT_ACTION_LABELS[row.action]} />,
    },
    {
      id: 'resource',
      header: 'Resource',
      accessor: 'resourceLabel',
      render: (row) => (
        <div>
          <p className="font-medium text-text">{row.resourceLabel}</p>
          <p className="typo-helper">{AUDIT_RESOURCE_LABELS[row.resourceType]}</p>
        </div>
      ),
    },
    { id: 'description', header: 'Description', accessor: 'description' },
    {
      id: 'property',
      header: 'Property',
      accessor: 'propertyName',
      render: (row) => row.propertyName ?? '—',
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => navigate(auditLogDetailPath(row.id))}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Track important actions performed across StayOps."
        breadcrumbs={[{ label: 'Home', href: PATHS.admin.dashboard }, { label: 'Audit Logs' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load audit logs.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'today', label: "Today's Actions", value: String(summary?.today ?? 0), tone: 'primary' }} />
            <StatCard metric={{ id: 'logins', label: 'Logins', value: String(summary?.logins ?? 0), tone: 'info' }} />
            <StatCard metric={{ id: 'updates', label: 'Updates', value: String(summary?.updates ?? 0), tone: 'warning' }} />
            <StatCard metric={{ id: 'critical', label: 'Critical Actions', value: String(summary?.critical ?? 0), tone: 'danger' }} />
          </div>

          <Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SearchInput
                value={filters.query}
                onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
                placeholder="Search actor, resource, description, ID"
                aria-label="Search audit logs"
              />
              <Select
                name="actor"
                value={filters.actorId}
                options={[
                  { label: 'All actors', value: '' },
                  ...actors.map((actor) => ({ value: actor.id, label: actor.name })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, actorId: event.target.value }))}
              />
              <Select
                name="role"
                value={filters.role}
                options={[
                  { label: 'All roles', value: '' },
                  ...Object.values(RoleCode).map((value) => ({ value, label: ROLE_LABELS[value] })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value as AuditFilters['role'] }))}
              />
              <Select
                name="action"
                value={filters.action}
                options={[
                  { label: 'All actions', value: '' },
                  ...Object.values(AuditAction).map((value) => ({ value, label: AUDIT_ACTION_LABELS[value] })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value as AuditFilters['action'] }))}
              />
              <Select
                name="resource"
                value={filters.resourceType}
                options={[
                  { label: 'All resources', value: '' },
                  ...Object.values(AuditResourceType).map((value) => ({
                    value,
                    label: AUDIT_RESOURCE_LABELS[value],
                  })),
                ]}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, resourceType: event.target.value as AuditFilters['resourceType'] }))
                }
              />
              <Select
                name="property"
                value={filters.propertyId}
                options={[
                  { label: 'All properties', value: '' },
                  ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
                ]}
                onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
              />
              <DateInput
                name="fromDate"
                value={filters.fromDate}
                onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
              />
              <DateInput
                name="toDate"
                value={filters.toDate}
                onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
              />
            </div>
            <div className="mt-3">
              <Button variant="outline" onClick={() => setFilters(emptyAuditFilters())} disabled={!filtersActive}>
                Clear Filters
              </Button>
            </div>
          </Card>

          <DataTable
            columns={columns}
            data={filtered}
            rowKey={(row) => row.id}
            searchable={false}
            pageSize={10}
            emptyTitle="No audit records found."
            emptyDescription="Try a different search or filter."
            renderMobile={(row) => (
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="font-semibold text-text">{row.actorName}</p>
                <p className="typo-helper">{formatDateTime(row.timestamp)}</p>
                <p className="mt-2 text-sm">{row.description}</p>
                <Button className="mt-3" size="sm" onClick={() => navigate(auditLogDetailPath(row.id))}>
                  View Details
                </Button>
              </div>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
