import { DateInput } from '@/components/forms/DateInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { tenantService } from '@/services/tenant/tenantService';
import type { Tenant } from '@/types/tenant';
import { useState } from 'react';

interface TenantCheckoutModalProps {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
  onComplete?: () => void;
}
export function TenantCheckoutModal({ open, tenant, onClose, onComplete }: TenantCheckoutModalProps) {
  const [moveOutDate, setMoveOutDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const checkout = async () => {
    if (!tenant || saving) return;
    setSaving(true);
    setError('');
    try {
      await tenantService.checkoutTenant(tenant.id, moveOutDate);
      onComplete?.();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to check out tenant.');
    } finally { setSaving(false); }
  };
  return (
    <Modal open={open} title={tenant ? `Checkout · ${tenant.fullName}` : 'Checkout'} onClose={saving ? () => {} : onClose}
      footer={<><Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button variant="danger" onClick={() => void checkout()} disabled={saving || !tenant || !moveOutDate || tenant.status === 'CHECKED_OUT'}>{saving ? 'Checking out…' : 'Confirm checkout'}</Button></>}>
      <div className="space-y-4">
        <p className="typo-secondary">Checkout saves the move-out date and releases the bed in one transaction. Invoices, outstanding dues and payment history are preserved. Deposit settlement and document closure are not automated.</p>
        <DateInput label="Move-out date" name="moveOutDate" value={moveOutDate} onChange={(event) => setMoveOutDate(event.target.value)} required />
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
