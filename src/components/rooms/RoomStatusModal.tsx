import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ROOM_STATUS_LABELS, RoomStatus, type Room } from '@/types/room';
import { validateRoomStatusChange } from '@/utils/roomValidation';
import { useState } from 'react';

interface RoomStatusModalProps {
  open: boolean;
  room: Room | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (status: Room['status']) => Promise<void>;
}

const options = [RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE, RoomStatus.BLOCKED].map((value) => ({
  value,
  label: ROOM_STATUS_LABELS[value],
}));

export function RoomStatusModal({ open, room, submitting = false, onClose, onSubmit }: RoomStatusModalProps) {
  const [status, setStatus] = useState<Room['status']>(
    room?.status === RoomStatus.MAINTENANCE || room?.status === RoomStatus.BLOCKED
      ? room.status
      : RoomStatus.AVAILABLE,
  );
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!room) return;
    const blocked = validateRoomStatusChange(room, status);
    if (blocked) {
      setError(blocked);
      return;
    }
    await onSubmit(status);
  };

  return (
    <Modal
      open={open}
      title={room ? `Change status · Room ${room.roomNumber}` : 'Change status'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !room}>
            {submitting ? 'Updating…' : 'Update Status'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="typo-secondary">
          Maintenance and blocked rooms cannot be allocated. Occupancy statuses stay derived from beds.
        </p>
        <Select
          label="Room Status"
          name="roomStatus"
          value={status}
          options={options}
          onChange={(event) => setStatus(event.target.value as Room['status'])}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    </Modal>
  );
}
