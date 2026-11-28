import { ComplaintPrioritySelector } from '@/components/complaints/ComplaintPrioritySelector';
import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Complaint, ComplaintPriority, StaffOption } from '@/types/complaint';
import { validateAssignment } from '@/utils/complaintValidation';
import { useState } from 'react';

interface AssignComplaintModalProps {
  open: boolean;
  complaint: Complaint | null;
  staff: StaffOption[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, priority: ComplaintPriority, dueAt?: string, estimatedCost?: number | null) => void;
}

export function AssignComplaintModal({
  open,
  complaint,
  staff,
  submitting,
  onClose,
  onSubmit,
}: AssignComplaintModalProps) {
  const [staffId, setStaffId] = useState(complaint?.assignedTo ?? '');
  const [priority, setPriority] = useState<ComplaintPriority>(complaint?.priority ?? 'MEDIUM');
  const defaultDue = complaint
    ? new Date(complaint.dueAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    : '';
  const [dueDate, setDueDate] = useState(defaultDue);
  const [estimate, setEstimate] = useState(complaint?.estimatedCost?.toString() ?? '');
  const [errors, setErrors] = useState<{ staffId?: string; dueDate?: string; estimate?: string }>({});

  return (
    <Modal
      open={open}
      title="Assign Complaint"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              const nextErrors: typeof errors = validateAssignment(staffId, dueDate);
              if (estimate && (!/^\d+(\.\d{1,2})?$/.test(estimate) || Number(estimate) > 9999999999.99)) {
                nextErrors.estimate = 'Enter a nonnegative amount with up to two decimal places.';
              }
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              const dueAt = dueDate === defaultDue ? undefined : `${dueDate}T23:59:59+05:30`;
              onSubmit(staffId, priority, dueAt, estimate === '' ? null : Number(estimate));
            }}
          >
            {submitting ? 'Assigning…' : 'Assign'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Maintenance Staff"
          name="staffId"
          required
          error={errors.staffId}
          value={staffId}
          placeholder="Select staff"
          options={staff.map((person) => ({ value: person.id, label: person.name }))}
          onChange={(event) => setStaffId(event.target.value)}
        />
        <ComplaintPrioritySelector value={priority} onChange={setPriority} />
        <TextInput label="Estimated Cost" name="estimatedCost" type="number" min={0} step="0.01"
          value={estimate} error={errors.estimate} onChange={(event) => setEstimate(event.target.value)} />
        <DateInput
          label="Due Date"
          name="dueDate"
          required
          error={errors.dueDate}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </div>
    </Modal>
  );
}
