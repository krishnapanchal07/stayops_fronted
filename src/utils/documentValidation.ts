import { DocumentCategory, DocumentVisibility, type DocumentFormValues } from '@/types/document';

export type DocumentFormErrors = Partial<Record<keyof DocumentFormValues, string>>;

export function emptyDocumentForm(): DocumentFormValues {
  return {
    name: '',
    category: '',
    description: '',
    tenantId: '',
    propertyId: '',
    visibility: DocumentVisibility.TENANT,
    fileName: '',
    fileType: '',
    fileSize: 0,
    previewUrl: '',
  };
}

export function validateDocumentForm(values: DocumentFormValues): DocumentFormErrors {
  const errors: DocumentFormErrors = {};
  if (!values.name.trim()) errors.name = 'Document name is required.';
  if (!values.category || !(values.category in DocumentCategory)) errors.category = 'Select a category.';
  if (!values.propertyId) errors.propertyId = 'Select a property.';
  if (!values.visibility || !(values.visibility in DocumentVisibility)) errors.visibility = 'Select visibility.';
  if (!values.fileName) errors.fileName = 'Select a file to attach.';
  return errors;
}
