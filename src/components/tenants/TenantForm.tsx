import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { TextInput } from '@/components/forms/TextInput';
import { TenantProfileImageField } from '@/components/tenants/TenantProfileImageField';
import { Button } from '@/components/ui/Button';
import type { Property } from '@/types/property';
import { BedStatus, type RoomListItem } from '@/types/room';
import {
  TENANT_GENDER_LABELS,
  TENANT_SOURCE_LABELS,
  TENANT_STATUS_LABELS,
  TenantGender,
  TenantSource,
  TenantStatus,
  type Tenant,
  type TenantFormValues,
} from '@/types/tenant';
import { emptyTenantForm, validateTenantForm, type TenantFormErrors } from '@/utils/tenantValidation';
import { useMemo, useState, type FormEvent } from 'react';

interface TenantFormProps {
  mode: 'create' | 'edit';
  properties: Property[];
  rooms: RoomListItem[];
  tenants: Tenant[];
  editingId?: string;
  initialValues?: TenantFormValues;
  submitting?: boolean;
  canAssignRoom?: boolean;
  onSubmit: (values: TenantFormValues) => Promise<void>;
  onCancel: () => void;
}

const genderOptions = Object.values(TenantGender).map((value) => ({
  value,
  label: TENANT_GENDER_LABELS[value],
}));

const statusOptions = Object.values(TenantStatus).map((value) => ({
  value,
  label: TENANT_STATUS_LABELS[value],
}));

const sourceOptions = Object.values(TenantSource).map((value) => ({
  value,
  label: TENANT_SOURCE_LABELS[value],
}));

export function TenantForm({
  mode,
  properties,
  rooms,
  tenants,
  editingId,
  initialValues,
  submitting = false,
  canAssignRoom = true,
  onSubmit,
  onCancel,
}: TenantFormProps) {
  const [values, setValues] = useState<TenantFormValues>(initialValues ?? emptyTenantForm());
  const [errors, setErrors] = useState<TenantFormErrors>({});

  const selectedProperty = properties.find((property) => property.id === values.propertyId);
  const selectedBuilding = selectedProperty?.buildings.find((building) => building.id === values.buildingId);
  const selectedRoom = rooms.find((room) => room.id === values.roomId);

  const buildingOptions = useMemo(
    () => (selectedProperty?.buildings ?? []).map((building) => ({ value: building.id, label: building.name })),
    [selectedProperty],
  );
  const floorOptions = useMemo(
    () => (selectedBuilding?.floors ?? []).map((floor) => ({ value: floor.id, label: floor.name })),
    [selectedBuilding],
  );
  const roomOptions = useMemo(
    () =>
      rooms
        .filter((room) => {
          if (values.propertyId && room.propertyId !== values.propertyId) return false;
          if (values.buildingId && room.buildingId !== values.buildingId) return false;
          if (values.floorId && room.floorId !== values.floorId) return false;
          return true;
        })
        .map((room) => ({ value: room.id, label: `Room ${room.roomNumber}` })),
    [rooms, values.buildingId, values.floorId, values.propertyId],
  );
  const bedOptions = useMemo(
    () =>
      (selectedRoom?.beds ?? [])
        .filter((bed) => bed.status === BedStatus.AVAILABLE || bed.id === values.bedId)
        .map((bed) => ({
          value: bed.id,
          label: bed.status === BedStatus.AVAILABLE || bed.id === values.bedId ? bed.label : `${bed.label} (${bed.status})`,
        })),
    [selectedRoom, values.bedId],
  );

  const update = <K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateTenantForm(values, tenants, editingId);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit({
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.replace(/\D/g, ''),
    });
  };

  return (
    <form className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
      <TenantProfileImageField
        name={`${values.firstName} ${values.lastName}`.trim() || 'Tenant'}
        value={values.profileImage}
        onChange={(url) => update('profileImage', url)}
        disabled={submitting}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="First Name"
          name="firstName"
          value={values.firstName}
          onChange={(event) => update('firstName', event.target.value)}
          error={errors.firstName}
          required
        />
        <TextInput
          label="Last Name"
          name="lastName"
          value={values.lastName}
          onChange={(event) => update('lastName', event.target.value)}
          error={errors.lastName}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
          required
        />
        <TextInput
          label="Phone"
          name="phone"
          value={values.phone}
          onChange={(event) => update('phone', event.target.value)}
          error={errors.phone}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DateInput
          label="Date of Birth"
          name="dateOfBirth"
          value={values.dateOfBirth}
          onChange={(event) => update('dateOfBirth', event.target.value)}
          error={errors.dateOfBirth}
        />
        <Select
          label="Gender"
          name="gender"
          value={values.gender}
          options={[{ value: '', label: 'Select gender' }, ...genderOptions]}
          onChange={(event) => update('gender', event.target.value as TenantFormValues['gender'])}
        />
      </div>

      <fieldset className="min-w-0">
        <legend className="typo-label mb-3">Address</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Address line 1"
            name="addressLine1"
            value={values.addressLine1}
            onChange={(event) => update('addressLine1', event.target.value)}
          />
          <TextInput
            label="Address line 2"
            name="addressLine2"
            value={values.addressLine2}
            onChange={(event) => update('addressLine2', event.target.value)}
          />
          <TextInput label="City" name="city" value={values.city} onChange={(event) => update('city', event.target.value)} />
          <TextInput label="State" name="state" value={values.state} onChange={(event) => update('state', event.target.value)} />
          <TextInput
            label="Postal code"
            name="postalCode"
            value={values.postalCode}
            onChange={(event) => update('postalCode', event.target.value)}
          />
          <TextInput
            label="Country"
            name="country"
            value={values.country}
            onChange={(event) => update('country', event.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="typo-label mb-3">Emergency Contact</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Name"
            name="emergencyName"
            value={values.emergencyName}
            onChange={(event) => update('emergencyName', event.target.value)}
          />
          <TextInput
            label="Relationship"
            name="emergencyRelationship"
            value={values.emergencyRelationship}
            onChange={(event) => update('emergencyRelationship', event.target.value)}
          />
          <TextInput
            label="Phone"
            name="emergencyPhone"
            value={values.emergencyPhone}
            onChange={(event) => update('emergencyPhone', event.target.value)}
            error={errors.emergencyPhone}
          />
          <TextInput
            label="Email"
            name="emergencyEmail"
            value={values.emergencyEmail}
            onChange={(event) => update('emergencyEmail', event.target.value)}
            error={errors.emergencyEmail}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Address"
              name="emergencyAddress"
              value={values.emergencyAddress}
              onChange={(event) => update('emergencyAddress', event.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="min-w-0">
        <legend className="typo-label mb-3">Current Stay</legend>
        {!canAssignRoom ? (
          <p className="typo-helper mb-3">Room assignment is limited for this role.</p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Property"
            name="propertyId"
            value={values.propertyId}
            options={[{ value: '', label: 'Select property' }, ...properties.map((property) => ({ value: property.id, label: property.name }))]}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                propertyId: event.target.value,
                buildingId: '',
                floorId: '',
                roomId: '',
                bedId: '',
              }))
            }
            disabled={!canAssignRoom}
          />
          <Select
            label="Building"
            name="buildingId"
            value={values.buildingId}
            options={[{ value: '', label: 'Select building' }, ...buildingOptions]}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                buildingId: event.target.value,
                floorId: '',
                roomId: '',
                bedId: '',
              }))
            }
            disabled={!canAssignRoom}
          />
          <Select
            label="Floor"
            name="floorId"
            value={values.floorId}
            options={[{ value: '', label: 'Select floor' }, ...floorOptions]}
            onChange={(event) =>
              setValues((current) => ({ ...current, floorId: event.target.value, roomId: '', bedId: '' }))
            }
            disabled={!canAssignRoom}
          />
          <Select
            label="Room"
            name="roomId"
            value={values.roomId}
            options={[{ value: '', label: 'No room yet' }, ...roomOptions]}
            onChange={(event) => {
              const room = rooms.find((item) => item.id === event.target.value);
              setValues((current) => ({
                ...current,
                roomId: event.target.value,
                bedId: '',
                roomRent: room?.monthlyRent ?? current.roomRent,
                securityDeposit: room?.securityDeposit ?? current.securityDeposit,
              }));
            }}
            disabled={!canAssignRoom}
          />
          <Select
            label="Bed"
            name="bedId"
            value={values.bedId}
            options={[{ value: '', label: 'No bed yet' }, ...bedOptions]}
            onChange={(event) => {
              const bed = selectedRoom?.beds.find((item) => item.id === event.target.value);
              setValues((current) => ({
                ...current,
                bedId: event.target.value,
                roomRent: bed?.rent ?? current.roomRent,
              }));
            }}
            error={errors.bedId}
            helperText="Only available beds are shown."
            disabled={!canAssignRoom}
          />
          <Select
            label="Status"
            name="status"
            value={values.status}
            options={statusOptions}
            onChange={(event) => update('status', event.target.value as TenantFormValues['status'])}
          />
          <DateInput
            label="Move-in Date"
            name="moveInDate"
            value={values.moveInDate}
            onChange={(event) => update('moveInDate', event.target.value)}
          />
          <DateInput
            label="Expected Move-out Date"
            name="expectedMoveOutDate"
            value={values.expectedMoveOutDate}
            onChange={(event) => update('expectedMoveOutDate', event.target.value)}
            error={errors.expectedMoveOutDate}
          />
          <TextInput
            label="Monthly Rent"
            name="roomRent"
            type="number"
            min={0}
            value={String(values.roomRent || '')}
            onChange={(event) => update('roomRent', Number(event.target.value))}
            error={errors.roomRent}
          />
          <TextInput
            label="Security Deposit"
            name="securityDeposit"
            type="number"
            min={0}
            value={String(values.securityDeposit || '')}
            onChange={(event) => update('securityDeposit', Number(event.target.value))}
            error={errors.securityDeposit}
          />
        </div>
      </fieldset>

      <Select
        label="Source"
        name="source"
        value={values.source}
        options={sourceOptions}
        helperText="Use Convert to Tenant from Inquiries to keep the real inquiry ID. Manual inquiry source is still allowed."
        onChange={(event) => update('source', event.target.value as TenantFormValues['source'])}
      />

      <Textarea
        label="Internal notes"
        name="internalNotes"
        value={values.internalNotes}
        onChange={(event) => update('internalNotes', event.target.value)}
        helperText="Visible to admin and warden only."
        rows={3}
      />

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Save Tenant' : 'Update Tenant'}
        </Button>
      </div>
    </form>
  );
}
