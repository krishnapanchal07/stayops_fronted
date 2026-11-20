import { Checkbox } from '@/components/forms/Checkbox';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { TextInput } from '@/components/forms/TextInput';
import { Button } from '@/components/ui/Button';
import {
  PROPERTY_AMENITIES,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  PropertyStatus,
  PropertyType,
  type PropertyFormValues,
} from '@/types/property';
import {
  emptyPropertyForm,
  normalizedPropertyForm,
  toPropertyFormValues,
  validatePropertyForm,
  type PropertyFormErrors,
} from '@/utils/propertyValidation';
import { useState, type FormEvent } from 'react';

interface PropertyFormProps {
  mode: 'create' | 'edit';
  initialValues?: PropertyFormValues;
  submitting?: boolean;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  onCancel: () => void;
}

const typeOptions = Object.values(PropertyType).map((value) => ({
  value,
  label: PROPERTY_TYPE_LABELS[value],
}));

const statusOptions = Object.values(PropertyStatus).map((value) => ({
  value,
  label: PROPERTY_STATUS_LABELS[value],
}));

export function PropertyForm({
  mode,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const [values, setValues] = useState<PropertyFormValues>(
    initialValues ? toPropertyFormValues(initialValues) : emptyPropertyForm(),
  );
  const [errors, setErrors] = useState<PropertyFormErrors>({});

  const update = <K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
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
    const nextErrors = validatePropertyForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(normalizedPropertyForm(values));
  };

  return (
    <form className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Property Name"
          name="name"
          value={values.name}
          onChange={(event) => update('name', event.target.value)}
          error={errors.name}
          required
        />
        <Select
          label="Property Type"
          name="type"
          value={values.type}
          options={typeOptions}
          onChange={(event) => update('type', event.target.value as PropertyFormValues['type'])}
          error={errors.type}
          required
        />
      </div>

      <TextInput
        label="Address"
        name="address"
        value={values.address}
        onChange={(event) => update('address', event.target.value)}
        error={errors.address}
        required
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          label="City"
          name="city"
          value={values.city}
          onChange={(event) => update('city', event.target.value)}
          error={errors.city}
          required
        />
        <TextInput
          label="State"
          name="state"
          value={values.state}
          onChange={(event) => update('state', event.target.value)}
          error={errors.state}
          required
        />
        <TextInput
          label="Postal Code"
          name="postalCode"
          value={values.postalCode}
          onChange={(event) => update('postalCode', event.target.value)}
          error={errors.postalCode}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Contact Number"
          name="contactNumber"
          type="tel"
          value={values.contactNumber}
          onChange={(event) => update('contactNumber', event.target.value)}
          error={errors.contactNumber}
        />
        <TextInput
          label="Email"
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
        />
      </div>

      <Select
        label="Status"
        name="status"
        value={values.status}
        options={statusOptions}
        onChange={(event) => update('status', event.target.value as PropertyFormValues['status'])}
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
          {PROPERTY_AMENITIES.map((amenity) => (
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

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Save Property' : 'Update Property'}
        </Button>
      </div>
    </form>
  );
}
