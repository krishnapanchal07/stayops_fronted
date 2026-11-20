import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { InvoiceItemsTable } from '@/components/finance/InvoiceItemsTable';
import { PayNowModal } from '@/components/finance/PayNowModal';
import { RecordPaymentModal } from '@/components/finance/RecordPaymentModal';
import { downloadReceipt } from '@/utils/financeReceipt';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { RoleCode } from '@/constants/roles';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { financeHomePath, paymentDetailPath, paymentsListPath, scopeFromPath } from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import { tenantService } from '@/services/tenant/tenantService';
import { INVOICE_STATUS_LABELS, InvoiceStatus, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PaymentStatus } from '@/types/finance';
import { formatBillingPeriod } from '@/utils/financeCalc';
import { formatINR, formatShortDate } from '@/utils/format';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export function InvoiceDetailsPage() {
  const { invoiceId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const scope = scopeFromPath(location.pathname);
  const isTenant = user?.role === RoleCode.TENANT;
  const canPay = useHasPermission(Permission.PAYMENT_CREATE);
  const canCancel = useHasPermission(Permission.INVOICE_CREATE) && !isTenant;

  const loader = useCallback(() => financeService.getInvoiceById(invoiceId), [invoiceId]);
  const paymentsLoader = useCallback(() => financeService.getPaymentsByInvoice(invoiceId), [invoiceId]);
  const tenantsLoader = useCallback(() => tenantService.getTenants(), []);
  const invoicesLoader = useCallback(() => financeService.getInvoices(), []);
  const { data: invoice, status, error, reload } = useAsyncResource(loader);
  const { data: payments, reload: reloadPayments } = useAsyncResource(paymentsLoader);
  const { data: tenants } = useAsyncResource(tenantsLoader);
  const { data: invoices } = useAsyncResource(invoicesLoader);

  const [payOpen, setPayOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (status === 'success' && invoice && isTenant && invoice.tenantId !== user?.id) {
    return <ErrorState description="You can only view your own invoices." />;
  }

  const canReceivePayment = Boolean(invoice && invoice.outstandingAmount > 0 && invoice.status !== InvoiceStatus.CANCELLED);

  return (
    <div>
      <PageHeader
        title={invoice?.invoiceNumber ?? 'Invoice'}
        description="Invoice details, items and payment allocations."
        showBack
        breadcrumbs={[
          { label: 'Home', href: financeHomePath(scope) },
          { label: 'Payments', href: paymentsListPath(scope) },
          { label: invoice?.invoiceNumber ?? 'Invoice' },
        ]}
        actions={
          invoice ? (
            <div className="flex flex-wrap gap-2">
              {isTenant && canPay && canReceivePayment ? (
                <Button onClick={() => setPayOpen(true)}>Pay Now</Button>
              ) : null}
              {!isTenant && canPay && canReceivePayment ? (
                <Button onClick={() => setRecordOpen(true)}>Record Payment</Button>
              ) : null}
              {canCancel && invoice.status !== InvoiceStatus.CANCELLED && invoice.status !== InvoiceStatus.PAID ? (
                <Button
                  variant="danger"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await financeService.cancelInvoice(invoice.id);
                      toast('success', 'Invoice cancelled', `${invoice.invoiceNumber} can no longer receive payments.`);
                      reload();
                    } catch (cause) {
                      toast('error', 'Unable to cancel', cause instanceof Error ? cause.message : 'Please try again.');
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Cancel invoice
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Invoice not found.'} onRetry={reload} /> : null}

      {status === 'success' && invoice ? (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="typo-muted">StayOps Invoice</p>
                <h2 className="typo-subtitle mt-1">{invoice.invoiceNumber}</h2>
                <p className="typo-helper mt-1">{formatBillingPeriod(invoice.billingPeriod)}</p>
              </div>
              <StatusPill value={INVOICE_STATUS_LABELS[invoice.status]} />
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="typo-muted">Issue date</dt>
                <dd className="mt-1 font-medium">{formatShortDate(invoice.issueDate)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Due date</dt>
                <dd className="mt-1 font-medium">{formatShortDate(invoice.dueDate)}</dd>
              </div>
              <div>
                <dt className="typo-muted">Tenant</dt>
                <dd className="mt-1 font-medium">
                  {invoice.tenantName}
                  <span className="block typo-helper">{invoice.tenantCode}</span>
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Property / Room</dt>
                <dd className="mt-1 font-medium">
                  {invoice.propertyName}
                  {invoice.roomNumber ? ` · ${invoice.roomNumber}` : ''}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Items" />
            <InvoiceItemsTable invoice={invoice} />
          </Card>

          <Card>
            <CardHeader title="Payments" />
            {(payments ?? []).length === 0 ? (
              <p className="typo-helper">No payment recorded against this invoice.</p>
            ) : (
              <ul className="space-y-3">
                {(payments ?? []).map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div>
                      <p className="text-sm font-semibold">{payment.paymentNumber}</p>
                      <p className="typo-helper">
                        {formatShortDate(payment.paymentDate)} · {PAYMENT_METHOD_LABELS[payment.method]} · {formatINR(payment.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill value={PAYMENT_STATUS_LABELS[payment.status]} />
                      {payment.status === PaymentStatus.SUCCESS ? (
                        <Button size="sm" variant="outline" onClick={() => downloadReceipt(payment)}>
                          Receipt
                        </Button>
                      ) : null}
                      <Button size="sm" variant="ghost" onClick={() => navigate(paymentDetailPath(scope, payment.id))}>
                        View
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : null}

      <PayNowModal
        key={invoice ? `${invoice.id}-${invoice.outstandingAmount}` : 'pay-closed'}
        open={payOpen}
        invoice={invoice ?? null}
        tenantId={user?.id ?? ''}
        submitting={saving}
        onClose={() => setPayOpen(false)}
        onSubmit={async (values) => {
          setSaving(true);
          try {
            await financeService.recordPayment(values, { actor: user?.name ?? 'Tenant' });
            toast('success', 'Payment recorded successfully.');
            setPayOpen(false);
            reload();
            reloadPayments();
          } catch (cause) {
            toast('error', 'Payment failed', cause instanceof Error ? cause.message : 'Please try again.');
            throw cause;
          } finally {
            setSaving(false);
          }
        }}
      />

      <RecordPaymentModal
        key={invoice ? `record-${invoice.id}` : 'record-closed'}
        open={recordOpen}
        tenants={tenants ?? []}
        invoices={invoices ?? []}
        submitting={saving}
        presetTenantId={invoice?.tenantId}
        presetInvoiceId={invoice?.id}
        onClose={() => setRecordOpen(false)}
        onSubmit={async (values) => {
          setSaving(true);
          try {
            await financeService.recordPayment(values, { actor: user?.name ?? 'Accountant' });
            toast('success', 'Payment recorded successfully.');
            setRecordOpen(false);
            reload();
            reloadPayments();
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
