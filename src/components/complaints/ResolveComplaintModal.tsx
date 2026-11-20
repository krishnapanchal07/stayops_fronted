import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';

interface ResolveComplaintModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (resolution: string, actualCost?: number) => void;
}

export function ResolveComplaintModal({ open, submitting, onClose, onSubmit }: ResolveComplaintModalProps) {
  const [resolution, setResolution] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [error, setError] = useState('');

  return (
    <Modal
      open={open}
      title="Resolve Complaint"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              if (!resolution.trim()) {
                setError('Resolution notes are required.');
                return;
              }
              const cost = actualCost.trim() ? Number(actualCost) : undefined;
              if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
                setError('Actual cost cannot be negative.');
                return;
              }
              onSubmit(resolution, cost);
            }}
          >
            {submitting ? 'Saving…' : 'Mark Resolved'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Textarea
          label="Resolution Notes"
          name="resolution"
          required
          error={error && !actualCost ? error : undefined}
          value={resolution}
          placeholder="What was done to fix the issue?"
          onChange={(event) => setResolution(event.target.value)}
        />
        <TextInput
          label="Actual Cost"
          name="actualCost"
          type="number"
          min={0}
          error={error.includes('cost') ? error : undefined}
          value={actualCost}
          placeholder="Optional"
          onChange={(event) => setActualCost(event.target.value)}
        />
      </div>
    </Modal>
  );
}
