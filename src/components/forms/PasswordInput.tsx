import { TextInput } from '@/components/forms/TextInput';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function PasswordInput({ label = 'Password', ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextInput
      {...props}
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      leftIcon={<Lock className="h-4 w-4" />}
      rightIcon={
        <button
          type="button"
          className="text-muted hover:text-text"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
