import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TENANT_STATUS_LABELS, TenantStatus, type Tenant } from '@/types/tenant';
import { useState } from 'react';

interface TenantStatusModalProps {
  open: boolean;
  tenant: Tenant | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (status: TenantStatus) => Promise<void>;
}

const transitions: Record<TenantStatus, TenantStatus[]> = {
  PROSPECT: ['ONBOARDING', 'INACTIVE'],
  ONBOARDING: ['ACTIVE', 'INACTIVE', 'CHECKED_OUT'],
  ACTIVE: ['NOTICE_PERIOD', 'INACTIVE', 'CHECKED_OUT'],
  NOTICE_PERIOD: ['ACTIVE', 'INACTIVE', 'CHECKED_OUT'],
  INACTIVE: ['ONBOARDING', 'ACTIVE', 'CHECKED_OUT'],
  CHECKED_OUT: ['ONBOARDING'],
};

export function TenantStatusModal({
  open,
  tenant,
  submitting = false,
  onClose,
  onSubmit,
}: TenantStatusModalProps) {
  const options = (tenant ? transitions[tenant.status] : []).map((value) => ({ value, label: TENANT_STATUS_LABELS[value] }));
  const [status, setStatus] = useState<TenantStatus>(options[0]?.value ?? TenantStatus.ONBOARDING);
  const [confirming, setConfirming] = useState(false);

  const needsConfirm = status === TenantStatus.INACTIVE || status === TenantStatus.CHECKED_OUT;

  const handleSubmit = async () => {
    if (!tenant) return;
    if (needsConfirm && !confirming) {
      setConfirming(true);
      return;
    }
    await onSubmit(status);
    setConfirming(false);
  };

  return (
    <Modal
      open={open}
      title={tenant ? `Change status · ${tenant.fullName}` : 'Change status'}
      onClose={() => {
        setConfirming(false);
        onClose();
      }}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              setConfirming(false);
              onClose();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant={needsConfirm ? 'danger' : 'primary'}
            onClick={handleSubmit}
            disabled={submitting || !tenant}
          >
            {submitting
              ? 'Updating…'
              : confirming && status === TenantStatus.INACTIVE
                ? 'Deactivate'
                : confirming && status === TenantStatus.CHECKED_OUT
                  ? 'Confirm Checkout Status'
                  : 'Update Status'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {confirming ? (
          <p className="typo-secondary">
            {status === TenantStatus.INACTIVE
              ? 'Deactivate this tenant? This releases the bed and disables tenant profile editing. Login access is managed separately.'
              : 'Mark this tenant as checked out? The assigned bed will be released.'}
          </p>
        ) : (
          <>
            <p className="typo-secondary">
              Tenant status is separate from room and bed status. Active and notice-period tenants can keep an occupied bed.
            </p>
            <Select
              label="Tenant Status"
              name="tenantStatus"
              value={status}
              options={options}
              onChange={(event) => setStatus(event.target.value as TenantStatus)}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
