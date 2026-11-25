import { ImageSelection } from './PropertyGallery';
import { propertyService } from '@/services/property/propertyService';
import { useAsyncResource } from '@/hooks/useAsyncResource';
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
import { useRef, useState, type FormEvent } from 'react';

interface PropertyFormProps {
  mode: 'create' | 'edit';
  initialValues?: PropertyFormValues;
  submitting?: boolean;
  onSubmit: (values: PropertyFormValues, files: File[]) => Promise<void>;
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
  const [files, setFiles] = useState<File[]>([]);
  const lock = useRef(false);
  const { data: owners } = useAsyncResource(propertyService.getOwners);
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

    if (lock.current || submitting) return;
    lock.current = true;
    try { await onSubmit(normalizedPropertyForm(values), files); } finally { lock.current = false; }
  };

  return (
    <form className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={submitting} className="contents">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Property Name"
          name="name"
          maxLength={80}
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
          maxLength={160}
        value={values.address}
        onChange={(event) => update('address', event.target.value)}
        error={errors.address}
        required
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput
          label="City"
          name="city"
          maxLength={100}
          value={values.city}
          onChange={(event) => update('city', event.target.value)}
          error={errors.city}
          required
        />
        <TextInput
          label="State"
          name="state"
          maxLength={100}
          value={values.state}
          onChange={(event) => update('state', event.target.value)}
          error={errors.state}
          required
        />
        <TextInput
          label="Postal Code"
          name="postalCode"
          maxLength={6}
          value={values.postalCode}
          onChange={(event) => update('postalCode', event.target.value)}
          error={errors.postalCode}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Contact Number"
          name="contactNumber"
          maxLength={10}
          type="tel"
          value={values.contactNumber}
          onChange={(event) => update('contactNumber', event.target.value)}
          error={errors.contactNumber}
        />
        <TextInput
          label="Email"
          name="email"
          maxLength={320}
          type="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
          error={errors.email}
        />
      </div>

      <Select label="Owner" name="ownerUserId" value={values.ownerUserId ?? ''} options={[{label:'Unassigned (Super Admin managed)',value:''},...(owners ?? []).map(o => ({label:o.name,value:o.id}))]} onChange={event => update('ownerUserId',event.target.value || null)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Latitude (optional)" name="latitude" error={errors.latitude} type="number" step="any" value={values.latitude ?? ''} onChange={event => update('latitude',event.target.value === '' ? null : Number(event.target.value))} />
        <TextInput label="Longitude (optional)" name="longitude" error={errors.longitude} type="number" step="any" value={values.longitude ?? ''} onChange={event => update('longitude',event.target.value === '' ? null : Number(event.target.value))} />
      </div>
      <p className="typo-helper">Use verified coordinates only. Leave blank if the location is unknown.</p>
      <Checkbox label="Publish in public discovery" name="isPublic" checked={values.isPublic ?? false} onChange={event => update('isPublic',event.target.checked)} />
      <Checkbox label="Development DEMO property (not a real listing)" name="isDemo" checked={values.isDemo ?? false} disabled={Boolean(initialValues?.isDemo)} onChange={event => update('isDemo',event.target.checked)} />
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

      {mode === 'create' && <ImageSelection files={files} onChange={setFiles} disabled={submitting} />}
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
