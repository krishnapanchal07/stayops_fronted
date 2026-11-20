import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { PATHS } from '@/routes/paths';
import { Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    setError('');
    toast('info', 'Reset email is not connected yet', 'SMTP and recovery tokens belong to later phases.');
  };

  return (
    <div>
      <h1 className="typo-page-title">Forgot password</h1>
      <p className="typo-secondary mt-2">Enter your email and we will send reset instructions.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Button type="submit" fullWidth>
          Send reset link
        </Button>
      </form>

      <p className="typo-secondary mt-6 text-center">
        Remembered your password?{' '}
        <Link to={PATHS.login} className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
