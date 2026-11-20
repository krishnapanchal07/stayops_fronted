import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { financeHomePath, invoiceDetailPath, scopeFromPath } from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import { INVOICE_STATUS_LABELS, InvoiceStatus, type Invoice } from '@/types/finance';
import type { DataTableColumn } from '@/types/ui';
import { formatINR, formatShortDate } from '@/utils/format';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type OutstandingRow = Invoice & { daysOverdue: number };

export function OutstandingDuesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const scope = scopeFromPath(location.pathname);
  const canRecord = useHasPermission(Permission.PAYMENT_CREATE);

  const duesLoader = useCallback(() => financeService.getOutstandingDues(), []);
  const invoicesLoader = useCallback(() => financeService.getInvoices(), []);
  const tenantsLoader = useCallback(() => tenantService.getTenants(), []);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const dueTodayLoader = useCallback(() => financeService.getDueToday(), []);
  const { data, status, error, reload } = useAsyncResource(duesLoader);
  const { data: invoices, reload: reloadInvoices } = useAsyncResource(invoicesLoader);
  const { data: tenants } = useAsyncResource(tenantsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: dueToday, reload: reloadDueToday } = useAsyncResource(dueTodayLoader);

  const [propertyId, setPropertyId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [presetInvoiceId, setPresetInvoiceId] = useState('');
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = rows.filter((row) => {
    if (propertyId && row.propertyId !== propertyId) return false;
    if (statusFilter && row.status !== statusFilter) return false;
    return true;
  });
  const overdueRows = rows.filter((row) => row.status === InvoiceStatus.OVERDUE);
  const totalOutstanding = rows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const totalOverdue = overdueRows.reduce((sum, row) => sum + row.outstandingAmount, 0);
  const accountsOverdue = new Set(overdueRows.map((row) => row.tenantId)).size;

  const columns: DataTableColumn<OutstandingRow>[] = [
    { id: 'tenantName', header: 'Tenant', accessor: 'tenantName', sortable: true },
    { id: 'roomNumber', header: 'Room', accessor: 'roomNumber', render: (row) => row.roomNumber ?? '—' },
    { id: 'propertyName', header: 'Property', accessor: 'propertyName', sortable: true },
    { id: 'invoiceNumber', header: 'Invoice', accessor: 'invoiceNumber', sortable: true },
    { id: 'total', header: 'Total', accessor: 'total', render: (row) => formatINR(row.total) },
    { id: 'paidAmount', header: 'Paid', accessor: 'paidAmount', render: (row) => formatINR(row.paidAmount) },
    { id: 'outstandingAmount', header: 'Outstanding', accessor: 'outstandingAmount', render: (row) => formatINR(row.outstandingAmount) },
    { id: 'dueDate', header: 'Due date', accessor: 'dueDate', sortable: true, render: (row) => formatShortDate(row.dueDate) },
    { id: 'daysOverdue', header: 'Days overdue', accessor: 'daysOverdue', sortable: true },
    { id: 'status', header: 'Status', accessor: 'status', render: (row) => <StatusPill value={INVOICE_STATUS_LABELS[row.status]} /> },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => navigate(invoiceDetailPath(scope === 'tenant' ? 'admin' : scope, row.id))}>
            View
          </Button>
          {canRecord ? (
            <Button
              size="sm"
              onClick={() => {
                setPresetInvoiceId(row.id);
                setRecordOpen(true);
              }}
            >
              Collect
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Outstanding Dues"
        description="Accounts that still owe rent, utilities or late fees."
        breadcrumbs={[{ label: 'Home', href: financeHomePath(scope) }, { label: 'Outstanding Dues' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load outstanding dues.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard metric={{ id: 'out', label: 'Total Outstanding', value: formatINR(totalOutstanding), tone: 'warning' }} />
            <StatCard metric={{ id: 'over', label: 'Total Overdue', value: formatINR(totalOverdue), tone: 'danger' }} />
            <StatCard metric={{ id: 'accounts', label: 'Accounts Overdue', value: String(accountsOverdue), tone: 'danger' }} />
          </div>

          <Card>
            <CardHeader title="Due today" />
            {(dueToday ?? []).length === 0 ? (
              <p className="typo-helper">No invoices are due today.</p>
            ) : (
              <ul className="space-y-3">
                {(dueToday ?? []).map((item) => (
                  <li key={item.invoice.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.tenantName}</p>
                      <p className="typo-helper">
                        {item.propertyName} · {item.roomNumber ?? '—'} · {formatShortDate(item.dueDate)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatINR(item.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Select
              label="Property"
              name="propertyId"
              value={propertyId}
              options={[
                { value: '', label: 'All properties' },
                ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
              ]}
              onChange={(event) => setPropertyId(event.target.value)}
            />
            <Select
              label="Status"
              name="status"
              value={statusFilter}
              options={[
                { value: '', label: 'All open statuses' },
                { value: InvoiceStatus.ISSUED, label: INVOICE_STATUS_LABELS.ISSUED },
                { value: InvoiceStatus.PARTIALLY_PAID, label: INVOICE_STATUS_LABELS.PARTIALLY_PAID },
                { value: InvoiceStatus.OVERDUE, label: INVOICE_STATUS_LABELS.OVERDUE },
              ]}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
          </div>

          <Card>
            <CardHeader title="Open invoices" />
            {filtered.length === 0 ? (
              <EmptyState title="No outstanding dues." description="All open invoices have been collected." />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                rowKey={(row) => row.id}
                searchPlaceholder="Search tenant, invoice or room…"
                emptyTitle="No outstanding dues."
              />
            )}
          </Card>
        </div>
      ) : null}

      <RecordPaymentModal
        key={presetInvoiceId || 'dues-record'}
        open={recordOpen}
        tenants={tenants ?? []}
        invoices={invoices ?? []}
        submitting={saving}
        presetInvoiceId={presetInvoiceId}
        presetTenantId={invoices?.find((invoice) => invoice.id === presetInvoiceId)?.tenantId}
        onClose={() => setRecordOpen(false)}
        onSubmit={async (values) => {
          setSaving(true);
          try {
            await financeService.recordPayment(values, { actor: user?.name ?? 'Accountant' });
            toast('success', 'Payment recorded successfully.');
            setRecordOpen(false);
            reload();
            reloadInvoices();
            reloadDueToday();
          } catch (cause) {
            toast('error', 'Unable to record payment', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
