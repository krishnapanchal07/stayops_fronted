import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setError('');
    toast('info', 'Inquiry captured locally', 'Registration will be connected in a later phase.');
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
          onChange={(event) => setName(event.target.value)}
          leftIcon={<User className="h-4 w-4" />}
          required
        />
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
        <Select
          label="I am a"
          name="inquiryType"
          value={inquiryType}
          onChange={(event) => setInquiryType(event.target.value)}
          options={[
            { label: 'Student / Tenant', value: 'tenant' },
            { label: 'Property Owner', value: 'owner' },
            { label: 'Staff member', value: 'staff' },
          ]}
        />
        <Button type="submit" fullWidth>
          Submit inquiry
        </Button>
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
