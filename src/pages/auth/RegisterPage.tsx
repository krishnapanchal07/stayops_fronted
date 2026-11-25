import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { inquiryService } from '@/services/inquiry/inquiryService';
import { PATHS } from '@/routes/paths';
import { Mail, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function RegisterPage() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('tenant');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || success) return;
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await inquiryService.submitGeneralInquiry({ name: name.trim(), email: email.trim(), inquiryType }, idempotencyKey);
      setSuccess(true);
      toast('success', 'Inquiry submitted', 'Our team will follow up by email.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit inquiry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="typo-page-title">Create an inquiry</h1>
      <p className="typo-secondary mt-2">Tell us who you are and we will follow up.</p>

      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Full name"
          name="name"
          placeholder="Your name"
          value={name}
          onChange={(event) => { setName(event.target.value); setIdempotencyKey(crypto.randomUUID()); setSuccess(false); }}
          disabled={saving}
          maxLength={120}
          leftIcon={<User className="h-4 w-4" />}
          required
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => { setEmail(event.target.value); setIdempotencyKey(crypto.randomUUID()); setSuccess(false); }}
          disabled={saving}
          maxLength={320}
          error={error}
          leftIcon={<Mail className="h-4 w-4" />}
          required
        />
        <Select
          label="I am a"
          name="inquiryType"
          disabled={saving}
          value={inquiryType}
          onChange={(event) => { setInquiryType(event.target.value); setIdempotencyKey(crypto.randomUUID()); setSuccess(false); }}
          options={[
            { label: 'Student / Tenant', value: 'tenant' },
            { label: 'Property Owner', value: 'owner' },
            { label: 'Staff member', value: 'staff' },
          ]}
        />
        <Button type="submit" fullWidth disabled={saving || success}>
          {saving ? 'Submitting…' : success ? 'Inquiry submitted' : 'Submit inquiry'}
        </Button>
        {success ? <p role="status" className="text-sm text-success">Your inquiry was saved. Our team will follow up by email.</p> : null}
      </form>

      <p className="typo-secondary mt-6 text-center">
        Looking for a room?{' '}
        <Link to={PATHS.findRoom} className="font-medium text-primary hover:underline">
          Browse rooms
        </Link>
      </p>
      <p className="typo-secondary mt-3 text-center">
        Already have an account?{' '}
        <Link to={PATHS.login} className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
