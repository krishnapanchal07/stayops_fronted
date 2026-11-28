import { workflowRequest } from '@/services/http/workflows';
import { financeUrl } from './api';

export interface RazorpayAttempt {
  id: string;
  invoiceId: string;
  propertyId: string;
  status: 'CREATING' | 'OPEN' | 'PENDING' | 'FAILED' | 'APPLIED' | 'RECONCILIATION_REQUIRED';
  amountPaise: number;
  currency: 'INR';
  providerOrderId: string | null;
  providerPaymentId: string | null;
  paymentId: string | null;
  detail: string | null;
  isTest: true;
  keyId?: string;
  invoiceNumber?: string;
}

export interface CheckoutResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

const base = '/finance/me/razorpay';

export const razorpayService = {
  config: () => workflowRequest<{ available: boolean; isTest: true }>('get', `${base}/config`),
  orders: (invoiceId?: string) => workflowRequest<RazorpayAttempt[]>('get',
    financeUrl('razorpay/attempts', { invoiceId })),
  create: (invoiceId: string) => workflowRequest<RazorpayAttempt>('post', `${base}/orders`, { invoiceId }),
  verify: (attemptId: string, result: CheckoutResult) => workflowRequest<RazorpayAttempt>('post',
    `${base}/verify`, { attemptId, ...result }),
  recheck: (id: string) => workflowRequest<RazorpayAttempt>('post',
    `${base}/orders/${encodeURIComponent(id)}/recheck`),
};
