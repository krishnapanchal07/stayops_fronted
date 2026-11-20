import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { VISITOR_RELATIONSHIP_LABELS, VisitorRelationship, type VisitorFormValues } from '@/types/visitor';
import type { VisitorFormErrors } from '@/utils/visitorValidation';

interface VisitorFormProps {
  values: VisitorFormValues;
  errors: VisitorFormErrors;
  hostLabel: string;
  submitting: boolean;
  onChange: (values: VisitorFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function VisitorForm({ values, errors, hostLabel, submitting, onChange, onSubmit, onCancel }: VisitorFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="rounded-xl bg-background px-3 py-2 text-sm text-muted">Host allocation: {hostLabel}</p>
      <TextInput
        label="Visitor Name"
        name="visitorName"
        required
        error={errors.visitorName}
        value={values.visitorName}
        placeholder="Full name"
        onChange={(event) => onChange({ ...values, visitorName: event.target.value })}
      />
      <TextInput
        label="Phone"
        name="visitorPhone"
        required
        error={errors.visitorPhone}
        value={values.visitorPhone}
        placeholder="10-digit mobile number"
        onChange={(event) => onChange({ ...values, visitorPhone: event.target.value })}
      />
      <TextInput
        label="Email"
        name="visitorEmail"
        type="email"
        error={errors.visitorEmail}
        value={values.visitorEmail}
        placeholder="Optional"
        onChange={(event) => onChange({ ...values, visitorEmail: event.target.value })}
      />
      <Select
        label="Relationship"
        name="relationship"
        required
        error={errors.relationship}
        value={values.relationship}
        placeholder="Select relationship"
        options={Object.values(VisitorRelationship).map((value) => ({
          value,
          label: VISITOR_RELATIONSHIP_LABELS[value],
        }))}
        onChange={(event) => onChange({ ...values, relationship: event.target.value as VisitorRelationship })}
      />
      <TextInput
        label="Purpose"
        name="purpose"
        required
        error={errors.purpose}
        value={values.purpose}
        placeholder="Why is the visitor coming?"
        onChange={(event) => onChange({ ...values, purpose: event.target.value })}
      />
      <DateInput
        label="Visit Date"
        name="visitDate"
        required
        error={errors.visitDate}
        value={values.visitDate}
        onChange={(event) => onChange({ ...values, visitDate: event.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Expected Entry Time"
          name="expectedEntryTime"
          type="time"
          required
          error={errors.expectedEntryTime}
          value={values.expectedEntryTime}
          onChange={(event) => onChange({ ...values, expectedEntryTime: event.target.value })}
        />
        <TextInput
          label="Expected Exit Time"
          name="expectedExitTime"
          type="time"
          required
          error={errors.expectedExitTime}
          value={values.expectedExitTime}
          onChange={(event) => onChange({ ...values, expectedExitTime: event.target.value })}
        />
      </div>
      <Textarea
        label="Notes"
        name="notes"
        error={errors.notes}
        value={values.notes}
        placeholder="Optional instructions for the host or visitor"
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
      />
      <p className="typo-helper">ID check at gate. Government ID verification is not part of this request.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          Submit Request
        </Button>
      </div>
    </form>
  );
}
