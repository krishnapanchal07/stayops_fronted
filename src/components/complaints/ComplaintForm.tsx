import { ComplaintAttachmentField } from '@/components/complaints/ComplaintAttachmentField';
import { ComplaintPrioritySelector } from '@/components/complaints/ComplaintPrioritySelector';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import {
  COMPLAINT_CATEGORY_LABELS,
  ComplaintCategory,
  type ComplaintFormValues,
  type ComplaintPriority,
} from '@/types/complaint';
import type { ComplaintFormErrors } from '@/utils/complaintValidation';

interface ComplaintFormProps {
  values: ComplaintFormValues;
  errors: ComplaintFormErrors;
  roomLabel: string;
  uploadedBy: string;
  submitting: boolean;
  onChange: (values: ComplaintFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onAttachmentError: (message: string) => void;
}

export function ComplaintForm({
  values,
  errors,
  roomLabel,
  uploadedBy,
  submitting,
  onChange,
  onSubmit,
  onCancel,
  onAttachmentError,
}: ComplaintFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Select
        label="Category"
        name="category"
        required
        error={errors.category}
        value={values.category}
        placeholder="Select a category"
        options={Object.values(ComplaintCategory).map((category) => ({
          value: category,
          label: COMPLAINT_CATEGORY_LABELS[category],
        }))}
        onChange={(event) => onChange({ ...values, category: event.target.value as ComplaintCategory })}
      />
      <TextInput
        label="Title"
        name="title"
        required
        error={errors.title}
        value={values.title}
        placeholder="Short summary of the issue"
        onChange={(event) => onChange({ ...values, title: event.target.value })}
      />
      <Textarea
        label="Description"
        name="description"
        required
        error={errors.description}
        value={values.description}
        placeholder="Describe what is happening and where."
        onChange={(event) => onChange({ ...values, description: event.target.value })}
      />
      <ComplaintPrioritySelector
        value={values.priority}
        error={errors.priority}
        onChange={(priority: ComplaintPriority) => onChange({ ...values, priority })}
      />
      <TextInput label="Room" name="room" value={roomLabel} readOnly helperText="Taken from your current allocation." />
      {errors.roomId ? <p className="text-sm text-danger">{errors.roomId}</p> : null}
      <ComplaintAttachmentField
        attachments={values.attachments}
        uploadedBy={uploadedBy}
        onChange={(attachments) => onChange({ ...values, attachments })}
        onError={onAttachmentError}
        disabled={submitting}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Complaint'}
        </Button>
      </div>
    </form>
  );
}
