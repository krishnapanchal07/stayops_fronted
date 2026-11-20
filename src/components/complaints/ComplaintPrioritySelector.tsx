import { Select } from '@/components/forms/Select';
import { COMPLAINT_PRIORITY_LABELS, ComplaintPriority } from '@/types/complaint';

interface ComplaintPrioritySelectorProps {
  value: ComplaintPriority | '';
  onChange: (value: ComplaintPriority) => void;
  error?: string;
  required?: boolean;
  name?: string;
}

export function ComplaintPrioritySelector({
  value,
  onChange,
  error,
  required = true,
  name = 'priority',
}: ComplaintPrioritySelectorProps) {
  return (
    <Select
      label="Priority"
      name={name}
      required={required}
      error={error}
      value={value}
      options={Object.values(ComplaintPriority).map((priority) => ({
        value: priority,
        label: COMPLAINT_PRIORITY_LABELS[priority],
      }))}
      onChange={(event) => onChange(event.target.value as ComplaintPriority)}
    />
  );
}
