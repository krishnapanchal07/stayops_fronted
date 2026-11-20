import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_LABELS,
  DocumentCategory,
  DocumentVisibility,
  type DocumentFormValues,
} from '@/types/document';
import type { PropertyListItem } from '@/types/property';
import type { Tenant } from '@/types/tenant';
import type { DocumentFormErrors } from '@/utils/documentValidation';
import { validateDocumentFile } from '@/utils/documentRules';
import { formatFileSize } from '@/utils/format';

interface DocumentFormProps {
  values: DocumentFormValues;
  errors: DocumentFormErrors;
  properties: PropertyListItem[];
  tenants: Tenant[];
  fileError?: string;
  onChange: (values: DocumentFormValues) => void;
  onFileError: (message: string) => void;
}

export function DocumentForm({ values, errors, properties, tenants, fileError, onChange, onFileError }: DocumentFormProps) {
  const scopedTenants = tenants.filter((tenant) => !values.propertyId || tenant.propertyId === values.propertyId);

  const update = <K extends keyof DocumentFormValues>(key: K, value: DocumentFormValues[K]) => {
    const next = { ...values, [key]: value };
    if (key === 'propertyId') next.tenantId = '';
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <TextInput
        label="Document name"
        name="name"
        value={values.name}
        error={errors.name}
        required
        onChange={(event) => update('name', event.target.value)}
      />
      <Textarea
        label="Description"
        name="description"
        value={values.description}
        onChange={(event) => update('description', event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Category"
          name="category"
          value={values.category}
          error={errors.category}
          required
          options={Object.values(DocumentCategory).map((value) => ({ value, label: DOCUMENT_CATEGORY_LABELS[value] }))}
          onChange={(event) => update('category', event.target.value as DocumentFormValues['category'])}
        />
        <Select
          label="Visibility"
          name="visibility"
          value={values.visibility}
          error={errors.visibility}
          required
          options={Object.values(DocumentVisibility).map((value) => ({ value, label: DOCUMENT_VISIBILITY_LABELS[value] }))}
          onChange={(event) => update('visibility', event.target.value as DocumentFormValues['visibility'])}
        />
        <Select
          label="Property"
          name="propertyId"
          value={values.propertyId}
          error={errors.propertyId}
          required
          options={properties.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(event) => update('propertyId', event.target.value)}
        />
        <Select
          label="Assign to tenant"
          name="tenantId"
          value={values.tenantId}
          helperText="Leave empty for a property-facing document."
          options={[
            { value: '', label: 'None (property-facing)' },
            ...scopedTenants.map((item) => ({ value: item.id, label: item.fullName })),
          ]}
          onChange={(event) => update('tenantId', event.target.value)}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text" htmlFor="document-file">
          File
        </label>
        <input
          id="document-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          className="block w-full text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const message = validateDocumentFile(file);
            if (message) {
              onFileError(message);
              event.target.value = '';
              return;
            }
            onFileError('');
            onChange({
              ...values,
              fileName: file.name,
              fileType: file.type || 'application/octet-stream',
              fileSize: file.size,
              previewUrl: URL.createObjectURL(file),
            });
          }}
        />
        <p className="typo-helper mt-1">PDF, JPG, PNG, or WEBP. Max 10 MB. Preview stays in this browser session.</p>
        {values.fileName ? (
          <p className="mt-2 text-sm text-text">
            {values.fileName} · {formatFileSize(values.fileSize)}
          </p>
        ) : null}
        {fileError || errors.fileName ? <p className="mt-1 text-sm text-danger">{fileError || errors.fileName}</p> : null}
      </div>
    </div>
  );
}
