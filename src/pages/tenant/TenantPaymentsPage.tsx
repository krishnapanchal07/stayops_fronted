import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { razorpayService } from '@/services/finance/razorpayService';
import { eligibleForOnlinePayment } from '@/utils/financeCalc';
import { useFinanceTable } from '@/hooks/useFinanceTable';
import { financeService } from '@/services/finance/financeService';
import { invoiceDetailPath, paymentDetailPath } from '@/routes/financePaths';
import { PATHS } from '@/routes/paths';
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  type Invoice,
  type Payment,
} from '@/types/finance';
import type { DataTableColumn } from '@/types/ui';
import { formatBillingPeriod } from '@/utils/financeCalc';
import { formatINR, formatShortDate } from '@/utils/format';
import { downloadReceipt } from '@/utils/financeReceipt';
interface LedgerRow {
  id: string;
  date: string;
  description: string;
  billingPeriod: string;
  amount: number;
  method: Payment['method'] | '';
  statusLabel: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentId: string | null;
  payment: Payment | null;
}
const tabs = [
  { id: 'all', label: 'All Payments' },
  { id: 'due', label: 'Due Payments' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' },
];
export function TenantPaymentsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [month, setMonth] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [method, setMethod] = useState('');
  const ledger = useFinanceTable<LedgerRow>('ledger', {
    tab,
    billingPeriod: month,
    status: statusFilter,
    method,
  });
  const invoices = useFinanceTable<Invoice>('invoices', {});
  const summaryLoader = useCallback(() => financeService.getMyFinancialSummary(), []);
  const summary = useAsyncResource(summaryLoader);
  const checkout = useAsyncResource(razorpayService.config);
  const columns: DataTableColumn<LedgerRow>[] = [
    {
      id: 'date',
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (r) => formatShortDate(r.date),
    },
    { id: 'description', header: 'Description', accessor: 'description' },
    {
      id: 'billingPeriod',
      header: 'Month',
      accessor: 'billingPeriod',
      sortable: true,
      render: (r) => formatBillingPeriod(r.billingPeriod),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      render: (r) => formatINR(r.amount),
    },
    {
      id: 'method',
      header: 'Method',
      render: (r) => r.method ? `${PAYMENT_METHOD_LABELS[r.method]}${r.payment?.isTest ? ' · Razorpay Test Mode' : ''}` : '—',
    },
    { id: 'status', header: 'Status', render: (r) => <StatusPill value={r.statusLabel} /> },
    { id: 'invoiceNumber', header: 'Invoice', accessor: 'invoiceNumber', sortable: true },
    {
      id: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(invoiceDetailPath('tenant', r.invoiceId))}
          >
            View Invoice
          </Button>
          {r.paymentId ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(paymentDetailPath('tenant', r.paymentId!))}
            >
              View Payment
            </Button>
          ) : null}
          {r.payment?.status === 'SUCCESS' ? (
            <Button size="sm" variant="outline" onClick={() => void downloadReceipt(r.payment!)}>
              Receipt
            </Button>
          ) : null}
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
      <p className="typo-helper mb-5">
        {checkout.data?.available ? 'Razorpay Test Mode is available for eligible invoices. No real money is transferred.' :
          checkout.status === 'loading' ? 'Checking online payment availability…' : 'Online payment unavailable. Contact your property office to pay.'}
      </p>
      {summary.status === 'error' ? (
        <ErrorState description={summary.error ?? undefined} onRetry={summary.reload} />
      ) : null}
      {summary.data ? (
        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { id: 'paid', label: 'Actual Payments', value: summary.data.totalPaid },
            { id: 'due', label: 'Total Due', value: summary.data.currentDue },
            { id: 'overdue', label: 'Total Overdue', value: summary.data.overdue },
            { id: 'test', label: 'Test Mode Applied', value: summary.data.testPaid },
          ].map((m) => (
            <StatCard
              key={m.id}
              metric={{
                ...m,
                value: formatINR(m.value),
                tone: m.id === 'paid' ? 'success' : 'primary',
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="space-y-5">
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <Button
                key={t.id}
                variant={tab === t.id ? 'primary' : 'outline'}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <TextInput
              label="Billing Month"
              name="tenantBillingMonth"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <Select
              label="Status"
              name="tenantFinanceStatus"
              value={statusFilter}
              options={[
                { value: '', label: 'All statuses' },
                ...[
                  'Paid',
                  'Due',
                  'Partially Paid',
                  'Overdue',
                  'Pending',
                  'Failed',
                  'Refunded',
                  'Cancelled',
                ].map((value) => ({ value, label: value })),
              ]}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              label="Payment Method"
              name="tenantFinanceMethod"
              value={method}
              options={[
                { value: '', label: 'All methods' },
                ...Object.values(PaymentMethod).map((value) => ({
                  value,
                  label: PAYMENT_METHOD_LABELS[value],
                })),
              ]}
              onChange={(e) => setMethod(e.target.value)}
            />
          </div>
          <TextInput
            label="Search payments"
            name="tenantLedgerSearch"
            value={ledger.search}
            onChange={(e) => ledger.setSearch(e.target.value)}
          />
          <DataTable
            columns={columns}
            data={ledger.data?.items ?? []}
            {...ledger.tableProps}
            isError={ledger.status === 'error'}
            onRetry={ledger.reload}
            rowKey={(r) => r.id}
            emptyTitle="No payments found."
            renderMobile={(r) => (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <p className="font-semibold">{r.description}</p>
                <StatusPill value={r.statusLabel} />
                <p>
                  {formatShortDate(r.date)} · {formatINR(r.amount)}
                  {r.payment?.isTest ? ' · Razorpay Test Mode' : ''}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(invoiceDetailPath('tenant', r.invoiceId))}
                  >
                    View Invoice
                  </Button>
                  {r.paymentId ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(paymentDetailPath('tenant', r.paymentId!))}
                    >
                      View Payment
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          />
        </Card>
        <Card>
          <CardHeader title="My Invoices" />
          <TextInput
            label="Search invoices"
            name="tenantInvoiceSearch"
            value={invoices.search}
            onChange={(e) => invoices.setSearch(e.target.value)}
          />
          <DataTable<Invoice>
            columns={[
              { id: 'invoiceNumber', header: 'Invoice', accessor: 'invoiceNumber', sortable: true },
              { id: 'propertyName', header: 'Property', accessor: 'propertyName' },
              { id: 'dueDate', header: 'Due date', render: (r) => formatShortDate(r.dueDate) },
              {
                id: 'billingPeriod',
                header: 'Billing month',
                render: (r) => formatBillingPeriod(r.billingPeriod),
              },
              { id: 'total', header: 'Total', render: (r) => formatINR(r.total) },
              { id: 'paidAmount', header: 'Paid', render: (r) => formatINR(r.paidAmount) },
              {
                id: 'outstandingAmount',
                header: 'Outstanding',
                render: (r) => formatINR(r.outstandingAmount),
              },
              {
                id: 'status',
                header: 'Status',
                render: (r) => <StatusPill value={INVOICE_STATUS_LABELS[r.status]} />,
              },
              {
                id: 'actions',
                header: 'Actions',
                render: (r) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(invoiceDetailPath('tenant', r.id))}
                  >
                    {checkout.data?.available && eligibleForOnlinePayment(r) ? 'Pay Now (Test Mode)' : 'View'}
                  </Button>
                ),
              },
            ]}
            data={invoices.data?.items ?? []}
            {...invoices.tableProps}
            isError={invoices.status === 'error'}
            onRetry={invoices.reload}
            rowKey={(r) => r.id}
            emptyTitle="No invoices found."
          />
        </Card>
      </div>
    </div>
  );
}
