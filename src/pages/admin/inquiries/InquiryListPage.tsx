import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Select } from '@/components/forms/Select';
import { ConvertInquiryModal } from '@/components/inquiries/ConvertInquiryModal';
import { InquiryStatusModal } from '@/components/inquiries/InquiryStatusModal';
import { DataTable } from '@/components/tables/DataTable';
import { Dropdown } from '@/components/common/Dropdown';
import { IconButton } from '@/components/ui/IconButton';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { inquiryDetailPath, PATHS, wardenInquiryDetailPath } from '@/routes/paths';
import { inquiryService } from '@/services/inquiry/inquiryService';
import { propertyService } from '@/services/property/propertyService';
import { INQUIRY_STATUS_LABELS, InquiryStatus, type Inquiry, type InquiryFilters } from '@/types/inquiry';
import type { DataTableColumn } from '@/types/ui';
import { formatINR, formatPhone, formatShortDate } from '@/utils/format';
import { allowedInquiryTransitions, emptyInquiryFilters, filterInquiries, summarizeInquiries } from '@/utils/inquiryStats';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function InquiryListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const user = useCurrentUser();
  const isWarden = location.pathname.startsWith('/warden');
  const canManage = useHasPermission(Permission.INQUIRY_MANAGE);
  const canConvert = useHasPermission(Permission.TENANT_CREATE);
  const homeHref = isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;
  const detailPath = isWarden ? wardenInquiryDetailPath : inquiryDetailPath;

  const propertyIds = isWarden ? user?.propertyIds : undefined;

  const inquiriesLoader = useCallback(() => inquiryService.getInquiries(propertyIds), [propertyIds]);
  const propertiesLoader = useCallback(async () => {
    const properties = await propertyService.getProperties();
    if (!propertyIds?.length) return properties;
    return properties.filter((property) => propertyIds.includes(property.id));
  }, [propertyIds]);
  const { data, status, error, reload } = useAsyncResource(inquiriesLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);

  const [filters, setFilters] = useState<InquiryFilters>(emptyInquiryFilters());
  const [statusTarget, setStatusTarget] = useState<Inquiry | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Inquiry | null>(null);
  const [convertSaving, setConvertSaving] = useState(false);
  const [bedAvailable, setBedAvailable] = useState(false);

  const inquiries = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => filterInquiries(inquiries, filters), [filters, inquiries]);
  const summary = useMemo(() => summarizeInquiries(inquiries), [inquiries]);

  const openConvert = async (inquiry: Inquiry) => {
    try {
      const availability = inquiry.bedId ? await inquiryService.getInventoryAvailability() : null;
      setBedAvailable(Boolean(inquiry.bedId && availability?.[inquiry.roomId]?.[inquiry.bedId]));
      setConvertTarget(inquiry);
    } catch (cause) {
      toast('error', cause instanceof Error ? cause.message : 'Unable to check bed availability.');
    }
  };

  const columns: DataTableColumn<Inquiry>[] = [
    {
      id: 'fullName',
      header: 'Inquirer',
      accessor: 'fullName',
      sortable: true,
      render: (row) => <span className="font-semibold text-text">{row.fullName}</span>,
    },
    {
      id: 'room',
      header: 'Room / Bed',
      accessor: 'listingTitle',
      sortable: true,
    },
    { id: 'property', header: 'Property', accessor: 'propertyName', sortable: true },
    {
      id: 'phone',
      header: 'Phone',
      accessor: 'phone',
      render: (row) => formatPhone(row.phone),
    },
    {
      id: 'rent',
      header: 'Rent',
      accessor: 'monthlyRent',
      sortable: true,
      render: (row) => formatINR(row.monthlyRent),
    },
    {
      id: 'createdAt',
      header: 'Submitted',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => formatShortDate(row.createdAt),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <StatusPill value={INQUIRY_STATUS_LABELS[row.status]} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      render: (row) => (
        <Dropdown
          align="right"
          trigger={
            <IconButton label={`Actions for ${row.fullName}`} variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </IconButton>
          }
          items={[
            { id: 'view', label: 'View', onSelect: () => navigate(detailPath(row.id)) },
            ...(canManage && allowedInquiryTransitions(row.status).length > 0
              ? [{ id: 'status', label: 'Change Status', onSelect: () => setStatusTarget(row) }]
              : []),
            ...(canConvert && row.kind === 'ROOM' && row.status === InquiryStatus.APPROVED
              ? [{ id: 'convert', label: 'Convert to Tenant', onSelect: () => void openConvert(row) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Inquiries"
        description="Review visitor and student inquiries before they become tenants."
        breadcrumbs={[{ label: 'Home', href: homeHref }, { label: 'Inquiries' }]}
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState description={error ?? 'Unable to load inquiries.'} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'submitted', label: 'Submitted', value: String(summary.submitted), tone: 'warning' }} />
            <StatCard metric={{ id: 'pipeline', label: 'In Review', value: String(summary.contacted + summary.shortlisted), tone: 'info' }} />
            <StatCard metric={{ id: 'approved', label: 'Approved', value: String(summary.approved), tone: 'primary' }} />
            <StatCard metric={{ id: 'converted', label: 'Converted', value: String(summary.converted), tone: 'success' }} />
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Select
              label="Property"
              name="propertyId"
              value={filters.propertyId}
              options={[
                { value: '', label: 'All properties' },
                ...(properties ?? []).map((property) => ({ value: property.id, label: property.name })),
              ]}
              onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
            />
            <Select
              label="Status"
              name="status"
              value={filters.status}
              options={[
                { value: '', label: 'All statuses' },
                ...Object.values(InquiryStatus).map((value) => ({ value, label: INQUIRY_STATUS_LABELS[value] })),
              ]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value as InquiryFilters['status'] }))
              }
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No inquiries found" description="New Find Room inquiries will appear here." />
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchPlaceholder="Search name, email, room…"
            />
          )}
        </div>
      ) : null}

      <InquiryStatusModal
        key={statusTarget ? `${statusTarget.id}-${statusTarget.status}` : 'status-closed'}
        open={Boolean(statusTarget)}
        inquiry={statusTarget}
        submitting={statusSaving}
        onClose={() => setStatusTarget(null)}
        onSubmit={async (nextStatus, note) => {
          if (!statusTarget) return;
          setStatusSaving(true);
          try {
            await inquiryService.changeInquiryStatus(statusTarget.id, nextStatus, user?.name ?? 'StayOps Admin', note, propertyIds);
            toast('success', 'Inquiry updated', `Status is now ${INQUIRY_STATUS_LABELS[nextStatus]}.`);
            setStatusTarget(null);
            reload();
          } catch (cause) {
            toast('error', 'Unable to update inquiry', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setStatusSaving(false);
          }
        }}
      />

      <ConvertInquiryModal
        key={convertTarget?.id ?? 'convert-closed'}
        open={Boolean(convertTarget)}
        inquiry={convertTarget}
        bedAvailable={bedAvailable}
        submitting={convertSaving}
        onClose={() => setConvertTarget(null)}
        onSubmit={async (allocateBed) => {
          if (!convertTarget) return;
          setConvertSaving(true);
          try {
            const result = await inquiryService.convertInquiryToTenant(
              convertTarget.id,
              {
                allocateBed,
                actor: user?.name ?? 'StayOps Admin',
              },
              propertyIds,
            );
            toast('success', 'Tenant created', `${result.tenant.fullName} is now in onboarding.`);
            setConvertTarget(null);
            reload();
            navigate(isWarden ? `/warden/tenants/${result.tenant.id}` : `/admin/tenants/${result.tenant.id}`);
          } catch (cause) {
            toast('error', 'Unable to convert inquiry', cause instanceof Error ? cause.message : 'Please try again.');
          } finally {
            setConvertSaving(false);
          }
        }}
      />
    </div>
  );
}
