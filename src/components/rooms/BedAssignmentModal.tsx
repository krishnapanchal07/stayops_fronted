import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { AssignBedInput, Bed, TenantReference } from '@/types/room';
import { useState, type FormEvent } from 'react';

interface BedAssignmentModalProps {
  open: boolean;
  bed: Bed | null;
  tenants: TenantReference[];
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (input: AssignBedInput) => Promise<void>;
}

export function BedAssignmentModal({
  open,
  bed,
  tenants,
  submitting = false,
  onClose,
  onSubmit,
}: BedAssignmentModalProps) {
  const [tenantId, setTenantId] = useState('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().slice(0, 10));
  const [rent, setRent] = useState(bed?.rent ?? 0);
  const [error, setError] = useState('');

  const reset = () => {
    setTenantId('');
    setMoveInDate(new Date().toISOString().slice(0, 10));
    setRent(bed?.rent ?? 0);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      setError('Select a tenant.');
      return;
    }
    if (!moveInDate) {
      setError('Move-in date is required.');
      return;
    }
    if (!Number.isFinite(rent) || rent <= 0) {
      setError('Enter a valid rent.');
      return;
    }

    await onSubmit({
      tenantId: tenant.id,
      tenantName: tenant.name,
      moveInDate,
      rent,
    });
    reset();
  };

  return (
    <Modal open={open} title={bed ? `Assign ${bed.label}` : 'Assign Bed'} onClose={handleClose}>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TextInput label="Bed" name="bedLabel" value={bed?.label ?? ''} readOnly />
        <Select
          label="Tenant"
          name="tenantId"
          value={tenantId}
          options={[
            { value: '', label: tenants.length ? 'Select tenant' : 'No unassigned tenants' },
            ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.name })),
          ]}
          onChange={(event) => setTenantId(event.target.value)}
          required
        />
        <DateInput
          label="Move-in Date"
          name="moveInDate"
          value={moveInDate}
          onChange={(event) => setMoveInDate(event.target.value)}
          required
        />
        <TextInput
          label="Rent"
          name="rent"
          type="number"
          min={1}
          value={String(rent)}
          onChange={(event) => setRent(Number(event.target.value))}
          required
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || !bed}>
            {submitting ? 'Assigning…' : 'Assign Bed'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
