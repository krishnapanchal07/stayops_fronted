import { ComplaintPrioritySelector } from '@/components/complaints/ComplaintPrioritySelector';
import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { Complaint, ComplaintPriority, StaffOption } from '@/types/complaint';
import { calculateComplaintDueDate } from '@/utils/complaintRules';
import { validateAssignment } from '@/utils/complaintValidation';
import { useState } from 'react';

interface AssignComplaintModalProps {
  open: boolean;
  complaint: Complaint | null;
  staff: StaffOption[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (staffId: string, priority: ComplaintPriority, dueAt: string) => void;
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
    ? (complaint.dueAt || calculateComplaintDueDate(complaint.createdAt, complaint.priority)).slice(0, 10)
    : '';
  const [dueDate, setDueDate] = useState(defaultDue);
  const [errors, setErrors] = useState<{ staffId?: string; dueDate?: string }>({});

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
              const nextErrors = validateAssignment(staffId, dueDate);
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length > 0) return;
              const dueAt = dueDate.includes('T') ? dueDate : `${dueDate}T18:00:00.000Z`;
              onSubmit(staffId, priority, dueAt);
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
