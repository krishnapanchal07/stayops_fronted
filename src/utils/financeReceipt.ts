import { workflowRequest } from '@/services/http/workflows';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type Payment } from '@/types/finance';
import { formatINR } from '@/utils/format';

export async function downloadReceipt(record: Payment): Promise<void> {
  let payment: Payment;
  try {
    payment = await workflowRequest<Payment>('get',`/finance/payments/${encodeURIComponent(record.id)}/receipt`);
  } catch (cause) {
    window.alert(cause instanceof Error ? cause.message : 'Unable to load receipt. Please retry.');
    return;
  }
  const content = [
    'StayOps Receipt',
    `Receipt: ${payment.receiptNumber}`,
    `Payment: ${payment.paymentNumber}`,
    `Date: ${payment.paymentDate}`,
    `Tenant: ${payment.tenantName}`,
    `Property: ${payment.propertyName}`,
    `Room: ${payment.roomNumber ?? '—'}`,
    `Invoice: ${payment.invoiceNumber}`,
    `Amount: ${formatINR(payment.amount)}`,
    `Method: ${PAYMENT_METHOD_LABELS[payment.method]}`,
    `Reference: ${payment.reference || '—'}`,
    `Status: ${PAYMENT_STATUS_LABELS[payment.status]}`,
  ].join('\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${payment.receiptNumber}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
