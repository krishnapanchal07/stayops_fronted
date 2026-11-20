import { Card } from '@/components/common/Card';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DataTable } from '@/components/tables/DataTable';
import { ENTRY_EXIT_STATUS_LABELS, type EntryExitLog } from '@/types/entryExit';
import type { DataTableColumn } from '@/types/ui';
import { formatDateTime } from '@/utils/format';

interface EntryExitTableProps {
  logs: EntryExitLog[];
}

export function EntryExitTable({ logs }: EntryExitTableProps) {
  const columns: DataTableColumn<EntryExitLog>[] = [
    { id: 'person', header: 'Visitor / Tenant', accessor: 'personName', sortable: true },
    { id: 'tenant', header: 'Host / Tenant', accessor: 'tenantName', sortable: true },
    { id: 'room', header: 'Room', accessor: 'roomNumber', sortable: true },
    { id: 'property', header: 'Property', accessor: 'propertyName', sortable: true },
    {
      id: 'entry',
      header: 'Entry',
      accessor: 'entryAt',
      sortable: true,
      render: (row) => formatDateTime(row.entryAt),
    },
    {
      id: 'exit',
      header: 'Exit',
      accessor: 'exitAt',
      sortable: true,
      render: (row) => formatDateTime(row.exitAt ?? row.returnAt),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusPill value={ENTRY_EXIT_STATUS_LABELS[row.status]} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={logs}
      rowKey={(row) => row.id}
      emptyTitle="No entry / exit records."
      emptyDescription="Movement history will appear after check-in, check-out, exit, or return."
      renderMobile={(row) => (
        <Card>
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-text">{row.personName}</p>
                <p className="typo-helper">
                  {row.tenantName} · Room {row.roomNumber}
                </p>
              </div>
              <StatusPill value={ENTRY_EXIT_STATUS_LABELS[row.status]} />
            </div>
            <p className="text-sm text-muted">Entry {formatDateTime(row.entryAt)}</p>
            <p className="text-sm text-muted">Exit {formatDateTime(row.exitAt ?? row.returnAt)}</p>
          </div>
        </Card>
      )}
    />
  );
}
