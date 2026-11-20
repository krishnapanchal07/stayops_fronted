import { Toggle } from '@/components/forms/Toggle';
import type { NotificationPreferences } from '@/types/support';

interface NotificationPreferencesFormProps {
  values: NotificationPreferences;
  onChange: (values: NotificationPreferences) => void;
}

const options = [
  { key: 'payments', label: 'Payment notifications' },
  { key: 'complaints', label: 'Complaint notifications' },
  { key: 'visitors', label: 'Visitor notifications' },
  { key: 'leave', label: 'Leave notifications' },
  { key: 'notices', label: 'Notice notifications' },
] as const;

export function NotificationPreferencesForm({ values, onChange }: NotificationPreferencesFormProps) {
  return (
    <ul className="space-y-4">
      {options.map((option) => (
        <li key={option.key} className="flex items-center justify-between gap-3">
          <span className="text-sm text-text">{option.label}</span>
          <Toggle
            checked={values[option.key]}
            label={option.label}
            onCheckedChange={(checked) => onChange({ ...values, [option.key]: checked })}
          />
        </li>
      ))}
    </ul>
  );
}
