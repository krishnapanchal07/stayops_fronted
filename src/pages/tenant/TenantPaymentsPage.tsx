import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { PayNowModal } from '@/components/finance/PayNowModal';
import { downloadReceipt } from '@/utils/financeReceipt';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { invoiceDetailPath, paymentDetailPath } from '@/routes/financePaths';
import { PATHS } from '@/routes/paths';
import { financeService } from '@/services/finance/financeService';
import {
  INVOICE_STATUS_LABELS,
  InvoiceStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PaymentMethod,
  PaymentStatus,
  type Invoice,
  type Payment,
} from '@/types/finance';
import type { DataTableColumn } from '@/types/ui';
import { formatBillingPeriod } from '@/utils/financeCalc';
import { formatINR, formatShortDate } from '@/utils/format';
import { cn } from '@/utils/cn';
import { Download, MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TabId = 'all' | 'due' | 'overdue' | 'completed';

interface LedgerRow {
  id: string;
  date: string;
  description: string;
  month: string;
  billingPeriod: string;
  amount: number;
  method: Payment['method'] | '';
  statusLabel: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentId?: string;
  payment?: Payment;
  invoice?: Invoice;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All Payments' },
  { id: 'due', label: 'Due Payments' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];

export function TenantPaymentsPage() {
  const user = useCurrentUser();
  const toast = useToast();
  const navigate = useNavigate();
  const canPay = useHasPermission(Permission.PAYMENT_CREATE);
  const tenantId = user?.id ?? '';

  const invoicesLoader = useCallback(() => financeService.getInvoicesByTenant(tenantId), [tenantId]);
  const paymentsLoader = useCallback(() => financeService.getPaymentsByTenant(tenantId), [tenantId]);
  const summaryLoader = useCallback(() => financeService.getTenantFinancialSummary(tenantId), [tenantId]);
  const { data: invoices, status, error, reload: reloadInvoices } = useAsyncResource(invoicesLoader);
  const { data: payments, reload: reloadPayments } = useAsyncResource(paymentsLoader);
  const { data: summary, reload: reloadSummary } = useAsyncResource(summaryLoader);

  const [tab, setTab] = useState<TabId>('all');
  const [month, setMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState(false);

  const reloadAll = () => {
    reloadInvoices();
    reloadPayments();
    reloadSummary();
  };

  const rows = useMemo<LedgerRow[]>(() => {
    const invoiceRows = (invoices ?? []).map((invoice) => {
      const latest = (payments ?? [])
        .filter((payment) => payment.invoiceId === invoice.id)
        .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate))[0];
      return {
        id: `inv-${invoice.id}`,
        date: latest?.paymentDate ?? invoice.issueDate,
        description: invoice.items[0]?.description ?? `Invoice ${invoice.invoiceNumber}`,
        month: formatBillingPeriod(invoice.billingPeriod),
        billingPeriod: invoice.billingPeriod,
        amount: invoice.outstandingAmount > 0 ? invoice.outstandingAmount : invoice.total,
        method: latest?.method ?? '',
        statusLabel: INVOICE_STATUS_LABELS[invoice.status],
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentId: latest?.status === PaymentStatus.SUCCESS ? latest.id : undefined,
        payment: latest,
        invoice,
      };
    });
    const extraPayments = (payments ?? [])
      .filter((payment) => payment.status !== PaymentStatus.SUCCESS)
      .map((payment) => ({
        id: `pay-${payment.id}`,
        date: payment.paymentDate,
        description: `Payment ${payment.paymentNumber}`,
        month: formatBillingPeriod(payment.paymentDate.slice(0, 7)),
        billingPeriod: payment.paymentDate.slice(0, 7),
        amount: payment.amount,
        method: payment.method,
        statusLabel: PAYMENT_STATUS_LABELS[payment.status],
        invoiceId: payment.invoiceId,
        invoiceNumber: payment.invoiceNumber,
        paymentId: payment.id,
        payment,
      }));
    return [...invoiceRows, ...extraPayments].sort((left, right) => right.date.localeCompare(left.date));
  }, [invoices, payments]);

  const filtered = rows.filter((row) => {
    if (tab === 'due' && !(row.invoice && row.invoice.outstandingAmount > 0)) return false;
    if (tab === 'overdue' && row.invoice?.status !== InvoiceStatus.OVERDUE) return false;
    if (tab === 'completed' && row.invoice?.status !== InvoiceStatus.PAID && row.payment?.status !== PaymentStatus.SUCCESS)
      return false;
    if (month && row.billingPeriod !== month) return false;
    if (statusFilter && row.statusLabel !== statusFilter) return false;
    if (methodFilter && row.method !== methodFilter) return false;
    return true;
  });

  const months = [...new Set(rows.map((row) => row.billingPeriod))].sort().reverse();

  const columns: DataTableColumn<LedgerRow>[] = [
    { id: 'date', header: 'Date', accessor: 'date', sortable: true, render: (row) => formatShortDate(row.date) },
    { id: 'description', header: 'Description', accessor: 'description', sortable: true },
    { id: 'month', header: 'Month', accessor: 'month', sortable: true },
    { id: 'amount', header: 'Amount', accessor: 'amount', sortable: true, render: (row) => formatINR(row.amount) },
    {
      id: 'method',
      header: 'Method',
      accessor: 'method',
      render: (row) => (row.method ? PAYMENT_METHOD_LABELS[row.method] : '—'),
    },
    { id: 'status', header: 'Status', accessor: 'statusLabel', render: (row) => <StatusPill value={row.statusLabel} /> },
    {
      id: 'invoice',
      header: 'Invoice',
      accessor: 'invoiceNumber',
      render: (row) => (
        <button
          type="button"
          className="font-medium text-primary"
          onClick={() => navigate(invoiceDetailPath('tenant', row.invoiceId))}
        >
          {row.invoiceNumber}
        </button>
      ),
    },
    {
      id: 'actions',
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.paymentId && row.payment?.status === PaymentStatus.SUCCESS ? (
            <IconButton label="Download receipt" variant="ghost" size="sm" onClick={() => downloadReceipt(row.payment!)}>
              <Download className="h-4 w-4" />
            </IconButton>
          ) : (
            <span className="px-2 text-muted">—</span>
          )}
          <Dropdown
            align="right"
            trigger={
              <IconButton label={`Actions for ${row.invoiceNumber}`} variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            }
            items={[
              { id: 'view', label: 'View invoice', onSelect: () => navigate(invoiceDetailPath('tenant', row.invoiceId)) },
              ...(row.paymentId
                ? [{ id: 'payment', label: 'View payment', onSelect: () => navigate(paymentDetailPath('tenant', row.paymentId!)) }]
                : []),
              ...(canPay && row.invoice && row.invoice.outstandingAmount > 0
                ? [{ id: 'pay', label: 'Pay Now', onSelect: () => setPayInvoice(row.invoice!) }]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="View your payment history, invoices and outstanding dues."
        breadcrumbs={[{ label: 'Home', href: PATHS.tenant.dashboard }, { label: 'Payments' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to load payments.'} onRetry={reloadAll} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'paid', label: 'Total Paid', value: formatINR(summary?.totalPaid ?? 0), tone: 'success' }} />
            <StatCard
              metric={{
                id: 'due',
                label: 'Total Due',
                value: formatINR(summary?.currentDue ?? 0),
                tone: (summary?.currentDue ?? 0) > 0 ? 'danger' : 'success',
              }}
            />
            <StatCard metric={{ id: 'overdue', label: 'Total Overdue', value: formatINR(summary?.overdue ?? 0), tone: 'danger' }} />
            <StatCard
              metric={{ id: 'month', label: 'This Month', value: formatINR(summary?.currentMonthCharges ?? 0), tone: 'primary' }}
            />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'rounded-xl px-4 py-2 text-sm font-medium',
                    tab === item.id ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-background',
                  )}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Select
                label="Billing Month"
                name="month"
                value={month}
                options={[{ value: '', label: 'All months' }, ...months.map((value) => ({ value, label: formatBillingPeriod(value) }))]}
                onChange={(event) => setMonth(event.target.value)}
              />
              <Select
                label="Status"
                name="status"
                value={statusFilter}
                options={[
                  { value: '', label: 'All statuses' },
                  ...[...new Set(rows.map((row) => row.statusLabel))].map((value) => ({ value, label: value })),
                ]}
                onChange={(event) => setStatusFilter(event.target.value)}
              />
              <Select
                label="Payment Method"
                name="method"
                value={methodFilter}
                options={[
                  { value: '', label: 'All methods' },
                  ...Object.values(PaymentMethod).map((value) => ({ value, label: PAYMENT_METHOD_LABELS[value] })),
                ]}
                onChange={(event) => setMethodFilter(event.target.value)}
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState title="No payments found." description="Your invoices and payment history will appear here." />
            ) : (
              <DataTable
                columns={columns}
                data={filtered}
                rowKey={(row) => row.id}
                searchPlaceholder="Search invoice or description…"
                emptyTitle="No payments found."
                renderMobile={(row) => (
                  <div className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{row.description}</p>
                      <StatusPill value={row.statusLabel} />
                    </div>
                    <p className="typo-helper mt-1">
                      {formatShortDate(row.date)} · {row.month} · {formatINR(row.amount)}
                    </p>
                  </div>
                )}
              />
            )}
          </Card>

          <Card>
            <CardHeader title="My Invoices" />
            {(invoices ?? []).length === 0 ? (
              <EmptyState title="No invoices found." description="Issued invoices will appear here." />
            ) : (
              <DataTable
                columns={[
                  { id: 'number', header: 'Invoice', accessor: 'invoiceNumber', sortable: true },
                  { id: 'month', header: 'Billing month', accessor: 'billingPeriod', render: (row) => formatBillingPeriod(row.billingPeriod) },
                  { id: 'issue', header: 'Issue date', accessor: 'issueDate', render: (row) => formatShortDate(row.issueDate) },
                  { id: 'due', header: 'Due date', accessor: 'dueDate', render: (row) => formatShortDate(row.dueDate) },
                  { id: 'total', header: 'Total', accessor: 'total', render: (row) => formatINR(row.total) },
                  { id: 'paid', header: 'Paid', accessor: 'paidAmount', render: (row) => formatINR(row.paidAmount) },
                  { id: 'out', header: 'Outstanding', accessor: 'outstandingAmount', render: (row) => formatINR(row.outstandingAmount) },
                  { id: 'status', header: 'Status', accessor: 'status', render: (row) => <StatusPill value={INVOICE_STATUS_LABELS[row.status]} /> },
                  {
                    id: 'actions',
                    header: 'Action',
                    render: (row) => (
                      <Button size="sm" variant="ghost" onClick={() => navigate(invoiceDetailPath('tenant', row.id))}>
                        View
                      </Button>
                    ),
                  },
                ]}
                data={invoices ?? []}
                rowKey={(row) => row.id}
                searchPlaceholder="Search invoices…"
                emptyTitle="No invoices found."
              />
            )}
          </Card>
        </div>
      ) : null}

      <PayNowModal
        key={payInvoice?.id ?? 'pay-closed'}
        open={Boolean(payInvoice)}
        invoice={payInvoice}
        tenantId={tenantId}
        submitting={paying}
        onClose={() => setPayInvoice(null)}
        onSubmit={async (values) => {
          setPaying(true);
          try {
            await financeService.recordPayment(values, { actor: user?.name ?? 'Tenant' });
            toast('success', 'Payment recorded successfully.', `${formatINR(values.amount)} applied to ${payInvoice?.invoiceNumber}.`);
            setPayInvoice(null);
            reloadAll();
          } catch (cause) {
            toast('error', 'Payment failed', cause instanceof Error ? cause.message : 'Please try again.');
            throw cause;
          } finally {
            setPaying(false);
          }
        }}
      />
    </div>
  );
}
