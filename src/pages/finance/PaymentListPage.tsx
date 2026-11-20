import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import { RefundPaymentModal } from '@/components/finance/RefundPaymentModal';
import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { financeHomePath, invoiceDetailPath, paymentDetailPath, scopeFromPath } from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentMethod,
  PaymentStatus,
  type Payment,
  type PaymentFilters,
} from '@/types/finance';
import type { DataTableColumn } from '@/types/ui';
import { emptyPaymentFilters } from '@/utils/financeValidation';
import { filterPayments } from '@/services/finance/paymentService';
import { formatINR, formatShortDate } from '@/utils/format';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function PaymentListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const scope = scopeFromPath(location.pathname);
  const canRecord = useHasPermission(Permission.PAYMENT_CREATE);
  const canRefund = useHasPermission(Permission.PAYMENT_REFUND);

  const paymentsLoader = useCallback(() => financeService.getPayments(), []);
  const invoicesLoader = useCallback(() => financeService.getInvoices(), []);
  const tenantsLoader = useCallback(() => tenantService.getTenants(), []);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const summaryLoader = useCallback(() => financeService.getPaymentSummary(), []);
  const { data, status, error, reload } = useAsyncResource(paymentsLoader);
  const { data: invoices, reload: reloadInvoices } = useAsyncResource(invoicesLoader);
  const { data: tenants } = useAsyncResource(tenantsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: summary, reload: reloadSummary } = useAsyncResource(summaryLoader);

  const [filters, setFilters] = useState<PaymentFilters>(emptyPaymentFilters());
  const [recordOpen, setRecordOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  const payments = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterPayments(payments, filters), [filters, payments]);

  const columns: DataTableColumn<Payment>[] = [
    { id: 'paymentNumber', header: 'Payment ID', accessor: 'paymentNumber', sortable: true },
    { id: 'tenantName', header: 'Tenant', accessor: 'tenantName', sortable: true },
    { id: 'propertyName', header: 'Property', accessor: 'propertyName', sortable: true },
    { id: 'roomNumber', header: 'Room', accessor: 'roomNumber', render: (row) => row.roomNumber ?? '—' },
    { id: 'invoiceNumber', header: 'Invoice', accessor: 'invoiceNumber', sortable: true },
    { id: 'amount', header: 'Amount', accessor: 'amount', sortable: true, render: (row) => formatINR(row.amount) },
    { id: 'method', header: 'Method', accessor: 'method', render: (row) => PAYMENT_METHOD_LABELS[row.method] },
    { id: 'paymentDate', header: 'Date', accessor: 'paymentDate', sortable: true, render: (row) => formatShortDate(row.paymentDate) },
    { id: 'status', header: 'Status', accessor: 'status', render: (row) => <StatusPill value={PAYMENT_STATUS_LABELS[row.status]} /> },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          trigger={
            <IconButton label={`Actions for ${row.paymentNumber}`} variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={[
            { id: 'view', label: 'View', onSelect: () => navigate(paymentDetailPath(scope, row.id)) },
            { id: 'invoice', label: 'View Invoice', onSelect: () => navigate(invoiceDetailPath(scope, row.invoiceId)) },
            ...(canRefund && row.status === PaymentStatus.SUCCESS
              ? [{ id: 'refund', label: 'Refund', onSelect: () => setRefundTarget(row) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Manage collections, due amounts and payment transactions."
        breadcrumbs={[{ label: 'Home', href: financeHomePath(scope) }, { label: 'Payments' }]}
        actions={
          canRecord ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRecordOpen(true)}>
              Record Payment
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load payments.'} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'collected', label: 'Total Collected', value: formatINR(summary?.collected ?? 0), tone: 'success' }} />
            <StatCard metric={{ id: 'pending', label: 'Pending', value: formatINR(summary?.pending ?? 0), tone: 'warning' }} />
            <StatCard metric={{ id: 'overdue', label: 'Overdue', value: formatINR(summary?.overdue ?? 0), tone: 'danger' }} />
            <StatCard metric={{ id: 'today', label: "Today's Collection", value: formatINR(summary?.todayCollection ?? 0), tone: 'primary' }} />
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-3">
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
              label="Tenant"
              name="tenantId"
              value={filters.tenantId}
              options={[
                { value: '', label: 'All tenants' },
                ...(tenants ?? []).map((tenant) => ({ value: tenant.id, label: tenant.fullName })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, tenantId: event.target.value }))}
            />
            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={[
                { value: '', label: 'All statuses' },
                ...Object.values(PaymentStatus).map((value) => ({ value, label: PAYMENT_STATUS_LABELS[value] })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as PaymentFilters['status'] }))}
            />
            <Select
              label="Payment Method"
              name="method"
              value={filters.method}
              options={[
                { value: '', label: 'All methods' },
                ...Object.values(PaymentMethod).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value as PaymentFilters['method'] }))}
            />
            <DateInput
              label="From date"
              name="fromDate"
              value={filters.fromDate}
              onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
            />
            <DateInput
              label="To date"
              name="toDate"
              value={filters.toDate}
              onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
            />
          </div>

          <Card>
            <CardHeader title="Transactions" />
            {filtered.length === 0 ? (
              <EmptyState title="No payments found." description="Record a collection or adjust filters." />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                rowKey={(row) => row.id}
                searchPlaceholder="Search tenant, payment ID, invoice, room…"
                emptyTitle="No payments found."
              />
            )}
          </Card>
        </div>
      ) : null}

      <RecordPaymentModal
        open={recordOpen}
        tenants={tenants ?? []}
        invoices={invoices ?? []}
        submitting={saving}
        onClose={() => setRecordOpen(false)}
        onSubmit={async (values) => {
          setSaving(true);
          try {
            await financeService.recordPayment(values, { actor: user?.name ?? 'Accountant' });
            toast('success', 'Payment recorded successfully.');
            setRecordOpen(false);
            reload();
            reloadInvoices();
            reloadSummary();
          } catch (cause) {
            toast('error', 'Unable to record payment', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />

      <RefundPaymentModal
        open={Boolean(refundTarget)}
        payment={refundTarget}
        submitting={saving}
        onClose={() => setRefundTarget(null)}
        onSubmit={async (reason) => {
          if (!refundTarget) return;
          setSaving(true);
          try {
            await financeService.refundPayment(refundTarget.id, reason);
            toast('success', 'Payment refunded', `${refundTarget.paymentNumber} is now refunded.`);
            setRefundTarget(null);
            reload();
            reloadInvoices();
            reloadSummary();
          } catch (cause) {
            toast('error', 'Unable to refund', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
