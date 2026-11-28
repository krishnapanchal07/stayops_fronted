import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { PATHS } from '@/routes/paths';
import { propertyService } from '@/services/property/propertyService';
import { reportService } from '@/services/report/reportService';
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS, PaymentStatus, PAYMENT_STATUS_LABELS } from '@/types/finance';
import {
  FINANCE_REPORT_TYPES,
  REPORT_TYPE_LABELS,
  ReportType,
  type ReportFilters,
  type ReportBreakdownRow,
} from '@/types/report';
import type { DataTableColumn } from '@/types/ui';
import { Download, Printer } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

function emptyReportFilters(type: ReportType): ReportFilters {
  return { type, propertyId: '', fromDate: '', toDate: '', status: '', category: '' };
}

function downloadCsv(title: string, columns: { id: string; header: string }[], rows: ReportBreakdownRow[]) {
  const header = columns.map((column) => `"${column.header}"`).join(',');
  const body = rows
    .map((row) => columns.map((column) => `"${String(row.values[column.id] ?? '')}"`).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/\s+/g, '-').toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const location = useLocation();
  const isAccountant = location.pathname.startsWith('/accountant');
  const availableTypes = FINANCE_REPORT_TYPES;
  const [filters, setFilters] = useState<ReportFilters>(emptyReportFilters(availableTypes[0]));
  const homeHref = isAccountant ? PATHS.accountant.dashboard : PATHS.admin.dashboard;

  const reportLoader = useCallback(() => reportService.getReport(filters), [filters]);
  const propertiesLoader = useCallback(() => propertyService.getProperties(), []);
  const { data, status, error, reload } = useAsyncResource(reportLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);

  const columns: DataTableColumn<ReportBreakdownRow>[] = useMemo(
    () =>
      (data?.columns ?? []).map((column) => ({
        id: column.id,
        header: column.header,
        accessor: 'label' as const,
        sortable: true,
        render: (row) => String(row.values[column.id] ?? '—'),
      })),
    [data?.columns],
  );

  const showStatus = filters.type === ReportType.PAYMENTS;
  const showCategory = filters.type === ReportType.EXPENSES;

  return (
    <div>
      <PageHeader
        title="Finance Reports"
        description="Review revenue, payments, outstanding balances and expenses."
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: 'Finance Reports' }]}
        actions={
          data ? (
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => downloadCsv(data.title, data.columns, data.rows)}
              >
                Export CSV
              </Button>
              <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
                Print Report
              </Button>
            </div>
          ) : null
        }
      />

      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            name="reportType"
            label="Report type"
            value={filters.type}
            options={availableTypes.map((value) => ({ value, label: REPORT_TYPE_LABELS[value] }))}
            onChange={(event) => setFilters(emptyReportFilters(event.target.value as ReportType))}
          />
          <Select
            name="property"
            label="Property"
            value={filters.propertyId}
            options={[
              { label: 'All properties', value: '' },
              ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
            ]}
            onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
          />
          <DateInput
            label="From"
            name="fromDate"
            value={filters.fromDate}
            onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
          />
          <DateInput
            label="To"
            name="toDate"
            value={filters.toDate}
            onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))}
          />
          {showStatus ? (
            <Select
              name="status"
              label="Status"
              value={filters.status}
              options={[
                { label: 'All statuses', value: '' },
                ...Object.values(PaymentStatus).map((value) => ({ value, label: PAYMENT_STATUS_LABELS[value] })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            />
          ) : null}
          {showCategory ? (
            <Select
              name="category"
              label="Category"
              value={filters.category}
              options={[
                { label: 'All categories', value: '' },
                ...Object.values(ExpenseCategory).map((value) => ({
                  value,
                  label: EXPENSE_CATEGORY_LABELS[value],
                })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
            />
          ) : null}
        </div>
      </Card>

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? 'Unable to build this report.'} onRetry={reload} /> : null}

      {status === 'success' && data ? (
        <div className="space-y-5 print:space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((item) => (
              <StatCard
                key={item.id}
                metric={{
                  id: item.id,
                  label: item.label,
                  value: item.value,
                  tone: item.tone === 'info' || item.tone === 'danger' || item.tone === 'success' || item.tone === 'warning' ? item.tone : 'primary',
                }}
              />
            ))}
          </div>

          {data.trend && data.trend.length > 0 ? <TrendChart title="Monthly collected" data={data.trend} /> : null}

          <DataTable
            key={data.type}
            columns={columns}
            data={data.rows}
            rowKey={(row) => row.id}
            searchable={false}
            pageSize={12}
            emptyTitle="No report rows."
            emptyDescription="Try a different date range or property."
            renderMobile={(row) => (
              <div className="rounded-2xl border border-border bg-background p-4 text-sm">
                <p className="font-semibold text-text">{row.label}</p>
                <ul className="mt-2 space-y-1">
                  {data.columns.map((column) => (
                    <li key={column.id}>
                      <span className="typo-muted">{column.header}: </span>
                      {String(row.values[column.id] ?? '—')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
