import { TextInput } from '@/components/forms/TextInput';
import { Calendar } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function DateInput(props: DateInputProps) {
  return <TextInput {...props} type="date" rightIcon={<Calendar className="h-4 w-4" />} />;
}
