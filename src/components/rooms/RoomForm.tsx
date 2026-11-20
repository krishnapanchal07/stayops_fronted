import { Checkbox } from '@/components/forms/Checkbox';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { TextInput } from '@/components/forms/TextInput';
import { RoomImageManager } from '@/components/rooms/RoomImageManager';
import { Button } from '@/components/ui/Button';
import type { Property } from '@/types/property';
import {
  ROOM_AMENITIES,
  ROOM_STATUS_LABELS,
  ROOM_TYPE_LABELS,
  RoomStatus,
  RoomType,
  SHARING_TYPE_LABELS,
  SharingType,
  type Room,
  type RoomFormValues,
} from '@/types/room';
import { capacityFromSharing, rentForSharing } from '@/utils/roomStats';
import { emptyRoomForm, validateRoomForm, type RoomFormErrors } from '@/utils/roomValidation';
import { useMemo, useState, type FormEvent } from 'react';

interface RoomFormProps {
  mode: 'create' | 'edit';
  properties: Property[];
  rooms: Room[];
  editingId?: string;
  initialValues?: RoomFormValues;
  submitting?: boolean;
  onSubmit: (values: RoomFormValues) => Promise<void>;
  onCancel: () => void;
}

const typeOptions = Object.values(RoomType).map((value) => ({
  value,
  label: ROOM_TYPE_LABELS[value],
}));

const sharingOptions = Object.values(SharingType).map((value) => ({
  value,
  label: SHARING_TYPE_LABELS[value],
}));

const statusOptions = [RoomStatus.AVAILABLE, RoomStatus.MAINTENANCE, RoomStatus.BLOCKED].map((value) => ({
  value,
  label: ROOM_STATUS_LABELS[value],
}));

export function RoomForm({
  mode,
  properties,
  rooms,
  editingId,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}: RoomFormProps) {
  const [values, setValues] = useState<RoomFormValues>(initialValues ?? emptyRoomForm());
  const [errors, setErrors] = useState<RoomFormErrors>({});

  const selectedProperty = properties.find((property) => property.id === values.propertyId);
  const selectedBuilding = selectedProperty?.buildings.find((building) => building.id === values.buildingId);
  const buildingOptions = useMemo(
    () => (selectedProperty?.buildings ?? []).map((building) => ({ value: building.id, label: building.name })),
    [selectedProperty],
  );
  const floorOptions = useMemo(
    () => (selectedBuilding?.floors ?? []).map((floor) => ({ value: floor.id, label: floor.name })),
    [selectedBuilding],
  );

  const update = <K extends keyof RoomFormValues>(key: K, value: RoomFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSharingChange = (sharingType: RoomFormValues['sharingType']) => {
    const capacity = capacityFromSharing(sharingType);
    setValues((current) => {
      const next = { ...current, sharingType, capacity };
      if (mode === 'create' && current.monthlyRent === rentForSharing(current.sharingType)) {
        next.monthlyRent = rentForSharing(sharingType);
        next.securityDeposit = rentForSharing(sharingType);
      }
      return next;
    });
  };

  const toggleAmenity = (amenity: string, checked: boolean) => {
    setValues((current) => ({
      ...current,
      amenities: checked
        ? [...current.amenities, amenity]
        : current.amenities.filter((item) => item !== amenity),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateRoomForm(values, rooms, editingId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    await onSubmit({
      ...values,
      roomNumber: values.roomNumber.trim(),
      description: values.description.trim(),
      capacity: capacityFromSharing(values.sharingType),
    });
  };

  return (
    <form className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Property"
          name="propertyId"
          value={values.propertyId}
          options={[
            { value: '', label: 'Select property' },
            ...properties.map((property) => ({ value: property.id, label: property.name })),
          ]}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              propertyId: event.target.value,
              buildingId: '',
              floorId: '',
            }))
          }
          error={errors.propertyId}
          required
        />
        <Select
          label="Building"
          name="buildingId"
          value={values.buildingId}
          options={[{ value: '', label: 'Select building' }, ...buildingOptions]}
          onChange={(event) =>
            setValues((current) => ({ ...current, buildingId: event.target.value, floorId: '' }))
          }
          error={errors.buildingId}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Floor"
          name="floorId"
          value={values.floorId}
          options={[{ value: '', label: 'Select floor' }, ...floorOptions]}
          onChange={(event) => update('floorId', event.target.value)}
          error={errors.floorId}
          required
        />
        <TextInput
          label="Room Number"
          name="roomNumber"
          value={values.roomNumber}
          onChange={(event) => update('roomNumber', event.target.value)}
          error={errors.roomNumber}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Room Type"
          name="roomType"
          value={values.roomType}
          options={typeOptions}
          onChange={(event) => update('roomType', event.target.value as RoomFormValues['roomType'])}
        />
        <Select
          label="Sharing Type"
          name="sharingType"
          value={values.sharingType}
          options={sharingOptions}
          onChange={(event) => handleSharingChange(event.target.value as RoomFormValues['sharingType'])}
          error={errors.sharingType}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          label="Capacity"
          name="capacity"
          type="number"
          min={1}
          value={String(values.capacity)}
          onChange={(event) => update('capacity', Number(event.target.value))}
          error={errors.capacity}
          helperText="Matches the selected sharing type."
          required
        />
        <TextInput
          label="Monthly Rent"
          name="monthlyRent"
          type="number"
          min={1}
          value={String(values.monthlyRent)}
          onChange={(event) => update('monthlyRent', Number(event.target.value))}
          error={errors.monthlyRent}
          required
        />
        <TextInput
          label="Security Deposit"
          name="securityDeposit"
          type="number"
          min={0}
          value={String(values.securityDeposit)}
          onChange={(event) => update('securityDeposit', Number(event.target.value))}
          error={errors.securityDeposit}
          required
        />
      </div>

      <Select
        label="Status"
        name="status"
        value={values.status}
        options={statusOptions}
        onChange={(event) => update('status', event.target.value as RoomFormValues['status'])}
      />

      <Textarea
        label="Description"
        name="description"
        value={values.description}
        onChange={(event) => update('description', event.target.value)}
        error={errors.description}
        rows={3}
      />

      <fieldset>
        <legend className="typo-label mb-2">Amenities</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROOM_AMENITIES.map((amenity) => (
            <Checkbox
              key={amenity}
              label={amenity}
              name={`amenity-${amenity}`}
              checked={values.amenities.includes(amenity)}
              onChange={(event) => toggleAmenity(amenity, event.target.checked)}
            />
          ))}
        </div>
      </fieldset>

      <RoomImageManager
        images={values.images ?? []}
        onChange={(images) => update('images', images)}
        disabled={submitting}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Save Room' : 'Update Room'}
        </Button>
      </div>
    </form>
  );
}
