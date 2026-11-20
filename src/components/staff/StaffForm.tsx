import { Checkbox } from '@/components/forms/Checkbox';
import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { TenantProfileImageField } from '@/components/tenants/TenantProfileImageField';
import { Button } from '@/components/ui/Button';
import type { PropertyListItem } from '@/types/property';
import {
  STAFF_DEPARTMENT_BY_ROLE,
  STAFF_DEPARTMENT_LABELS,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_LABELS,
  StaffDepartment,
  StaffRole,
  StaffStatus,
  type StaffFormValues,
} from '@/types/staff';
import { emptyStaffForm, validateStaffForm, type StaffFormErrors } from '@/utils/staffValidation';
import { useState, type FormEvent } from 'react';

interface StaffFormProps {
  mode: 'create' | 'edit';
  properties: PropertyListItem[];
  initialValues?: StaffFormValues;
  submitting?: boolean;
  linkedAccount?: boolean;
  onSubmit: (values: StaffFormValues) => Promise<void>;
  onCancel: () => void;
}

export function StaffForm({
  mode,
  properties,
  initialValues,
  submitting = false,
  linkedAccount = false,
  onSubmit,
  onCancel,
}: StaffFormProps) {
  const [values, setValues] = useState<StaffFormValues>(initialValues ?? emptyStaffForm());
  const [errors, setErrors] = useState<StaffFormErrors>({});

  const patch = (partial: Partial<StaffFormValues>) => {
    setValues((current) => ({ ...current, ...partial }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateStaffForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <TenantProfileImageField
        name={`${values.firstName} ${values.lastName}`.trim() || 'Staff'}
        value={values.profileImage}
        onChange={(profileImage) => patch({ profileImage })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="First name"
          name="firstName"
          required
          value={values.firstName}
          error={errors.firstName}
          onChange={(event) => patch({ firstName: event.target.value })}
        />
        <TextInput
          label="Last name"
          name="lastName"
          required
          value={values.lastName}
          error={errors.lastName}
          onChange={(event) => patch({ lastName: event.target.value })}
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          required
          readOnly={linkedAccount}
          value={values.email}
          error={errors.email}
          helperText={linkedAccount ? 'Email is tied to the existing login account.' : undefined}
          onChange={(event) => patch({ email: event.target.value })}
        />
        <TextInput
          label="Phone"
          name="phone"
          required
          value={values.phone}
          error={errors.phone}
          onChange={(event) => patch({ phone: event.target.value })}
        />
        <Select
          label="Role"
          name="role"
          required
          disabled={linkedAccount}
          value={values.role}
          error={errors.role}
          helperText={linkedAccount ? 'Role stays aligned with the existing login account.' : undefined}
          options={[
            { label: 'Select role', value: '' },
            ...Object.values(StaffRole).map((value) => ({ value, label: STAFF_ROLE_LABELS[value] })),
          ]}
          onChange={(event) => {
            const role = event.target.value as StaffFormValues['role'];
            patch({
              role,
              department: role ? STAFF_DEPARTMENT_BY_ROLE[role] : values.department,
            });
          }}
        />
        <Select
          label="Department"
          name="department"
          required
          value={values.department}
          error={errors.department}
          options={[
            { label: 'Select department', value: '' },
            ...Object.values(StaffDepartment).map((value) => ({ value, label: STAFF_DEPARTMENT_LABELS[value] })),
          ]}
          onChange={(event) => patch({ department: event.target.value as StaffFormValues['department'] })}
        />
        <TextInput
          label="Designation"
          name="designation"
          required
          value={values.designation}
          error={errors.designation}
          onChange={(event) => patch({ designation: event.target.value })}
        />
        <DateInput
          label="Joining date"
          name="joiningDate"
          required
          value={values.joiningDate}
          error={errors.joiningDate}
          onChange={(event) => patch({ joiningDate: event.target.value })}
        />
        <Select
          label="Status"
          name="status"
          required
          value={values.status}
          error={errors.status}
          options={Object.values(StaffStatus).map((value) => ({ value, label: STAFF_STATUS_LABELS[value] }))}
          onChange={(event) => patch({ status: event.target.value as StaffStatus })}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text">Assigned properties</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {properties.map((property) => (
            <Checkbox
              key={property.id}
              label={property.name}
              name={`property-${property.id}`}
              checked={values.propertyIds.includes(property.id)}
              onChange={(event) => {
                const next = event.target.checked
                  ? [...values.propertyIds, property.id]
                  : values.propertyIds.filter((id) => id !== property.id);
                patch({ propertyIds: next });
              }}
            />
          ))}
        </div>
        {errors.propertyIds ? <p className="mt-1 text-sm text-danger">{errors.propertyIds}</p> : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Address line 1"
          name="addressLine1"
          required
          value={values.addressLine1}
          error={errors.addressLine1}
          onChange={(event) => patch({ addressLine1: event.target.value })}
        />
        <TextInput
          label="Address line 2"
          name="addressLine2"
          value={values.addressLine2}
          onChange={(event) => patch({ addressLine2: event.target.value })}
        />
        <TextInput
          label="City"
          name="city"
          required
          value={values.city}
          error={errors.city}
          onChange={(event) => patch({ city: event.target.value })}
        />
        <TextInput
          label="State"
          name="state"
          required
          value={values.state}
          error={errors.state}
          onChange={(event) => patch({ state: event.target.value })}
        />
        <TextInput
          label="Postal code"
          name="postalCode"
          value={values.postalCode}
          onChange={(event) => patch({ postalCode: event.target.value })}
        />
        <TextInput
          label="Emergency contact"
          name="emergencyName"
          required
          value={values.emergencyName}
          error={errors.emergencyName}
          onChange={(event) => patch({ emergencyName: event.target.value })}
        />
        <TextInput
          label="Relationship"
          name="emergencyRelationship"
          value={values.emergencyRelationship}
          onChange={(event) => patch({ emergencyRelationship: event.target.value })}
        />
        <TextInput
          label="Emergency phone"
          name="emergencyPhone"
          required
          value={values.emergencyPhone}
          error={errors.emergencyPhone}
          onChange={(event) => patch({ emergencyPhone: event.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Add staff' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
