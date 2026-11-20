import { Logo } from '@/components/common/Logo';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type Payment } from '@/types/finance';
import { formatINR, formatShortDate } from '@/utils/format';

interface ReceiptViewProps {
  payment: Payment;
}

export function ReceiptView({ payment }: ReceiptViewProps) {
  return (
    <div id="stayops-receipt" className="rounded-2xl border border-border bg-white p-6 text-text">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <Logo />
          <p className="typo-subtitle mt-3">Receipt</p>
          <p className="typo-helper mt-1">Payment confirmation for StayOps</p>
        </div>
        <StatusPill value={PAYMENT_STATUS_LABELS[payment.status]} />
      </div>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="typo-muted">Receipt Number</dt>
          <dd className="mt-1 font-semibold">{payment.receiptNumber}</dd>
        </div>
        <div>
          <dt className="typo-muted">Payment Number</dt>
          <dd className="mt-1 font-semibold">{payment.paymentNumber}</dd>
        </div>
        <div>
          <dt className="typo-muted">Date</dt>
          <dd className="mt-1 font-medium">{formatShortDate(payment.paymentDate)}</dd>
        </div>
        <div>
          <dt className="typo-muted">Invoice</dt>
          <dd className="mt-1 font-medium">{payment.invoiceNumber}</dd>
        </div>
        <div>
          <dt className="typo-muted">Tenant</dt>
          <dd className="mt-1 font-medium">{payment.tenantName}</dd>
        </div>
        <div>
          <dt className="typo-muted">Property / Room</dt>
          <dd className="mt-1 font-medium">
            {payment.propertyName}
            {payment.roomNumber ? ` · ${payment.roomNumber}` : ''}
          </dd>
        </div>
        <div>
          <dt className="typo-muted">Amount</dt>
          <dd className="mt-1 text-lg font-semibold">{formatINR(payment.amount)}</dd>
        </div>
        <div>
          <dt className="typo-muted">Method</dt>
          <dd className="mt-1 font-medium">{PAYMENT_METHOD_LABELS[payment.method]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="typo-muted">Reference</dt>
          <dd className="mt-1 font-medium">{payment.reference || '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
