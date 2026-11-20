import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { SupportForm } from '@/components/support/SupportForm';
import { SupportTicketCard } from '@/components/support/SupportTicketCard';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import {
  PATHS,
  adminSupportDetailPath,
  tenantSupportDetailPath,
  wardenSupportDetailPath,
} from '@/routes/paths';
import { supportService } from '@/services/support/supportService';
import {
  SUPPORT_CATEGORY_LABELS,
  SUPPORT_STATUS_LABELS,
  SupportCategory,
  SupportStatus,
  type SupportFilters,
  type SupportFormValues,
  type SupportRequest,
} from '@/types/support';
import type { DataTableColumn } from '@/types/ui';
import { formatDateTime } from '@/utils/format';
import { emptySupportFilters, summarizeSupport } from '@/utils/supportRules';
import { emptySupportForm, validateSupportForm, type SupportFormErrors } from '@/utils/supportValidation';
import { Headset, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function detailHref(pathname: string, id: string): string {
  if (pathname.startsWith('/tenant')) return tenantSupportDetailPath(id);
  if (pathname.startsWith('/warden')) return wardenSupportDetailPath(id);
  return adminSupportDetailPath(id);
}

export function SupportListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.SUPPORT_CREATE) && isTenant;
  const propertyIds = isWarden ? user?.propertyIds : undefined;
  const homeHref = isTenant ? PATHS.tenant.help : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;

  const loader = useCallback(() => {
    if (isTenant && user) return supportService.getTenantSupportRequests(user.id);
    return supportService.getSupportRequests(propertyIds);
  }, [isTenant, propertyIds, user]);

  const { data, status, error, reload } = useAsyncResource(loader);
  const [filters, setFilters] = useState<SupportFilters>(emptySupportFilters());
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<SupportFormValues>(emptySupportForm());
  const [formErrors, setFormErrors] = useState<SupportFormErrors>({});
  const [saving, setSaving] = useState(false);

  const requests = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return requests.filter((item) => {
      if (filters.category && item.category !== filters.category) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (!query) return true;
      return item.subject.toLowerCase().includes(query) || item.supportCode.toLowerCase().includes(query) || item.tenantName.toLowerCase().includes(query);
    });
  }, [filters, requests]);
  const summary = summarizeSupport(requests);

  const columns: DataTableColumn<SupportRequest>[] = [
    { id: 'code', header: 'Request ID', accessor: 'supportCode' },
    {
      id: 'subject',
      header: 'Subject',
      render: (row) => (
        <div>
          <p className="font-medium">{row.subject}</p>
          <p className="typo-helper">{row.tenantName}</p>
        </div>
      ),
    },
    { id: 'category', header: 'Category', render: (row) => SUPPORT_CATEGORY_LABELS[row.category] },
    { id: 'status', header: 'Status', render: (row) => <StatusPill value={SUPPORT_STATUS_LABELS[row.status]} /> },
    { id: 'created', header: 'Created', render: (row) => formatDateTime(row.createdAt) },
    { id: 'updated', header: 'Updated', render: (row) => formatDateTime(row.updatedAt) },
    {
      id: 'actions',
      header: '',
      render: (row) => (
        <Button size="sm" variant="outline" onClick={() => navigate(detailHref(location.pathname, row.id))}>
          View
        </Button>
      ),
    },
  ];

  const create = async () => {
    if (!user) return;
    const errors = validateSupportForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const created = await supportService.createSupportRequest(user.id, formValues);
      toast('success', 'Support request created.');
      setFormOpen(false);
      navigate(tenantSupportDetailPath(created.id));
    } catch (cause) {
      toast('error', 'Unable to create support request.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isTenant ? 'My Support Requests' : 'Support'}
        description={isTenant ? 'Account, document and payment questions — separate from maintenance complaints.' : 'Review and update tenant support requests.'}
        breadcrumbs={[
          { label: 'Home', href: isTenant ? PATHS.tenant.dashboard : homeHref },
          ...(isTenant ? [{ label: 'Help & Support', href: PATHS.tenant.help }] : []),
          { label: isTenant ? 'Support Requests' : 'Support' },
        ]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              New request
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? <ErrorState description={error ?? undefined} onRetry={reload} /> : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'new', label: 'Open', value: String(summary.open), tone: 'warning' }} />
            <StatCard metric={{ id: 'progress', label: 'In progress', value: String(summary.inProgress), tone: 'info' }} />
            <StatCard metric={{ id: 'done', label: 'Resolved', value: String(summary.resolved), tone: 'success' }} />
            <StatCard metric={{ id: 'complaints', label: 'Closed', value: String(summary.closed), tone: 'primary' }} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <SearchInput
              value={filters.query}
              placeholder="Search subject"
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
            <Select
              name="category"
              placeholder="Category"
              value={filters.category}
              options={[{ value: '', label: 'All categories' }, ...Object.values(SupportCategory).map((value) => ({ value, label: SUPPORT_CATEGORY_LABELS[value] }))]}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as SupportFilters['category'] }))}
            />
            <Select
              name="status"
              placeholder="Status"
              value={filters.status}
              options={[{ value: '', label: 'All statuses' }, ...Object.values(SupportStatus).map((value) => ({ value, label: SUPPORT_STATUS_LABELS[value] }))]}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as SupportFilters['status'] }))}
            />
          </div>
          {isTenant ? (
            filtered.length ? (
              <div className="grid gap-3">
                {filtered.map((request) => (
                  <SupportTicketCard key={request.id} request={request} href={detailHref(location.pathname, request.id)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Headset className="h-8 w-8" />} title="No support requests yet." description="Create a request from Help if you need account or document assistance." />
            )
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={false}
              emptyTitle="No support requests yet."
              emptyDescription="Tenant account questions will appear here."
              renderMobile={(row) => <SupportTicketCard request={row} href={detailHref(location.pathname, row.id)} />}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title="New support request"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => void create()}>
              {saving ? 'Submitting…' : 'Submit'}
            </Button>
          </>
        }
      >
        <SupportForm values={formValues} errors={formErrors} onChange={setFormValues} />
      </Modal>
    </div>
  );
}
