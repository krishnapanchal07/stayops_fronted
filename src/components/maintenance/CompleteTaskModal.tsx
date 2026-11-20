import { DateInput } from '@/components/forms/DateInput';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { CompleteTaskValues } from '@/types/maintenance';
import { validateCompleteTask, type CompleteTaskErrors } from '@/utils/complaintValidation';
import { useState } from 'react';

interface CompleteTaskModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CompleteTaskValues) => void;
}

export function CompleteTaskModal({ open, submitting, onClose, onSubmit }: CompleteTaskModalProps) {
  const [values, setValues] = useState<CompleteTaskValues>({
    resolutionNotes: '',
    actualCost: 0,
    partsUsed: '',
    completedAt: new Date().toISOString().slice(0, 10),
  });
  const [errors, setErrors] = useState<CompleteTaskErrors>({});

  return (
    <Modal
      open={open}
      title="Complete Task"
      onClose={onClose}
      className="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              const nextErrors = validateCompleteTask(values);
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              onSubmit(values);
            }}
          >
            {submitting ? 'Completing…' : 'Mark Completed'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Textarea
          label="Resolution Notes"
          name="resolutionNotes"
          required
          error={errors.resolutionNotes}
          value={values.resolutionNotes}
          placeholder="Example: Replaced bathroom pipe."
          onChange={(event) => setValues((current) => ({ ...current, resolutionNotes: event.target.value }))}
        />
        <TextInput
          label="Actual Cost"
          name="actualCost"
          type="number"
          min={0}
          error={errors.actualCost}
          value={String(values.actualCost)}
          onChange={(event) => setValues((current) => ({ ...current, actualCost: Number(event.target.value) }))}
        />
        <TextInput
          label="Parts Used"
          name="partsUsed"
          value={values.partsUsed}
          placeholder="PVC pipe, Sealant"
          onChange={(event) => setValues((current) => ({ ...current, partsUsed: event.target.value }))}
        />
        <DateInput
          label="Completion Date"
          name="completedAt"
          required
          error={errors.completedAt}
          value={values.completedAt}
          onChange={(event) => setValues((current) => ({ ...current, completedAt: event.target.value }))}
        />
      </div>
    </Modal>
  );
}
