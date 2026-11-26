import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CHARGE_TYPE_LABELS, ChargeType, type InvoiceFormValues } from '@/types/finance';
import { calculateInvoiceTotal } from '@/utils/financeCalc';
import {
  emptyInvoiceForm,
  validateInvoiceForm,
  type InvoiceFormErrors,
} from '@/utils/financeValidation';
import { formatINR } from '@/utils/format';
import { Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { financeService } from '@/services/finance/financeService';
import { ErrorState } from '@/components/feedback/ErrorState';

interface InvoiceFormModalProps {
  open: boolean;
  submitting: boolean;
  initial?: InvoiceFormValues;
  title?: string;
  selectedTenantLabel?: string;
  onClose: () => void;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
}

export function InvoiceFormModal({
  open,
  submitting,
  initial,
  title = 'Create Invoice',
  selectedTenantLabel,
  onClose,
  onSubmit,
}: InvoiceFormModalProps) {
  const [values, setValues] = useState<InvoiceFormValues>(initial ?? emptyInvoiceForm());
  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const propertiesLoader = useCallback(
    () => (open ? financeService.getProperties() : Promise.resolve([])),
    [open],
  );
  const properties = useAsyncResource(propertiesLoader);
  const tenantKey = `${open}:${values.propertyId ?? ''}`;
  const tenantLoader = useCallback(
    async () => ({
      key: tenantKey,
      items: open ? await financeService.getTenants(values.propertyId) : [],
    }),
    [open, tenantKey, values.propertyId],
  );
  const tenantResource = useAsyncResource(tenantLoader);
  const tenants = tenantResource.data?.key === tenantKey ? tenantResource.data.items : [];

  const totals = calculateInvoiceTotal(values.items, values.discount, values.lateFee);

  const updateItem = (index: number, patch: Partial<InvoiceFormValues['items'][number]>) => {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const submit = async () => {
    const nextErrors = validateInvoiceForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(values);
  };

  return (
    <Modal
      key={initial?.tenantId ?? 'invoice-create'}
      open={open}
      title={title}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'Saving…' : title}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {properties.status === 'error' ? (
          <ErrorState description={properties.error ?? undefined} onRetry={properties.reload} />
        ) : null}
        {tenantResource.status === 'error' ? (
          <ErrorState
            description={tenantResource.error ?? undefined}
            onRetry={tenantResource.reload}
          />
        ) : null}
        <Select
          label="Property"
          name="invoiceProperty"
          value={values.propertyId ?? ''}
          disabled={Boolean(initial)}
          options={[
            { value: '', label: 'All authorized properties' },
            ...(properties.data ?? []).map((p) => ({ value: p.id, label: p.name })),
          ]}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              propertyId: event.target.value,
              tenantId: '',
              items: current.items.map((i) =>
                i.type === ChargeType.RENT ? { ...i, amount: 0 } : i,
              ),
            }))
          }
        />
        <Select
          label="Tenant"
          name="tenantId"
          required
          disabled={
            Boolean(initial) || !tenantResource.data || tenantResource.data.key !== tenantKey
          }
          value={values.tenantId}
          error={errors.tenantId}
          options={[
            {
              value: '',
              label:
                tenantResource.data?.key !== tenantKey
                  ? 'Loading tenants…'
                  : tenants.length
                    ? 'Select tenant'
                    : 'No tenants available',
            },
            ...(initial && !tenants.some((t) => t.id === initial.tenantId)
              ? [
                  {
                    value: initial.tenantId,
                    label: selectedTenantLabel ?? 'Existing invoice tenant',
                  },
                ]
              : []),
            ...tenants.map((tenant) => ({
              value: tenant.id,
              label: `${tenant.fullName} · ${tenant.tenantCode}`,
            })),
          ]}
          onChange={(event) => {
            const tenant = tenants.find((t) => t.id === event.target.value);
            setValues((current) => ({
              ...current,
              tenantId: event.target.value,
              items: current.items.map((i) =>
                i.type === ChargeType.RENT ? { ...i, amount: tenant?.roomRent ?? 0 } : i,
              ),
            }));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextInput
            label="Billing month"
            name="invoiceBillingPeriod"
            type="month"
            required
            value={values.billingPeriod}
            error={errors.billingPeriod}
            onChange={(event) =>
              setValues((current) => ({ ...current, billingPeriod: event.target.value }))
            }
          />
          <DateInput
            label="Issue date"
            name="issueDate"
            required
            value={values.issueDate}
            error={errors.issueDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, issueDate: event.target.value }))
            }
          />
          <DateInput
            label="Due date"
            name="dueDate"
            required
            value={values.dueDate}
            error={errors.dueDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, dueDate: event.target.value }))
            }
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Invoice items</p>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  items: [
                    ...current.items,
                    {
                      id: `item-${Date.now().toString(36)}`,
                      type: ChargeType.OTHER,
                      description: '',
                      amount: 0,
                    },
                  ],
                }))
              }
            >
              Add item
            </Button>
          </div>
          {values.items.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_120px_auto]"
            >
              <Select
                label="Type"
                name={`item-type-${item.id}`}
                value={item.type}
                options={Object.values(ChargeType)
                  .filter((type) => type !== ChargeType.DISCOUNT)
                  .map((type) => ({ value: type, label: CHARGE_TYPE_LABELS[type] }))}
                onChange={(event) => updateItem(index, { type: event.target.value as ChargeType })}
              />
              <TextInput
                label="Description"
                name={`item-desc-${item.id}`}
                value={item.description}
                onChange={(event) => updateItem(index, { description: event.target.value })}
              />
              <TextInput
                label="Amount"
                name={`item-amount-${item.id}`}
                type="number"
                min={1}
                value={item.amount || ''}
                onChange={(event) => updateItem(index, { amount: Number(event.target.value) })}
              />
              <button
                type="button"
                className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-xl text-danger hover:bg-danger/10"
                aria-label="Remove item"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    items: current.items.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {errors.itemsAmount ? <p className="text-sm text-danger">{errors.itemsAmount}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Discount"
            name="discount"
            type="number"
            min={0}
            value={values.discount || ''}
            error={errors.discount}
            onChange={(event) =>
              setValues((current) => ({ ...current, discount: Number(event.target.value) || 0 }))
            }
          />
          <TextInput
            label="Late fee"
            name="lateFee"
            type="number"
            min={0}
            value={values.lateFee || ''}
            error={errors.lateFee}
            onChange={(event) =>
              setValues((current) => ({ ...current, lateFee: Number(event.target.value) || 0 }))
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-background p-3 text-sm sm:grid-cols-4">
          <div>
            <p className="typo-muted">Subtotal</p>
            <p className="mt-1 font-semibold">{formatINR(totals.subtotal)}</p>
          </div>
          <div>
            <p className="typo-muted">Discount</p>
            <p className="mt-1 font-semibold">{formatINR(values.discount)}</p>
          </div>
          <div>
            <p className="typo-muted">Total</p>
            <p className="mt-1 font-semibold">{formatINR(totals.total)}</p>
          </div>
          <div>
            <p className="typo-muted">Outstanding</p>
            <p className="mt-1 font-semibold">{formatINR(totals.total)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
