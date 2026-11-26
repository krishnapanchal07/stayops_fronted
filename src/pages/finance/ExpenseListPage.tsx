import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Dropdown } from '@/components/common/Dropdown';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ExpenseFormModal } from '@/components/finance/ExpenseFormModal';
import { Select } from '@/components/forms/Select';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { expenseDetailPath, financeHomePath, scopeFromPath } from '@/routes/financePaths';
import { financeService } from '@/services/finance/financeService';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  ExpenseCategory,
  ExpenseStatus,
  PAYMENT_METHOD_LABELS,
  type Expense,
  type ExpenseFilters,
} from '@/types/finance';
import type { DataTableColumn } from '@/types/ui';
import { emptyExpenseFilters } from '@/utils/financeValidation';
import { formatINR, formatShortDate } from '@/utils/format';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useFinanceTable } from '@/hooks/useFinanceTable';
import { TextInput } from '@/components/forms/TextInput';
import { useLocation, useNavigate } from 'react-router-dom';

export function ExpenseListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const scope = scopeFromPath(location.pathname);
  const staffScope = scope === 'tenant' ? 'admin' : scope;
  const canManage = useHasPermission(Permission.EXPENSE_CREATE);

  const propertiesLoader = useCallback(() => financeService.getProperties(), []);
  const summaryLoader = useCallback(() => financeService.getExpenseSummary(), []);
  const propertyResource = useAsyncResource(propertiesLoader);
  const { data: properties } = propertyResource;
  const summaryResource = useAsyncResource(summaryLoader);
  const { data: summary, reload: reloadSummary } = summaryResource;

  const [filters, setFilters] = useState<ExpenseFilters>(emptyExpenseFilters());
  const { data, status, error, reload, search, setSearch, tableProps } = useFinanceTable<Expense>(
    'expenses',
    { ...filters },
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = data?.items ?? [];

  const columns: DataTableColumn<Expense>[] = [
    {
      id: 'expenseDate',
      header: 'Date',
      accessor: 'expenseDate',
      sortable: true,
      render: (row) => formatShortDate(row.expenseDate),
    },
    { id: 'propertyName', header: 'Property', accessor: 'propertyName', sortable: true },
    {
      id: 'category',
      header: 'Category',
      accessor: 'category',
      render: (row) => EXPENSE_CATEGORY_LABELS[row.category],
    },
    { id: 'description', header: 'Description', accessor: 'description' },
    { id: 'vendor', header: 'Vendor', accessor: 'vendor' },
    {
      id: 'amount',
      header: 'Amount',
      accessor: 'amount',
      sortable: true,
      render: (row) => formatINR(row.amount),
    },
    {
      id: 'paymentMethod',
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => PAYMENT_METHOD_LABELS[row.paymentMethod],
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusPill value={EXPENSE_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          iconTriggerLabel={`Actions for ${row.expenseNumber}`}
          trigger={<MoreHorizontal className="h-4 w-4" />}
          items={[
            {
              id: 'view',
              label: 'View',
              onSelect: () => navigate(expenseDetailPath(staffScope, row.id)),
            },
            ...(canManage
              ? [
                  { id: 'edit', label: 'Edit', onSelect: () => setEditing(row) },
                  { id: 'delete', label: 'Cancel', onSelect: () => setDeleteTarget(row) },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Track property operating costs separately from tenant collections."
        breadcrumbs={[{ label: 'Home', href: financeHomePath(scope) }, { label: 'Expenses' }]}
        actions={
          canManage ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Add Expense
            </Button>
          ) : null
        }
      />

      {propertyResource.status === 'error' ? (
        <ErrorState
          description={propertyResource.error ?? 'Unable to load properties.'}
          onRetry={propertyResource.reload}
        />
      ) : null}
      {summaryResource.status === 'error' ? (
        <ErrorState
          description={summaryResource.error ?? 'Unable to load financial statistics.'}
          onRetry={reloadSummary}
        />
      ) : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load expenses.'} onRetry={reload} />
      ) : null}

      {status !== 'error' ? (
        <div className="space-y-5">
          {summary ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                metric={{
                  id: 'total',
                  label: 'Total Expenses',
                  value: formatINR(summary?.total ?? 0),
                  tone: 'warning',
                }}
              />
              <StatCard
                metric={{
                  id: 'month',
                  label: 'This Month',
                  value: formatINR(summary?.thisMonth ?? 0),
                  tone: 'primary',
                }}
              />
              <StatCard
                metric={{
                  id: 'year',
                  label: 'This Year',
                  value: formatINR(summary?.thisYear ?? 0),
                  tone: 'info',
                }}
              />
            </div>
          ) : null}

          <Card>
            <TextInput
              label="Search"
              name="financeSearch"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <CardHeader title="Category breakdown" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Object.values(ExpenseCategory).map((category) => {
                const amount =
                  summary?.breakdown.find((item) => item.category === category)?.amount ?? 0;
                return (
                  <div key={category} className="rounded-xl bg-background p-3">
                    <p className="typo-muted">{EXPENSE_CATEGORY_LABELS[category]}</p>
                    <p className="mt-1 font-semibold">{formatINR(amount)}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
            <Select
              label="Property"
              name="propertyId"
              value={filters.propertyId}
              options={[
                { value: '', label: 'All properties' },
                ...(properties ?? []).map((property) => ({
                  value: property.id,
                  label: property.name,
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, propertyId: event.target.value }))
              }
            />
            <Select
              label="Category"
              name="category"
              value={filters.category}
              options={[
                { value: '', label: 'All categories' },
                ...Object.values(ExpenseCategory).map((value) => ({
                  value,
                  label: EXPENSE_CATEGORY_LABELS[value],
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value as ExpenseFilters['category'],
                }))
              }
            />
            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={[
                { value: '', label: 'All statuses' },
                ...Object.values(ExpenseStatus).map((value) => ({
                  value,
                  label: EXPENSE_STATUS_LABELS[value],
                })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as ExpenseFilters['status'],
                }))
              }
            />
          </div>

          <Card>
            <CardHeader title="Expense register" />
            <DataTable
              columns={columns}
              data={filtered}
              {...tableProps}
              rowKey={(row) => row.id}
              searchPlaceholder="Search description, vendor or property…"
              emptyTitle="No expenses found."
            />
          </Card>
        </div>
      ) : null}

      {formOpen || editing ? (
        <ExpenseFormModal
          key={editing?.id ?? 'new-expense'}
          open={formOpen || Boolean(editing)}
          properties={properties ?? []}
          submitting={saving}
          title={editing ? 'Edit Expense' : 'Add Expense'}
          initial={
            editing
              ? {
                  propertyId: editing.propertyId,
                  category: editing.category,
                  description: editing.description,
                  amount: editing.amount,
                  expenseDate: editing.expenseDate,
                  vendor: editing.vendor,
                  paymentMethod: editing.paymentMethod,
                  status: editing.status,
                  notes: editing.notes,
                }
              : undefined
          }
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={async (values) => {
            setSaving(true);
            try {
              if (editing) {
                await financeService.updateExpense(editing.id, values);
                toast('success', 'Expense updated', editing.expenseNumber);
              } else {
                const created = await financeService.createExpense(
                  values,
                  user?.name ?? 'Accountant',
                );
                toast('success', 'Expense added', created.expenseNumber);
              }
              setFormOpen(false);
              setEditing(null);
              reload();
              reloadSummary();
            } catch (cause) {
              toast(
                'error',
                'Unable to save expense',
                cause instanceof Error ? cause.message : 'Please try again.',
              );
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}

      <Modal
        open={Boolean(deleteTarget)}
        title="Cancel expense"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={saving}
              onClick={async () => {
                if (!deleteTarget) return;
                setSaving(true);
                try {
                  await financeService.deleteExpense(deleteTarget.id);
                  toast('success', 'Expense cancelled', deleteTarget.expenseNumber);
                  setDeleteTarget(null);
                  reload();
                  reloadSummary();
                } catch (cause) {
                  toast(
                    'error',
                    'Unable to cancel',
                    cause instanceof Error ? cause.message : 'Please try again.',
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              Cancel expense
            </Button>
          </>
        }
      >
        <p className="text-sm text-text">
          Cancel {deleteTarget?.expenseNumber}? The record will remain in the register and be
          excluded from paid expense totals.
        </p>
      </Modal>
    </div>
  );
}
