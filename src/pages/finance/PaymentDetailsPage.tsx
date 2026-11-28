import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ReceiptView } from '@/components/finance/ReceiptView';
import { downloadReceipt } from '@/utils/financeReceipt';
import { RefundPaymentModal } from '@/components/finance/RefundPaymentModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { RoleCode } from '@/constants/roles';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import {
  financeHomePath,
  invoiceDetailPath,
  paymentsListPath,
  scopeFromPath,
} from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, PaymentStatus } from '@/types/finance';
import { formatINR, formatShortDate } from '@/utils/format';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export function PaymentDetailsPage() {
  const { paymentId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const scope = scopeFromPath(location.pathname);
  const isTenant = user?.role === RoleCode.TENANT;
  const canRefund = useHasPermission(Permission.PAYMENT_REFUND) && !isTenant;

  const loader = useCallback(() => financeService.getPaymentById(paymentId), [paymentId]);
  const { data: payment, status, error, reload } = useAsyncResource(loader);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  return (
    <div>
      <PageHeader
        title={payment?.paymentNumber ?? 'Payment'}
        description="Payment record, invoice reference and receipt."
        showBack
        breadcrumbs={[
          { label: 'Home', href: financeHomePath(scope) },
          { label: 'Payments', href: paymentsListPath(scope) },
          { label: payment?.paymentNumber ?? 'Payment' },
        ]}
        actions={
          payment ? (
            <div className="flex flex-wrap gap-2">
              {payment.status === PaymentStatus.SUCCESS ? (
                <>
                  <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                    Preview receipt
                  </Button>
                  <Button onClick={() => downloadReceipt(payment)}>Download Receipt</Button>
                </>
              ) : null}
              {canRefund && !payment.isTest && payment.status === PaymentStatus.SUCCESS ? (
                <Button variant="danger" onClick={() => setRefundOpen(true)}>
                  Refund
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Payment not found.'} onRetry={reload} />
      ) : null}

      {status === 'success' && payment ? (
        <Card className="[overflow-wrap:anywhere]">
          <CardHeader title="Payment details" />
          {payment.isTest ? <p className="mb-3 text-sm font-semibold text-warning">Razorpay Test Mode · No real money was transferred.</p> : null}
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="typo-muted">Payment ID</dt>
              <dd className="mt-1 font-semibold">{payment.paymentNumber}</dd>
            </div>
            <div>
              <dt className="typo-muted">Date</dt>
              <dd className="mt-1 font-medium">{formatShortDate(payment.paymentDate)}</dd>
            </div>
            <div>
              <dt className="typo-muted">Amount</dt>
              <dd className="mt-1 font-semibold">{formatINR(payment.amount)}</dd>
            </div>
            <div>
              <dt className="typo-muted">Method</dt>
              <dd className="mt-1 font-medium">{PAYMENT_METHOD_LABELS[payment.method]}</dd>
            </div>
            <div>
              <dt className="typo-muted">Reference</dt>
              <dd className="mt-1 font-medium">{payment.reference || '—'}</dd>
            </div>
            <div>
              <dt className="typo-muted">Invoice</dt>
              <dd className="mt-1">
                <button
                  type="button"
                  className="font-medium text-primary"
                  onClick={() => navigate(invoiceDetailPath(scope, payment.invoiceId))}
                >
                  {payment.invoiceNumber}
                </button>
              </dd>
            </div>
            <div>
              <dt className="typo-muted">Tenant</dt>
              <dd className="mt-1 font-medium">{payment.tenantName}</dd>
            </div>
            <div>
              <dt className="typo-muted">Status</dt>
              <dd className="mt-1">
                <StatusPill value={PAYMENT_STATUS_LABELS[payment.status]} />
              </dd>
            </div>
            {payment.notes ? (
              <div className="sm:col-span-2">
                <dt className="typo-muted">Notes</dt>
                <dd className="mt-1 font-medium">{payment.notes}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      ) : null}

      <Modal
        open={receiptOpen}
        title="Receipt"
        onClose={() => setReceiptOpen(false)}
        className="max-w-xl"
      >
        {payment ? <ReceiptView payment={payment} /> : null}
      </Modal>

      <RefundPaymentModal
        open={refundOpen}
        payment={payment ?? null}
        submitting={saving}
        onClose={() => setRefundOpen(false)}
        onSubmit={async (reason) => {
          if (!payment) return;
          setSaving(true);
          try {
            await financeService.refundPayment(payment.id, reason);
            toast('success', 'Payment refunded', `${payment.paymentNumber} is now refunded.`);
            setRefundOpen(false);
            reload();
          } catch (cause) {
            toast(
              'error',
              'Unable to refund',
              cause instanceof Error ? cause.message : 'Please try again.',
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
