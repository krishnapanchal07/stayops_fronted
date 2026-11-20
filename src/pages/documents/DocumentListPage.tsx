import { PageHeader } from '@/components/common/PageHeader';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentForm } from '@/components/documents/DocumentForm';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SearchInput } from '@/components/forms/SearchInput';
import { Select } from '@/components/forms/Select';
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
  adminDocumentDetailPath,
  tenantDocumentDetailPath,
  wardenDocumentDetailPath,
} from '@/routes/paths';
import { documentService } from '@/services/document/documentService';
import { propertyService } from '@/services/property/propertyService';
import { tenantService } from '@/services/tenant/tenantService';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  DocumentCategory,
  DocumentStatus,
  type DocumentFilters,
  type DocumentFormValues,
  type StayDocument,
} from '@/types/document';
import type { DataTableColumn } from '@/types/ui';
import { emptyDocumentFilters, summarizeDocuments } from '@/utils/documentRules';
import { emptyDocumentForm, validateDocumentForm, type DocumentFormErrors } from '@/utils/documentValidation';
import { formatShortDate } from '@/utils/format';
import { FolderOpen, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function detailHref(pathname: string, id: string): string {
  if (pathname.startsWith('/tenant')) return tenantDocumentDetailPath(id);
  if (pathname.startsWith('/warden')) return wardenDocumentDetailPath(id);
  return adminDocumentDetailPath(id);
}

export function DocumentListPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canUpload = useHasPermission(Permission.DOCUMENT_UPLOAD) && !isTenant;
  const includeStaff = !isWarden;
  const propertyIds = isWarden ? user?.propertyIds : undefined;
  const homeHref = isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard;

  const documentsLoader = useCallback(() => {
    if (isTenant && user) return documentService.getTenantDocuments(user.id);
    return documentService.getDocuments(propertyIds, includeStaff);
  }, [includeStaff, isTenant, propertyIds, user]);
  const propertiesLoader = useCallback(async () => {
    const properties = await propertyService.getProperties();
    if (!propertyIds?.length) return properties;
    return properties.filter((property) => propertyIds.includes(property.id));
  }, [propertyIds]);
  const tenantsLoader = useCallback(() => tenantService.getTenants(propertyIds), [propertyIds]);

  const { data, status, error, reload } = useAsyncResource(documentsLoader);
  const { data: properties } = useAsyncResource(propertiesLoader);
  const { data: tenants } = useAsyncResource(tenantsLoader);

  const [filters, setFilters] = useState<DocumentFilters>(emptyDocumentFilters());
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState<DocumentFormValues>(emptyDocumentForm());
  const [formErrors, setFormErrors] = useState<DocumentFormErrors>({});
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);

  const documents = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return documents.filter((document) => {
      if (filters.category && document.category !== filters.category) return false;
      if (filters.status && document.status !== filters.status) return false;
      if (filters.propertyId && document.propertyId !== filters.propertyId) return false;
      if (filters.tenantId && document.tenantId !== filters.tenantId) return false;
      if (!query) return true;
      return (
        document.name.toLowerCase().includes(query) ||
        document.documentCode.toLowerCase().includes(query) ||
        (document.tenantName ?? '').toLowerCase().includes(query)
      );
    });
  }, [documents, filters]);
  const summary = summarizeDocuments(documents);

  const columns: DataTableColumn<StayDocument>[] = [
    { id: 'code', header: 'Code', accessor: 'documentCode' },
    {
      id: 'name',
      header: 'Document',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="typo-helper">{row.tenantName ?? row.propertyName}</p>
        </div>
      ),
    },
    { id: 'category', header: 'Category', render: (row) => DOCUMENT_CATEGORY_LABELS[row.category] },
    { id: 'status', header: 'Status', render: (row) => <StatusPill value={DOCUMENT_STATUS_LABELS[row.status]} /> },
    { id: 'uploaded', header: 'Uploaded', render: (row) => formatShortDate(row.uploadedAt.slice(0, 10)) },
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

  const save = async () => {
    if (!user) return;
    const errors = validateDocumentForm(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0 || fileError) return;
    setSaving(true);
    try {
      await documentService.createDocument(formValues, { id: user.id, name: user.name }, propertyIds);
      toast('success', 'Document uploaded.');
      setFormOpen(false);
      setFormValues(emptyDocumentForm());
      reload();
    } catch (cause) {
      toast('error', 'Unable to upload document.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isTenant ? 'My Documents' : 'Documents'}
        description={isTenant ? 'Access your agreements, identity documents, receipts and other records.' : 'View, upload and archive property and tenant documents.'}
        breadcrumbs={[
          { label: 'Home', href: homeHref },
          { label: isTenant ? 'My Documents' : 'Documents' },
        ]}
        actions={
          canUpload ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
              Upload document
            </Button>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Unable to load documents." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard metric={{ id: 'documents', label: 'Documents', value: String(summary.total), tone: 'primary' }} />
            <StatCard metric={{ id: 'active', label: 'Active', value: String(summary.active), tone: 'success' }} />
            <StatCard metric={{ id: 'done', label: 'Archived', value: String(summary.archived), tone: 'warning' }} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SearchInput
              value={filters.query}
              placeholder="Search name"
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
            <Select
              name="category"
              placeholder="Category"
              value={filters.category}
              options={[{ value: '', label: 'All categories' }, ...Object.values(DocumentCategory).map((value) => ({ value, label: DOCUMENT_CATEGORY_LABELS[value] }))]}
              onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value as DocumentFilters['category'] }))}
            />
            <Select
              name="status"
              placeholder="Status"
              value={filters.status}
              options={[{ value: '', label: 'All statuses' }, ...Object.values(DocumentStatus).map((value) => ({ value, label: DOCUMENT_STATUS_LABELS[value] }))]}
              onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as DocumentFilters['status'] }))}
            />
            {!isTenant ? (
              <>
                <Select
                  name="property"
                  placeholder="Property"
                  value={filters.propertyId}
                  options={[{ value: '', label: 'All properties' }, ...(properties ?? []).map((item) => ({ value: item.id, label: item.name }))]}
                  onChange={(event) => setFilters((current) => ({ ...current, propertyId: event.target.value }))}
                />
                <Select
                  name="tenant"
                  placeholder="Tenant"
                  value={filters.tenantId}
                  options={[{ value: '', label: 'All tenants' }, ...(tenants ?? []).map((item) => ({ value: item.id, label: item.fullName }))]}
                  onChange={(event) => setFilters((current) => ({ ...current, tenantId: event.target.value }))}
                />
              </>
            ) : null}
          </div>

          {isTenant ? (
            filtered.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((document) => (
                  <DocumentCard key={document.id} document={document} href={detailHref(location.pathname, document.id)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={<FolderOpen className="h-8 w-8" />} title="No documents available." description="Agreements and receipts assigned to you will appear here." />
            )
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              rowKey={(row) => row.id}
              searchable={false}
              emptyTitle="No documents found."
              emptyDescription="Upload a mock document or adjust filters."
              renderMobile={(row) => (
                <DocumentCard document={row} href={detailHref(location.pathname, row.id)} />
              )}
            />
          )}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        title="Upload document"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? 'Uploading…' : 'Upload'}
            </Button>
          </>
        }
      >
        <DocumentForm
          values={formValues}
          errors={formErrors}
          properties={properties ?? []}
          tenants={tenants ?? []}
          fileError={fileError}
          onChange={setFormValues}
          onFileError={setFileError}
        />
      </Modal>
    </div>
  );
}
