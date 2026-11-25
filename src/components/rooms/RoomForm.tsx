import { inventoryService } from '@/services/room/inventoryService';
import { useAsyncResource } from '@/hooks/useAsyncResource';
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
import { capacityFromSharing } from '@/utils/roomStats';
import { emptyRoomForm, validateRoomForm, type RoomFormErrors } from '@/utils/roomValidation';
import { useCallback, useRef, useState, type FormEvent } from 'react';

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

  const buildingLoader=useCallback(()=>values.propertyId?inventoryService.buildings(values.propertyId):Promise.resolve([]),[values.propertyId]);
  const floorLoader=useCallback(()=>values.buildingId?inventoryService.floors(values.buildingId):Promise.resolve([]),[values.buildingId]);
  const buildingState=useAsyncResource(buildingLoader); const floorState=useAsyncResource(floorLoader);
  const buildingOptions=(buildingState.data??[]).filter(b=>b.propertyId===values.propertyId&&(b.status==='ACTIVE'||b.id===values.buildingId)).map(b=>({value:b.id,label:b.name}));
  const floorOptions=(floorState.data??[]).filter(f=>f.buildingId===values.buildingId&&(f.status==='ACTIVE'||f.id===values.floorId)).map(f=>({value:f.id,label:f.name}));
  const submitLock=useRef(false);

  const update = <K extends keyof RoomFormValues>(key: K, value: RoomFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSharingChange = (sharingType: RoomFormValues['sharingType']) => {
    const capacity = capacityFromSharing(sharingType);
    setValues(current => ({...current,sharingType,capacity}));
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
    if(submitting || submitLock.current) return;
    const nextErrors = validateRoomForm(values, rooms, editingId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    submitLock.current=true;
    try { await onSubmit({
      ...values,
      roomNumber: values.roomNumber.trim(),
      description: values.description.trim(),
      capacity: capacityFromSharing(values.sharingType),
    }); } finally { submitLock.current=false; }
  };

  return (
    <form className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
      {buildingState.status==='error'&&<p role="alert">{buildingState.error}<Button type="button" onClick={buildingState.reload}>Retry buildings</Button></p>}
      {floorState.status==='error'&&<p role="alert">{floorState.error}<Button type="button" onClick={floorState.reload}>Retry floors</Button></p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Property"
          name="propertyId"
          disabled={mode==='edit' || submitting}
          value={values.propertyId}
          options={[
            { value: '', label: 'Select property' },
            ...properties.filter(p=>p.status==='ACTIVE'||p.id===values.propertyId).map((property) => ({ value: property.id, label: property.name })),
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
          disabled={mode==='edit' || !values.propertyId || buildingState.status!=='success' || submitting}
          value={values.buildingId}
          options={[{ value: '', label: buildingState.status==='loading'?'Loading buildings…':buildingOptions.length?'Select building':'No active buildings' }, ...buildingOptions]}
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
          disabled={mode==='edit' || !values.buildingId || floorState.status!=='success' || submitting}
          value={values.floorId}
          options={[{ value: '', label: floorState.status==='loading'?'Loading floors…':floorOptions.length?'Select floor':'No active floors' }, ...floorOptions]}
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
