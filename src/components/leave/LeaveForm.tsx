import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { LEAVE_TYPE_LABELS, LeaveType, type LeaveFormValues } from '@/types/leave';
import type { LeaveFormErrors } from '@/utils/leaveValidation';

interface LeaveFormProps {
  values: LeaveFormValues;
  errors: LeaveFormErrors;
  hostLabel: string;
  submitting: boolean;
  onChange: (values: LeaveFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function LeaveForm({ values, errors, hostLabel, submitting, onChange, onSubmit, onCancel }: LeaveFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="rounded-xl bg-background px-3 py-2 text-sm text-muted">Leave will be recorded for {hostLabel}.</p>
      <Select
        label="Leave Type"
        name="leaveType"
        required
        error={errors.leaveType}
        value={values.leaveType}
        placeholder="Select leave type"
        options={Object.values(LeaveType).map((value) => ({ value, label: LEAVE_TYPE_LABELS[value] }))}
        onChange={(event) => onChange({ ...values, leaveType: event.target.value as LeaveType })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <DateInput
          label="Start Date"
          name="startDate"
          required
          error={errors.startDate}
          value={values.startDate}
          onChange={(event) => onChange({ ...values, startDate: event.target.value })}
        />
        <TextInput
          label="Start Time"
          name="startTime"
          type="time"
          required
          error={errors.startTime}
          value={values.startTime}
          onChange={(event) => onChange({ ...values, startTime: event.target.value })}
        />
        <DateInput
          label="Expected Return Date"
          name="expectedReturnDate"
          required
          error={errors.expectedReturnDate}
          value={values.expectedReturnDate}
          onChange={(event) => onChange({ ...values, expectedReturnDate: event.target.value })}
        />
        <TextInput
          label="Expected Return Time"
          name="expectedReturnTime"
          type="time"
          required
          error={errors.expectedReturnTime}
          value={values.expectedReturnTime}
          onChange={(event) => onChange({ ...values, expectedReturnTime: event.target.value })}
        />
      </div>
      <Textarea
        label="Reason"
        name="reason"
        required
        error={errors.reason}
        value={values.reason}
        placeholder="Why do you need to leave the property?"
        onChange={(event) => onChange({ ...values, reason: event.target.value })}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          Submit Leave
        </Button>
      </div>
    </form>
  );
}
