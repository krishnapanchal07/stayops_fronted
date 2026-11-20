import { Card, CardHeader } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/dashboard/StatusPill';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import { Permission } from '@/constants/permissions';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHasPermission } from '@/hooks/useHasPermission';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { paymentDetailPath } from '@/routes/financePaths';
import { documentService } from '@/services/document/documentService';
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS, DOCUMENT_VISIBILITY_LABELS, DocumentStatus } from '@/types/document';
import { downloadMockDocument } from '@/utils/documentRules';
import { formatFileSize, formatShortDate } from '@/utils/format';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

export function DocumentDetailsPage() {
  const { documentId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useCurrentUser();
  const isTenant = location.pathname.startsWith('/tenant');
  const isWarden = location.pathname.startsWith('/warden');
  const canArchive = useHasPermission(Permission.DOCUMENT_ARCHIVE) && !isTenant;
  const propertyIds = isWarden ? user?.propertyIds : undefined;
  const listHref = isTenant ? PATHS.tenant.documents : isWarden ? PATHS.warden.documents : PATHS.admin.documents;

  const loader = useCallback(() => {
    if (isTenant && user) return documentService.getDocumentById(documentId, { tenantId: user.id });
    return documentService.getDocumentById(documentId, { propertyIds, includeStaff: !isWarden });
  }, [documentId, isTenant, isWarden, propertyIds, user]);

  const { data: document, status, error, reload } = useAsyncResource(loader);
  const [saving, setSaving] = useState(false);

  const archiveOrRestore = async () => {
    if (!document) return;
    setSaving(true);
    try {
      if (document.status === DocumentStatus.ARCHIVED) {
        await documentService.restoreDocument(document.id, propertyIds);
        toast('success', 'Document restored.');
      } else {
        await documentService.archiveDocument(document.id, propertyIds);
        toast('success', 'Document archived.');
      }
      reload();
    } catch (cause) {
      toast('error', 'Unable to update document.', cause instanceof Error ? cause.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={document?.name ?? 'Document'}
        description={document ? DOCUMENT_CATEGORY_LABELS[document.category] : 'Document details'}
        showBack
        breadcrumbs={[
          { label: 'Home', href: isTenant ? PATHS.tenant.dashboard : isWarden ? PATHS.warden.dashboard : PATHS.admin.dashboard },
          { label: isTenant ? 'My Documents' : 'Documents', href: listHref },
          { label: document?.documentCode ?? 'Details' },
        ]}
        actions={
          document ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  downloadMockDocument(document);
                  toast('success', 'Document downloaded.');
                }}
              >
                Download
              </Button>
              {document.paymentId ? (
                <Button variant="outline" onClick={() => navigate(paymentDetailPath(isTenant ? 'tenant' : 'admin', document.paymentId ?? ''))}>
                  Open receipt
                </Button>
              ) : null}
              {canArchive ? (
                <Button disabled={saving} variant="outline" onClick={() => void archiveOrRestore()}>
                  {document.status === DocumentStatus.ARCHIVED ? 'Restore' : 'Archive'}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />

      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'error' ? (
        <ErrorState title="Unable to load documents." description={error ?? undefined} onRetry={reload} />
      ) : null}

      {status === 'success' && document ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Preview" />
            <DocumentPreview document={document} />
            {document.description ? <p className="mt-4 text-sm text-text">{document.description}</p> : null}
          </Card>
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="typo-muted">Status</dt>
                <dd className="mt-1">
                  <StatusPill value={DOCUMENT_STATUS_LABELS[document.status]} />
                </dd>
              </div>
              <div>
                <dt className="typo-muted">Uploaded</dt>
                <dd className="mt-1 font-medium">{formatShortDate(document.uploadedAt.slice(0, 10))}</dd>
              </div>
              <div>
                <dt className="typo-muted">File</dt>
                <dd className="mt-1 font-medium">
                  {document.fileName} · {formatFileSize(document.fileSize)}
                </dd>
              </div>
              {!isTenant ? (
                <div>
                  <dt className="typo-muted">Visibility</dt>
                  <dd className="mt-1 font-medium">{DOCUMENT_VISIBILITY_LABELS[document.visibility]}</dd>
                </div>
              ) : null}
              <div>
                <dt className="typo-muted">Property</dt>
                <dd className="mt-1 font-medium">{document.propertyName}</dd>
              </div>
              {document.tenantName ? (
                <div>
                  <dt className="typo-muted">Tenant</dt>
                  <dd className="mt-1 font-medium">{document.tenantName}</dd>
                </div>
              ) : null}
            </dl>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
