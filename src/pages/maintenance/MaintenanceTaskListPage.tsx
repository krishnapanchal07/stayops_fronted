import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { TextInput } from '@/components/forms/TextInput';
import { useFinanceTable } from '@/hooks/useFinanceTable';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import {
  PATHS,
  adminMaintenanceTaskDetailPath,
  maintenanceTaskDetailPath,
} from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { COMPLAINT_PRIORITY_LABELS, ComplaintPriority } from '@/types/complaint';
import { MAINTENANCE_STATUS_LABELS, MaintenanceStatus, type MaintenanceFilters, type MaintenanceTask } from '@/types/maintenance';
import type { DataTableColumn } from '@/types/ui';
import { emptyMaintenanceFilters } from '@/utils/maintenanceRules';
import { formatDateTime, formatShortDate } from '@/utils/format';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function taskHref(pathname: string, id: string): string {
  return pathname.startsWith('/admin') ? adminMaintenanceTaskDetailPath(id) : maintenanceTaskDetailPath(id);
}

export function MaintenanceTaskListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isHistory = location.pathname.includes('history');
  const isAssigned = location.pathname.includes('assigned-complaints');
  const homeHref = isAdmin ? PATHS.admin.dashboard : PATHS.maintenance.dashboard;
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const { data: properties } = useAsyncResource(propertiesLoader);

  const [filters, setFilters] = useState<MaintenanceFilters>(() => {
    const base = emptyMaintenanceFilters();
    if (isHistory) return { ...base, status: MaintenanceStatus.COMPLETED };
    if (isAssigned) return { ...base, status: MaintenanceStatus.ASSIGNED };
    return base;
  });

  const table = useFinanceTable<MaintenanceTask>('/maintenance/tasks', { ...filters });
  const { status, error, reload } = table;

  const title = isHistory ? 'Maintenance History' : isAssigned ? 'Assigned Complaints' : 'Maintenance Tasks';

  const columns: DataTableColumn<MaintenanceTask>[] = [
    {
      id: 'code',
      header: 'Task ID',
      accessor: 'taskCode',
      sortable: true,
      render: (row) => <span className="font-semibold">{row.taskCode}</span>,
    },
    { id: 'issue', header: 'Issue', accessor: 'title', sortable: true },
    { id: 'complaint', header: 'Complaint', accessor: 'complaintCode', sortable: true },
    { id: 'room', header: 'Room', accessor: 'roomNumber', sortable: true },
    {
      id: 'priority',
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => <StatusPill value={COMPLAINT_PRIORITY_LABELS[row.priority]} />,
    },
    {
      id: 'due',
      header: 'Due',
      accessor: 'dueDate',
      sortable: true,
      render: (row) => formatDateTime(row.dueDate),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusPill value={MAINTENANCE_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => navigate(taskHref(location.pathname, row.id))}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        description="Work orders created from tenant complaints."
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: title }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load maintenance tasks.'} onRetry={reload} />
      ) : null}

      {status !== 'error' ? (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={[
                { value: '', label: 'All statuses' },
                ...Object.values(MaintenanceStatus).map((value) => ({
                  value,
                  label: MAINTENANCE_STATUS_LABELS[value],
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value as MaintenanceFilters['status'] }))
              }
            />
            <Select
              label="Priority"
              name="priority"
              value={filters.priority}
              options={[
                { value: '', label: 'All priorities' },
                ...Object.values(ComplaintPriority).map((value) => ({
                  value,
                  label: COMPLAINT_PRIORITY_LABELS[value],
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, priority: event.target.value as MaintenanceFilters['priority'] }))
              }
            />
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
            <DateInput
              label="From"
              name="fromDate"
              value={filters.fromDate}
              onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
            />
          </div>

          <TextInput name="taskSearch" label="Search tasks" value={table.search} onChange={(event) => table.setSearch(event.target.value)} />
            <DataTable
              columns={columns}
              data={table.data?.items ?? []}
              {...table.tableProps}
              rowKey={(row) => row.id}
              searchPlaceholder="Search task ID, complaint, room"
              emptyTitle={isAdmin ? 'No tasks found.' : 'No tasks assigned.'}
              emptyDescription={isAdmin ? 'Try adjusting your filters.' : "You're all caught up."}
              renderMobile={(row) => (
                <Card>
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="font-semibold">{row.title}</p>
                      <p className="typo-helper mt-0.5">
                        {row.taskCode} · Room {row.roomNumber}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill value={COMPLAINT_PRIORITY_LABELS[row.priority]} />
                      <StatusPill value={MAINTENANCE_STATUS_LABELS[row.status]} />
                    </div>
                    <p className="typo-helper">Due {formatShortDate(row.dueDate.slice(0, 10))}</p>
                    <Button size="sm" variant="outline" onClick={() => navigate(taskHref(location.pathname, row.id))}>
                      View
                    </Button>
                  </div>
                </Card>
              )}
            />
        </div>
      ) : null}
    </div>
  );
}
