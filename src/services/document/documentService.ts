import { documentStore } from '@/services/document/documentStore';
import { notificationStore } from '@/services/notification/notificationStore';
import { tenantStore } from '@/services/tenant/tenantStore';
import {
  DocumentCategory,
  DocumentStatus,
  DocumentVisibility,
  type DocumentFilters,
  type DocumentFormValues,
  type StayDocument,
} from '@/types/document';
import {
  canStaffSeeDocument,
  canTenantSeeDocument,
  emptyDocumentFilters,
  filterDocuments,
  summarizeDocuments,
} from '@/utils/documentRules';
import { validateDocumentForm } from '@/utils/documentValidation';

function wait<T>(value: T, ms = 160): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function reject(message: string): Promise<never> {
  return Promise.reject(new Error(message));
}

function nowIso(): string {
  return new Date().toISOString();
}

function nextCode(existing: StayDocument[]): string {
  const numbers = existing.map((item) => Number.parseInt(item.documentCode.replace(/\D/g, ''), 10)).filter(Number.isFinite);
  return `DOC-${(numbers.length ? Math.max(...numbers) : 1000) + 1}`;
}

/**
 * Document reads/mutations go through this service so Phase 3 can
 * replace the in-memory store with Axios → FastAPI.
 */
export const documentService = {
  getDocuments(propertyIds?: string[], includeStaff = true): Promise<StayDocument[]> {
    return wait(
      documentStore
        .list()
        .filter((document) => canStaffSeeDocument(document, { propertyIds, includeStaff })),
    );
  },

  getDocumentById(id: string, options?: { tenantId?: string; propertyIds?: string[]; includeStaff?: boolean }): Promise<StayDocument> {
    const document = documentStore.get(id);
    if (!document) return reject('Document not found.');
    if (options?.tenantId) {
      const tenant = tenantStore.get(options.tenantId);
      if (!tenant || !canTenantSeeDocument(document, tenant)) return reject('Document not found.');
    } else if (!canStaffSeeDocument(document, { propertyIds: options?.propertyIds, includeStaff: options?.includeStaff ?? true })) {
      return reject('Document not found.');
    }
    return wait(document);
  },

  getTenantDocuments(tenantId: string): Promise<StayDocument[]> {
    const tenant = tenantStore.get(tenantId);
    if (!tenant) return reject('Tenant not found.');
    return wait(documentStore.list().filter((document) => canTenantSeeDocument(document, tenant)));
  },

  getPropertyDocuments(propertyId: string, propertyIds?: string[]): Promise<StayDocument[]> {
    if (propertyIds?.length && !propertyIds.includes(propertyId)) return wait([]);
    return wait(documentStore.list().filter((document) => document.propertyId === propertyId));
  },

  searchDocuments(filters: DocumentFilters = emptyDocumentFilters(), propertyIds?: string[], includeStaff = true): Promise<StayDocument[]> {
    const scoped = documentStore.list().filter((document) => canStaffSeeDocument(document, { propertyIds, includeStaff }));
    return wait(filterDocuments(scoped, filters));
  },

  getDocumentSummary(propertyIds?: string[], includeStaff = true) {
    return wait(
      summarizeDocuments(documentStore.list().filter((document) => canStaffSeeDocument(document, { propertyIds, includeStaff }))),
    );
  },

  async createDocument(
    values: DocumentFormValues,
    actor: { id: string; name: string },
    propertyIds?: string[],
  ): Promise<StayDocument> {
    const errors = validateDocumentForm(values);
    if (Object.keys(errors).length > 0) return reject(Object.values(errors)[0] ?? 'Unable to save document.');
    if (propertyIds?.length && !propertyIds.includes(values.propertyId)) return reject('You can only upload documents for your property.');

    const { propertyService } = await import('@/services/property/propertyService');
    const property = await propertyService.getPropertyById(values.propertyId);
    const tenant = values.tenantId ? tenantStore.get(values.tenantId) : undefined;
    if (values.tenantId && !tenant) return reject('Selected tenant was not found.');
    if (tenant && tenant.propertyId && tenant.propertyId !== values.propertyId) {
      return reject('Selected tenant does not belong to this property.');
    }

    const created: StayDocument = {
      id: `doc-${Date.now().toString(36)}`,
      documentCode: nextCode(documentStore.list()),
      name: values.name.trim(),
      category: values.category as DocumentCategory,
      description: values.description.trim(),
      tenantId: tenant?.id ?? null,
      tenantName: tenant?.fullName ?? null,
      propertyId: property.id,
      propertyName: property.name,
      fileName: values.fileName,
      fileType: values.fileType,
      fileSize: values.fileSize,
      previewUrl: values.previewUrl || null,
      invoiceId: null,
      paymentId: null,
      uploadedBy: actor.id,
      uploadedByName: actor.name,
      uploadedAt: nowIso(),
      status: DocumentStatus.UPLOADED,
      visibility: values.visibility as DocumentVisibility,
    };
    documentStore.insert(created);
    if (created.tenantId && created.visibility === DocumentVisibility.TENANT) {
      notificationStore.push({
        title: 'New document uploaded',
        description: `${created.name} was added for ${created.tenantName}.`,
        tone: 'info',
      });
    }
    return wait(created);
  },

  updateDocument(id: string, values: Partial<Pick<StayDocument, 'name' | 'description' | 'status'>>, propertyIds?: string[]): Promise<StayDocument> {
    const current = documentStore.get(id);
    if (!current) return reject('Document not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Document not found.');
    return wait(
      documentStore.persist({
        ...current,
        name: values.name?.trim() || current.name,
        description: values.description ?? current.description,
        status: values.status ?? current.status,
      }),
    );
  },

  archiveDocument(id: string, propertyIds?: string[]): Promise<StayDocument> {
    const current = documentStore.get(id);
    if (!current) return reject('Document not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Document not found.');
    if (current.status === DocumentStatus.ARCHIVED) return reject('Document is already archived.');
    return wait(documentStore.persist({ ...current, status: DocumentStatus.ARCHIVED }));
  },

  restoreDocument(id: string, propertyIds?: string[]): Promise<StayDocument> {
    const current = documentStore.get(id);
    if (!current) return reject('Document not found.');
    if (propertyIds?.length && !propertyIds.includes(current.propertyId)) return reject('Document not found.');
    if (current.status !== DocumentStatus.ARCHIVED) return reject('Only archived documents can be restored.');
    return wait(documentStore.persist({ ...current, status: DocumentStatus.ACTIVE }));
  },
};
