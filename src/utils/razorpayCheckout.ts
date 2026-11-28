import type { CheckoutResult, RazorpayAttempt } from '@/services/finance/razorpayService';

interface CheckoutOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: 'INR';
  name: string;
  description: string;
  theme: { color: string };
  handler: (result: CheckoutResult) => void;
  modal: { ondismiss: () => void };
}

interface Checkout {
  open: () => void;
  on: (event: 'payment.failed', handler: () => void) => void;
}
type CheckoutConstructor = new (options: CheckoutOptions) => Checkout;

declare global {
  interface Window {
    Razorpay?: CheckoutConstructor;
  }
}

let loading: Promise<CheckoutConstructor> | undefined;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!loading) {
    loading = new Promise<CheckoutConstructor>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      const fail = () => {
        window.clearTimeout(timeout);
        script.remove();
        reject(new Error('Could not load Razorpay Checkout. Try again.'));
      };
      const timeout = window.setTimeout(fail, 15000);
      script.onerror = fail;
      script.onload = () => {
        window.clearTimeout(timeout);
        if (window.Razorpay) resolve(window.Razorpay);
        else fail();
      };
      document.head.append(script);
    }).catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}

export async function openRazorpay(order: RazorpayAttempt, onFailure: () => void) {
  if (!order.keyId?.startsWith('rzp_test_') || !order.providerOrderId || !order.isTest) {
    throw new Error('Razorpay Test Mode order is unavailable.');
  }
  const Checkout = await loadRazorpay();
  const { keyId, providerOrderId } = order;
  return new Promise<CheckoutResult | null>((resolve) => {
    const checkout = new Checkout({ key: keyId, order_id: providerOrderId, amount: order.amountPaise,
      currency: order.currency, name: 'StayOps', description: `Test Mode · ${order.invoiceNumber}`,
      theme: { color: '#4f46e5' }, handler: resolve, modal: { ondismiss: () => resolve(null) } });
    checkout.on('payment.failed', onFailure);
    checkout.open();
  });
}
