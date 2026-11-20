import { CHARGE_TYPE_LABELS, type Invoice } from '@/types/finance';
import { formatINR } from '@/utils/format';

interface InvoiceItemsTableProps {
  invoice: Invoice;
}

export function InvoiceItemsTable({ invoice }: InvoiceItemsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="typo-muted">
            <th className="pb-3 font-medium">Item</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id} className="border-t border-border">
              <td className="py-3 font-medium text-text">{item.description}</td>
              <td className="py-3 text-muted">{CHARGE_TYPE_LABELS[item.type]}</td>
              <td className="py-3 text-right">{formatINR(item.amount)}</td>
            </tr>
          ))}
          {invoice.lateFee > 0 ? (
            <tr className="border-t border-border">
              <td className="py-3 font-medium text-text">Late Fee</td>
              <td className="py-3 text-muted">Late Fee</td>
              <td className="py-3 text-right">{formatINR(invoice.lateFee)}</td>
            </tr>
          ) : null}
          {invoice.discount > 0 ? (
            <tr className="border-t border-border">
              <td className="py-3 font-medium text-text">Discount</td>
              <td className="py-3 text-muted">Discount</td>
              <td className="py-3 text-right text-success">-{formatINR(invoice.discount)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="typo-muted">Subtotal</dt>
          <dd className="font-medium">{formatINR(invoice.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="typo-muted">Paid</dt>
          <dd className="font-medium text-success">{formatINR(invoice.paidAmount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold">Outstanding</dt>
          <dd className={`font-semibold ${invoice.outstandingAmount > 0 ? 'text-danger' : 'text-success'}`}>
            {formatINR(invoice.outstandingAmount)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold">{formatINR(invoice.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
