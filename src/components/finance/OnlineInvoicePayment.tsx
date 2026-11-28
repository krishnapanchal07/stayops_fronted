import { useCallback, useRef, useState } from 'react';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useToast } from '@/hooks/useToast';
import { razorpayService, type RazorpayAttempt } from '@/services/finance/razorpayService';
import type { Invoice } from '@/types/finance';
import { eligibleForOnlinePayment } from '@/utils/financeCalc';
import { formatINR } from '@/utils/format';
import { loadRazorpay, openRazorpay } from '@/utils/razorpayCheckout';

const stateLabels: Record<RazorpayAttempt['status'], string> = {
  CREATING: 'Waiting for order confirmation',
  OPEN: 'Checkout available',
  PENDING: 'Waiting for payment confirmation',
  FAILED: 'Payment declined',
  APPLIED: 'Verified and applied',
  RECONCILIATION_REQUIRED: 'Needs review by your property office',
};

export function OnlineInvoicePayment({ invoice, onApplied }: { invoice: Invoice; onApplied: () => void }) {
  const config = useAsyncResource(razorpayService.config);
  const load = useCallback(() => razorpayService.orders(invoice.id), [invoice.id]);
  const attempts = useAsyncResource(load);
  const toast = useToast();
  const lock = useRef(false);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const needsReview = attempts.data?.some((item) => item.status === 'RECONCILIATION_REQUIRED');
  const unconfirmed = attempts.data?.some((item) => ['CREATING', 'PENDING'].includes(item.status));

  async function run(action: () => Promise<RazorpayAttempt | null>, label: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(label);
    setMessage('');
    try {
      const result = await action();
      if (result?.status === 'APPLIED') {
        toast('success', 'Verified Razorpay Test Mode payment', 'No real money was transferred.');
        onApplied();
      } else if (result) {
        setMessage(result.detail ?? stateLabels[result.status]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to check the Test Mode payment.');
    } finally {
      attempts.reload();
      lock.current = false;
      setBusy('');
    }
  }

  function pay() {
    void run(async () => {
      await loadRazorpay();
      const order = await razorpayService.create(invoice.id);
      if (!order.keyId) return order;
      setBusy('Razorpay Checkout open');
      const result = await openRazorpay(order, () => {
        setMessage('Razorpay declined the test payment. Retry in Checkout or close it and check the order later.');
      });
      if (!result) {
        setMessage('Checkout closed. Check the order status before retrying if you already submitted a payment.');
        return null;
      }
      setBusy('Verifying payment…');
      return razorpayService.verify(order.id, result);
    }, 'Starting Test Checkout…');
  }

  if (!eligibleForOnlinePayment(invoice) && !attempts.data?.length && !busy && !message) return null;

  return (
    <Card>
      <CardHeader title="Razorpay Test Mode" />
      <p className="typo-helper mb-3">No real money will be transferred.</p>
      {eligibleForOnlinePayment(invoice) ? (
        config.data?.available ? (
          !needsReview && !unconfirmed ? (
            <Button disabled={Boolean(busy) || attempts.status !== 'success'} onClick={pay}>
              Pay Now · {formatINR(invoice.outstandingAmount)}
            </Button>
          ) : null
        ) : <p className="typo-helper">{config.status === 'loading' ? 'Checking availability…' :
          'Online payment unavailable. Contact your property office.'}</p>
      ) : null}
      {config.status === 'error' || attempts.status === 'error' ? (
        <Button size="sm" variant="ghost" onClick={() => { config.reload(); attempts.reload(); }}>Retry loading</Button>
      ) : null}
      <p className="typo-helper mt-2" role="status">{busy || message}</p>
      {attempts.data?.length ? (
        <ul className="mt-3 space-y-2">
          {attempts.data.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{formatINR(item.amountPaise / 100)} · {stateLabels[item.status]}</span>
              {config.data?.available && !['APPLIED', 'RECONCILIATION_REQUIRED'].includes(item.status) ? (
                <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() =>
                  void run(() => razorpayService.recheck(item.id), 'Checking Razorpay…')}>
                  Check status
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
