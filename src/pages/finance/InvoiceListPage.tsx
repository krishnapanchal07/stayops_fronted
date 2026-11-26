import { formatBillingPeriod } from '@/utils/financeCalc';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InvoiceFormModal } from '@/components/finance/InvoiceFormModal';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { financeHomePath, invoiceDetailPath, scopeFromPath } from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import {
  INVOICE_STATUS_LABELS,
  InvoiceStatus,
  type Invoice,
  type InvoiceFilters,
} from '@/types/finance';
import type { DataTableColumn } from '@/types/ui';
import { emptyInvoiceFilters } from '@/utils/financeValidation';
import { formatINR, formatShortDate } from '@/utils/format';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useFinanceTable } from '@/hooks/useFinanceTable';
import { TextInput } from '@/components/forms/TextInput';
import { useLocation, useNavigate } from 'react-router-dom';

export function InvoiceListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const scope = scopeFromPath(location.pathname);
  const canCreate = useHasPermission(Permission.INVOICE_CREATE);

  const propertiesLoader = useCallback(() => financeService.getProperties(), []);
  const summaryLoader = useCallback(() => financeService.getInvoiceSummary(), []);
  const overviewLoader = useCallback(() => financeService.getFinanceOverview(), []);
  const propertyResource = useAsyncResource(propertiesLoader);
  const { data: properties } = propertyResource;
  const summaryResource = useAsyncResource(summaryLoader);
  const { data: summary, reload: reloadSummary } = summaryResource;
  const overviewResource = useAsyncResource(overviewLoader);
  const { data: overview, reload: reloadOverview } = overviewResource;

  const [filters, setFilters] = useState<InvoiceFilters>(emptyInvoiceFilters());
  const { data, status, error, reload, search, setSearch, tableProps } = useFinanceTable<Invoice>(
    'invoices',
    { ...filters },
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = data?.items ?? [];

  const columns: DataTableColumn<Invoice>[] = [
    { id: 'invoiceNumber', header: 'Invoice', accessor: 'invoiceNumber', sortable: true },
    { id: 'tenantName', header: 'Tenant', accessor: 'tenantName', sortable: true },
    { id: 'propertyName', header: 'Property', accessor: 'propertyName', sortable: true },
    {
      id: 'billingPeriod',
      header: 'Month',
      accessor: 'billingPeriod',
      render: (row) => formatBillingPeriod(row.billingPeriod),
    },
    {
      id: 'total',
      header: 'Amount',
      accessor: 'total',
      sortable: true,
      render: (row) => formatINR(row.total),
    },
    {
      id: 'paidAmount',
      header: 'Paid',
      accessor: 'paidAmount',
      render: (row) => formatINR(row.paidAmount),
    },
    {
      id: 'outstandingAmount',
      header: 'Outstanding',
      accessor: 'outstandingAmount',
      render: (row) => formatINR(row.outstandingAmount),
    },
    {
      id: 'dueDate',
      header: 'Due date',
      accessor: 'dueDate',
      sortable: true,
      render: (row) => formatShortDate(row.dueDate),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusPill value={INVOICE_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          iconTriggerLabel={`Actions for ${row.invoiceNumber}`}
          trigger={<MoreHorizontal className="h-4 w-4" />}
          items={[
            {
              id: 'view',
              label: 'View',
              onSelect: () => navigate(invoiceDetailPath(scope, row.id)),
            },
            ...(canCreate && row.paidAmount === 0 && row.status !== InvoiceStatus.CANCELLED
              ? [
                  {
                    id: 'cancel',
                    label: 'Cancel',
                    onSelect: async () => {
                      try {
                        await financeService.cancelInvoice(row.id);
                        toast('success', 'Invoice cancelled', row.invoiceNumber);
                        reload();
                        reloadSummary();
                        reloadOverview();
                      } catch (cause) {
                        toast(
                          'error',
                          'Unable to cancel',
                          cause instanceof Error ? cause.message : 'Please try again.',
                        );
                      }
                    },
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Issue bills, track collections and review outstanding invoices."
        breadcrumbs={[{ label: 'Home', href: financeHomePath(scope) }, { label: 'Invoices' }]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              Create Invoice
            </Button>
          ) : null
        }
      />

      {overviewResource.status === 'error' ? (
        <ErrorState
          description={overviewResource.error ?? 'Unable to load financial overview.'}
          onRetry={reloadOverview}
        />
      ) : null}
      {propertyResource.status === 'error' ? (
        <ErrorState
          description={propertyResource.error ?? 'Unable to load properties.'}
          onRetry={propertyResource.reload}
        />
      ) : null}
      {summaryResource.status === 'error' ? (
        <ErrorState
          description={summaryResource.error ?? 'Unable to load financial statistics.'}
          onRetry={reloadSummary}
        />
      ) : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load invoices.'} onRetry={reload} />
      ) : null}

      {status !== 'error' ? (
        <div className="space-y-5">
          {summary ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                metric={{
                  id: 'billed',
                  label: 'Billed',
                  value: formatINR(summary?.billed ?? 0),
                  tone: 'primary',
                }}
              />
              <StatCard
                metric={{
                  id: 'collected',
                  label: 'Collected',
                  value: formatINR(summary?.collected ?? 0),
                  tone: 'success',
                }}
              />
              <StatCard
                metric={{
                  id: 'outstanding',
                  label: 'Outstanding',
                  value: formatINR(summary?.outstanding ?? 0),
                  tone: 'warning',
                }}
              />
              <StatCard
                metric={{
                  id: 'overdue',
                  label: 'Overdue',
                  value: formatINR(summary?.overdue ?? 0),
                  tone: 'danger',
                }}
              />
            </div>
          ) : null}
          {overview ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                metric={{
                  id: 'expenses',
                  label: 'Expenses',
                  value: formatINR(overview?.expenses ?? 0),
                  tone: 'warning',
                }}
              />
              <StatCard
                metric={{
                  id: 'net',
                  label: 'Net Income',
                  value: formatINR(overview?.netIncome ?? 0),
                  tone: 'success',
                }}
              />
              <StatCard
                metric={{
                  id: 'rate',
                  label: 'Collection Rate',
                  value: `${overview?.collectionRate ?? 0}%`,
                  tone: 'info',
                }}
              />
            </div>
          ) : null}

          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Property"
              name="propertyId"
              value={filters.propertyId}
              options={[
                { value: '', label: 'All properties' },
                ...(properties ?? []).map((property) => ({
                  value: property.id,
                  label: property.name,
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, propertyId: event.target.value }))
              }
            />
            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={[
                { value: '', label: 'All statuses' },
                ...Object.values(InvoiceStatus).map((value) => ({
                  value,
                  label: INVOICE_STATUS_LABELS[value],
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as InvoiceFilters['status'],
                }))
              }
            />
            <TextInput
              label="Month"
              name="billingPeriod"
              type="month"
              value={filters.billingPeriod}
              onChange={(event) =>
                setFilters((current) => ({ ...current, billingPeriod: event.target.value }))
              }
            />
            <Select
              label="Due status"
              name="dueStatus"
              value={filters.dueStatus}
              options={[
                { value: '', label: 'All' },
                { value: 'DUE', label: 'Due' },
                { value: 'OVERDUE', label: 'Overdue' },
                { value: 'PAID', label: 'Paid' },
              ]}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  dueStatus: event.target.value as InvoiceFilters['dueStatus'],
                }))
              }
            />
          </div>

          <Card>
            <TextInput
              label="Search"
              name="financeSearch"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <CardHeader title="Invoice register" />
            <DataTable
              columns={columns}
              data={filtered}
              {...tableProps}
              rowKey={(row) => row.id}
              searchPlaceholder="Search invoice or tenant…"
              emptyTitle="No invoices found."
            />
          </Card>
        </div>
      ) : null}

      {createOpen ? (
        <InvoiceFormModal
          open={createOpen}
          submitting={saving}
          onClose={() => setCreateOpen(false)}
          onSubmit={async (values) => {
            setSaving(true);
            try {
              const created = await financeService.createInvoice(values);
              toast('success', 'Invoice created', created.invoiceNumber);
              setCreateOpen(false);
              reload();
              reloadSummary();
              reloadOverview();
            } catch (cause) {
              toast(
                'error',
                'Unable to create invoice',
                cause instanceof Error ? cause.message : 'Please try again.',
              );
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
