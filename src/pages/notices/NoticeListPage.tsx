import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { DateInput } from '@/components/forms/DateInput';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
import { NoticeCard } from '@/components/notices/NoticeCard';
import { NoticeForm } from '@/components/notices/NoticeForm';
import { NoticePriorityBadge } from '@/components/notices/NoticePriorityBadge';
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
  adminNoticeDetailPath,
  tenantNoticeDetailPath,
  wardenNoticeDetailPath,
} from '@/routes/paths';
import { noticeService } from '@/services/notice/noticeService';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import {
  NOTICE_CATEGORY_LABELS,
  NOTICE_PRIORITY_LABELS,
  NOTICE_STATUS_LABELS,
  NoticeCategory,
  NoticePriority,
  NoticeStatus,
  type Notice,
  type NoticeFilters,
  type NoticeFormValues,
  type NoticeWithRead,
} from '@/types/notice';
import type { DataTableColumn } from '@/types/ui';
import { emptyNoticeFilters, filterNotices, summarizeNotices } from '@/utils/noticeRules';
import { emptyNoticeForm, toNoticeForm, validateNoticeForm, type NoticeFormErrors } from '@/utils/noticeValidation';
import { formatShortDate } from '@/utils/format';
import { Bell, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type TenantTab = 'ALL' | 'UNREAD' | 'READ';
type StaffTab = 'ALL' | NoticeStatus;

function detailHref(pathname: string, id: string): string {
  if (pathname.startsWith('/tenant')) return tenantNoticeDetailPath(id);
  if (pathname.startsWith('/warden')) return wardenNoticeDetailPath(id);
  return adminNoticeDetailPath(id);
}

export function NoticeListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canCreate = useHasPermission(Permission.NOTICE_CREATE) && !isTenant;
  const homeHref = isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;
  const propertyIds = isWarden ? user?.propertyIds : undefined;

  const noticesLoader = useCallback(() => {
    if (isTenant && user) return noticeService.getTenantNotices(user.id);
    return noticeService.getNotices(propertyIds);
  }, [isTenant, propertyIds, user]);
  const propertiesLoader = useCallback(async () => {
    const properties = await propertyService.getProperties();
    if (!propertyIds?.length) return properties;
    return properties.filter((property) => propertyIds.includes(property.id));
  }, [propertyIds]);
  const roomsLoader = useCallback(() => roomService.getRooms(), []);

  const { data, status, error, reload } = useAsyncResource(noticesLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: rooms } = useAsyncResource(roomsLoader);

  const [filters, setFilters] = useState<NoticeFilters>(emptyNoticeFilters());
  const [tab, setTab] = useState<TenantTab | StaffTab>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [formValues, setFormValues] = useState<NoticeFormValues>(emptyNoticeForm());
  const [formErrors, setFormErrors] = useState<NoticeFormErrors>({});
  const [saving, setSaving] = useState(false);

  const notices = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const next = filterNotices(notices, filters);
    if (isTenant) {
      const rows = next as NoticeWithRead[];
      if (tab === 'UNREAD') return rows.filter((item) => !item.isRead);
      if (tab === 'READ') return rows.filter((item) => item.isRead);
      return rows;
    }
    if (tab !== 'ALL') return next.filter((item) => item.status === tab);
    return next;
  }, [filters, isTenant, notices, tab]);

  const summary = summarizeNotices(notices as Notice[], isTenant ? (notices as NoticeWithRead[]).filter((item) => !item.isRead).length : 0);

  const columns: DataTableColumn<Notice>[] = [
    { id: 'code', header: 'Code', accessor: 'noticeCode' },
    {
      id: 'title',
      header: 'Title',
      render: (row) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="typo-helper">{row.propertyName}</p>
        </div>
      ),
    },
    { id: 'category', header: 'Category', render: (row) => NOTICE_CATEGORY_LABELS[row.category] },
    { id: 'priority', header: 'Priority', render: (row) => <NoticePriorityBadge priority={row.priority} /> },
    { id: 'status', header: 'Status', render: (row) => <StatusPill value={NOTICE_STATUS_LABELS[row.status]} /> },
    { id: 'published', header: 'Published', render: (row) => formatShortDate(row.publishDate) },
    { id: 'expiry', header: 'Expiry', render: (row) => formatShortDate(row.expiryDate) },
    {
      id: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(detailHref(location.pathname, row.id))}>
            View
          </Button>
          {row.status !== NoticeStatus.ARCHIVED && row.status !== NoticeStatus.EXPIRED ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(row);
                setFormValues(toNoticeForm(row));
                setFormErrors({});
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  const openCreate = () => {
    setEditing(null);
    setFormValues({
      ...emptyNoticeForm(),
      propertyId: propertyIds?.[0] ?? '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const saveForm = async () => {
    if (!user) return;
    const errors = validateNoticeForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      if (editing) {
        await noticeService.updateNotice(editing.id, formValues, propertyIds);
        toast('success', 'Notice updated.');
      } else {
        await noticeService.createNotice(formValues, { id: user.id, name: user.name }, propertyIds);
        toast('success', 'Notice saved as draft.');
      }
      setFormOpen(false);
      reload();
    } catch (cause) {
      toast('error', 'Unable to save notice.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notices"
        description={isTenant ? 'Stay updated with property announcements and important information.' : 'Create, publish and manage property notices.'}
        breadcrumbs={[
          { label: 'Home', href: homeHref },
          { label: 'Notices' },
        ]}
        actions={
          canCreate ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Create notice
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Unable to load notices." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric={{ id: 'notices', label: isTenant ? 'New notices' : 'Published', value: String(isTenant ? summary.unread : summary.published), tone: 'info' }} />
            {!isTenant ? (
              <>
                <StatCard metric={{ id: 'new', label: 'Drafts', value: String(summary.draft), tone: 'warning' }} />
                <StatCard metric={{ id: 'overdue', label: 'Expired', value: String(summary.expired), tone: 'danger' }} />
                <StatCard metric={{ id: 'done', label: 'Archived', value: String(summary.archived), tone: 'primary' }} />
              </>
            ) : (
              <StatCard metric={{ id: 'notices', label: 'All notices', value: String(summary.total), tone: 'primary' }} />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(isTenant ? ['ALL', 'UNREAD', 'READ'] : ['ALL', 'DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED']).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item as TenantTab | StaffTab)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${tab === item ? 'bg-primary text-white' : 'bg-background text-muted'}`}
              >
                {item === 'ALL' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SearchInput
              value={filters.query}
              placeholder="Search title"
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
            <Select
              name="category"
              placeholder="Category"
              value={filters.category}
              options={[{ value: '', label: 'All categories' }, ...Object.values(NoticeCategory).map((value) => ({ value, label: NOTICE_CATEGORY_LABELS[value] }))]}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as NoticeFilters['category'] }))}
            />
            <Select
              name="priority"
              placeholder="Priority"
              value={filters.priority}
              options={[{ value: '', label: 'All priorities' }, ...Object.values(NoticePriority).map((value) => ({ value, label: NOTICE_PRIORITY_LABELS[value] }))]}
              onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value as NoticeFilters['priority'] }))}
            />
            {!isTenant ? (
              <Select
                name="property"
                placeholder="Property"
                value={filters.propertyId}
                options={[{ value: '', label: 'All properties' }, ...(properties ?? []).map((item) => ({ value: item.id, label: item.name }))]}
                onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
              />
            ) : (
              <DateInput
                name="fromDate"
                value={filters.fromDate}
                onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
              />
            )}
          </div>

          {isTenant ? (
            filtered.length ? (
              <div className="grid gap-3">
                {(filtered as NoticeWithRead[]).map((notice) => (
                  <NoticeCard key={notice.id} notice={notice} href={detailHref(location.pathname, notice.id)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<Bell className="h-8 w-8" />} title="You're all caught up." description="No notices match this filter." />
            )
          ) : (
            <DataTable
              columns={columns}
              data={filtered as Notice[]}
              rowKey={(row) => row.id}
              searchable={false}
              emptyTitle="No notices yet."
              emptyDescription="Create a draft and publish it when ready."
              renderMobile={(row) => (
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="font-medium">{row.title}</p>
                  <p className="typo-helper">{row.noticeCode}</p>
                  <Button size="sm" className="mt-3" variant="outline" onClick={() => navigate(detailHref(location.pathname, row.id))}>
                    View
                  </Button>
                </div>
              )}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title={editing ? 'Edit notice' : 'Create notice'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => void saveForm()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <NoticeForm
          values={formValues}
          errors={formErrors}
          properties={properties ?? []}
          rooms={rooms ?? []}
          onChange={setFormValues}
        />
      </Modal>
    </div>
  );
}
