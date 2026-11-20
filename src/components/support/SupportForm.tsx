import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { SUPPORT_CATEGORY_LABELS, SupportCategory, type SupportFormValues } from '@/types/support';
import type { SupportFormErrors } from '@/utils/supportValidation';

interface SupportFormProps {
  values: SupportFormValues;
  errors: SupportFormErrors;
  onChange: (values: SupportFormValues) => void;
}

export function SupportForm({ values, errors, onChange }: SupportFormProps) {
  return (
    <div className="space-y-4">
      <Select
        label="Category"
        name="category"
        value={values.category}
        error={errors.category}
        required
        options={Object.values(SupportCategory).map((value) => ({ value, label: SUPPORT_CATEGORY_LABELS[value] }))}
        onChange={(event) => onChange({ ...values, category: event.target.value as SupportFormValues['category'] })}
      />
      <TextInput
        label="Subject"
        name="subject"
        value={values.subject}
        error={errors.subject}
        required
        onChange={(event) => onChange({ ...values, subject: event.target.value })}
      />
      <Textarea
        label="Description"
        name="description"
        value={values.description}
        error={errors.description}
        required
        helperText="Use Complaints for physical or maintenance issues. Support is for account, document, and payment questions."
        onChange={(event) => onChange({ ...values, description: event.target.value })}
      />
    </div>
  );
}
