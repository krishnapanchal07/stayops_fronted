import {
  DocumentStatus,
  DocumentVisibility,
  type DocumentFilters,
  type DocumentSummary,
  type StayDocument,
} from '@/types/document';
import type { Tenant } from '@/types/tenant';

export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const;

export function emptyDocumentFilters(): DocumentFilters {
  return {
    query: '',
    category: '',
    status: '',
    propertyId: '',
    tenantId: '',
    visibility: '',
  };
}

export function canTenantSeeDocument(document: StayDocument, tenant: Tenant): boolean {
  if (document.visibility !== DocumentVisibility.TENANT) return false;
  if (document.status === DocumentStatus.ARCHIVED) return false;
  if (document.tenantId) return document.tenantId === tenant.id;
  return Boolean(tenant.propertyId && document.propertyId === tenant.propertyId);
}

export function canStaffSeeDocument(
  document: StayDocument,
  options: { propertyIds?: string[]; includeStaff?: boolean },
): boolean {
  if (options.propertyIds?.length && !options.propertyIds.includes(document.propertyId)) return false;
  if (!options.includeStaff && document.visibility === DocumentVisibility.STAFF) return false;
  return true;
}

export function filterDocuments(items: StayDocument[], filters: DocumentFilters): StayDocument[] {
  const query = filters.query.trim().toLowerCase();
  return items.filter((document) => {
    if (filters.category && document.category !== filters.category) return false;
    if (filters.status && document.status !== filters.status) return false;
    if (filters.propertyId && document.propertyId !== filters.propertyId) return false;
    if (filters.tenantId && document.tenantId !== filters.tenantId) return false;
    if (filters.visibility && document.visibility !== filters.visibility) return false;
    if (!query) return true;
    return (
      document.name.toLowerCase().includes(query) ||
      document.documentCode.toLowerCase().includes(query) ||
      document.fileName.toLowerCase().includes(query) ||
      (document.tenantName ?? '').toLowerCase().includes(query)
    );
  });
}

export function summarizeDocuments(items: StayDocument[]): DocumentSummary {
  return {
    total: items.length,
    active: items.filter((item) => item.status === DocumentStatus.ACTIVE).length,
    uploaded: items.filter((item) => item.status === DocumentStatus.UPLOADED).length,
    archived: items.filter((item) => item.status === DocumentStatus.ARCHIVED).length,
  };
}

export function validateDocumentFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  const typeOk = DOCUMENT_FILE_TYPES.includes(file.type as (typeof DOCUMENT_FILE_TYPES)[number]);
  const extensionOk = extension ? allowedExtensions.includes(extension) : false;
  if (!typeOk && !extensionOk) return 'Use a PDF, JPG, PNG, or WEBP file.';
  if (file.size > DOCUMENT_MAX_BYTES) return 'Keep the file under 10 MB.';
  return null;
}

export function downloadMockDocument(document: StayDocument): void {
  const body = [
    'StayOps mock document',
    `Name: ${document.name}`,
    `Code: ${document.documentCode}`,
    `Category: ${document.category}`,
    `File: ${document.fileName}`,
    '',
    document.description,
    '',
    'This is demo metadata only. Real file storage is planned for Phase 3.',
  ].join('\n');
  const blob = new Blob([body], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = document.previewUrl && document.fileType.startsWith('image/') ? document.previewUrl : url;
  link.download = document.fileName || `${document.documentCode}.txt`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
