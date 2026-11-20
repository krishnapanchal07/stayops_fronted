import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Tenant } from '@/types/tenant';

interface TenantCheckoutModalProps {
  open: boolean;
  tenant: Tenant | null;
  onClose: () => void;
}

export function TenantCheckoutModal({ open, tenant, onClose }: TenantCheckoutModalProps) {
  return (
    <Modal
      open={open}
      title={tenant ? `Start checkout · ${tenant.fullName}` : 'Start checkout'}
      onClose={onClose}
      footer={
        <Button onClick={onClose}>Close</Button>
      }
    >
      <div className="space-y-3">
        <p className="typo-secondary">
          Checkout is prepared here but the full financial workflow arrives in a later phase.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-text-secondary">
          <li>Move-out date</li>
          <li>Final dues</li>
          <li>Deposit settlement</li>
          <li>Room and bed release</li>
          <li>Document closure</li>
        </ul>
      </div>
    </Modal>
  );
}
