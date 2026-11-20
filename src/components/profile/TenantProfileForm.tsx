import { TenantProfileImageField } from '@/components/tenants/TenantProfileImageField';
import { TextInput } from '@/components/forms/TextInput';
import type { TenantProfileFormValues } from '@/types/support';
import type { TenantProfileFormErrors } from '@/utils/supportValidation';

interface TenantProfileFormProps {
  values: TenantProfileFormValues;
  errors: TenantProfileFormErrors;
  displayName: string;
  onChange: (values: TenantProfileFormValues) => void;
}

export function TenantProfileForm({ values, errors, displayName, onChange }: TenantProfileFormProps) {
  const update = <K extends keyof TenantProfileFormValues>(key: K, value: TenantProfileFormValues[K]) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-5">
      <TenantProfileImageField
        name={displayName}
        value={values.profileImage}
        onChange={(url) => update('profileImage', url)}
      />
      <TextInput
        label="Phone"
        name="phone"
        value={values.phone}
        error={errors.phone}
        required
        onChange={(event) => update('phone', event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Address line 1"
          name="addressLine1"
          value={values.addressLine1}
          error={errors.addressLine1}
          required
          onChange={(event) => update('addressLine1', event.target.value)}
        />
        <TextInput
          label="Address line 2"
          name="addressLine2"
          value={values.addressLine2}
          onChange={(event) => update('addressLine2', event.target.value)}
        />
        <TextInput
          label="City"
          name="city"
          value={values.city}
          error={errors.city}
          required
          onChange={(event) => update('city', event.target.value)}
        />
        <TextInput
          label="State"
          name="state"
          value={values.state}
          error={errors.state}
          required
          onChange={(event) => update('state', event.target.value)}
        />
        <TextInput
          label="Postal code"
          name="postalCode"
          value={values.postalCode}
          error={errors.postalCode}
          required
          onChange={(event) => update('postalCode', event.target.value)}
        />
        <TextInput
          label="Country"
          name="country"
          value={values.country}
          onChange={(event) => update('country', event.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Emergency contact"
          name="emergencyName"
          value={values.emergencyName}
          error={errors.emergencyName}
          required
          onChange={(event) => update('emergencyName', event.target.value)}
        />
        <TextInput
          label="Relationship"
          name="emergencyRelationship"
          value={values.emergencyRelationship}
          error={errors.emergencyRelationship}
          required
          onChange={(event) => update('emergencyRelationship', event.target.value)}
        />
        <TextInput
          label="Emergency phone"
          name="emergencyPhone"
          value={values.emergencyPhone}
          error={errors.emergencyPhone}
          required
          onChange={(event) => update('emergencyPhone', event.target.value)}
        />
        <TextInput
          label="Emergency email"
          name="emergencyEmail"
          value={values.emergencyEmail}
          error={errors.emergencyEmail}
          onChange={(event) => update('emergencyEmail', event.target.value)}
        />
        <div className="sm:col-span-2">
          <TextInput
            label="Emergency address"
            name="emergencyAddress"
            value={values.emergencyAddress}
            onChange={(event) => update('emergencyAddress', event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
