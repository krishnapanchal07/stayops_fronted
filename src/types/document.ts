export const DocumentCategory = {
  IDENTITY: 'IDENTITY',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  RENTAL_AGREEMENT: 'RENTAL_AGREEMENT',
  RECEIPT: 'RECEIPT',
  INVOICE: 'INVOICE',
  OTHER: 'OTHER',
} as const;

export type DocumentCategory = (typeof DocumentCategory)[keyof typeof DocumentCategory];

export const DocumentStatus = {
  UPLOADED: 'UPLOADED',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;

export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const DocumentVisibility = {
  TENANT: 'TENANT',
  MANAGEMENT: 'MANAGEMENT',
  STAFF: 'STAFF',
} as const;

export type DocumentVisibility = (typeof DocumentVisibility)[keyof typeof DocumentVisibility];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  IDENTITY: 'Identity',
  ADDRESS_PROOF: 'Address Proof',
  RENTAL_AGREEMENT: 'Rental Agreement',
  RECEIPT: 'Receipt',
  INVOICE: 'Invoice',
  OTHER: 'Other',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  UPLOADED: 'Uploaded',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
};

export const DOCUMENT_VISIBILITY_LABELS: Record<DocumentVisibility, string> = {
  TENANT: 'Tenant',
  MANAGEMENT: 'Management',
  STAFF: 'Staff',
};

/** StayOps document record. Named to avoid colliding with the DOM Document type. */
export interface StayDocument {
  id: string;
  documentCode: string;
  name: string;
  category: DocumentCategory;
  description: string;
  tenantId: string | null;
  tenantName: string | null;
  propertyId: string;
  propertyName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl: string | null;
  invoiceId: string | null;
  paymentId: string | null;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  status: DocumentStatus;
  visibility: DocumentVisibility;
}

export interface DocumentFilters {
  query: string;
  category: DocumentCategory | '';
  status: DocumentStatus | '';
  propertyId: string;
  tenantId: string;
  visibility: DocumentVisibility | '';
}

export interface DocumentFormValues {
  name: string;
  category: DocumentCategory | '';
  description: string;
  tenantId: string;
  propertyId: string;
  visibility: DocumentVisibility | '';
  fileName: string;
  fileType: string;
  fileSize: number;
  previewUrl: string;
}

export interface DocumentSummary {
  total: number;
  active: number;
  uploaded: number;
  archived: number;
}
