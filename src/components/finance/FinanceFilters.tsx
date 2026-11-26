import { useCallback } from 'react';
import { Card, CardHeader } from '@/components/common/Card';
import { Select } from '@/components/forms/Select';
import { DateInput } from '@/components/forms/DateInput';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { financeService } from '@/services/finance/financeService';
export interface FinanceDashboardFilters {
  propertyId: string;
  fromDate: string;
  toDate: string;
}
export function FinanceFilters({
  value,
  onChange,
}: {
  value: FinanceDashboardFilters;
  onChange: (next: FinanceDashboardFilters) => void;
}) {
  const loader = useCallback(() => financeService.getProperties(), []);
  const resource = useAsyncResource(loader);
  return (
    <Card>
      <CardHeader title="Finance filters" />
      {resource.status === 'error' ? (
        <ErrorState description={resource.error ?? undefined} onRetry={resource.reload} />
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          label="Property"
          name="dashboardFinanceProperty"
          value={value.propertyId}
          disabled={resource.status !== 'success'}
          options={[
            {
              value: '',
              label:
                resource.status === 'loading' ? 'Loading properties…' : 'All authorized properties',
            },
            ...(resource.data ?? []).map((p) => ({ value: p.id, label: p.name })),
          ]}
          onChange={(event) => onChange({ ...value, propertyId: event.target.value })}
        />
        <DateInput
          label="From date"
          name="dashboardFinanceFrom"
          value={value.fromDate}
          max={value.toDate || undefined}
          onChange={(event) => onChange({ ...value, fromDate: event.target.value })}
        />
        <DateInput
          label="To date"
          name="dashboardFinanceTo"
          value={value.toDate}
          min={value.fromDate || undefined}
          onChange={(event) => onChange({ ...value, toDate: event.target.value })}
        />
      </div>
    </Card>
  );
}
