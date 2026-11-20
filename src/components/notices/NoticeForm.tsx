import { DateInput } from '@/components/forms/DateInput';
import { Select } from '@/components/forms/Select';
import { TextInput } from '@/components/forms/TextInput';
import { Textarea } from '@/components/forms/Textarea';
import {
  NOTICE_AUDIENCE_LABELS,
  NOTICE_CATEGORY_LABELS,
  NOTICE_PRIORITY_LABELS,
  NoticeAudience,
  NoticeCategory,
  NoticePriority,
  type NoticeFormValues,
} from '@/types/notice';
import type { NoticeFormErrors } from '@/utils/noticeValidation';
import type { PropertyListItem } from '@/types/property';
import type { RoomListItem } from '@/types/room';

interface NoticeFormProps {
  values: NoticeFormValues;
  errors: NoticeFormErrors;
  properties: PropertyListItem[];
  rooms: RoomListItem[];
  onChange: (values: NoticeFormValues) => void;
}

export function NoticeForm({ values, errors, properties, rooms, onChange }: NoticeFormProps) {
  const property = properties.find((item) => item.id === values.propertyId);
  const buildings = property?.buildings ?? [];
  const scopedRooms = rooms.filter((room) => room.propertyId === values.propertyId);

  const update = <K extends keyof NoticeFormValues>(key: K, value: NoticeFormValues[K]) => {
    const next = { ...values, [key]: value };
    if (key === 'propertyId') {
      next.buildingId = '';
      next.roomId = '';
    }
    if (key === 'audience' && value !== NoticeAudience.BUILDING && value !== NoticeAudience.ROOM) {
      next.buildingId = '';
      next.roomId = '';
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <TextInput
        label="Title"
        name="title"
        value={values.title}
        error={errors.title}
        required
        onChange={(event) => update('title', event.target.value)}
      />
      <Textarea
        label="Description"
        name="description"
        value={values.description}
        error={errors.description}
        required
        onChange={(event) => update('description', event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Category"
          name="category"
          value={values.category}
          error={errors.category}
          required
          options={Object.values(NoticeCategory).map((value) => ({ value, label: NOTICE_CATEGORY_LABELS[value] }))}
          onChange={(event) => update('category', event.target.value as NoticeFormValues['category'])}
        />
        <Select
          label="Priority"
          name="priority"
          value={values.priority}
          error={errors.priority}
          required
          options={Object.values(NoticePriority).map((value) => ({ value, label: NOTICE_PRIORITY_LABELS[value] }))}
          onChange={(event) => update('priority', event.target.value as NoticeFormValues['priority'])}
        />
        <Select
          label="Target audience"
          name="audience"
          value={values.audience}
          error={errors.audience}
          required
          options={Object.values(NoticeAudience).map((value) => ({ value, label: NOTICE_AUDIENCE_LABELS[value] }))}
          onChange={(event) => update('audience', event.target.value as NoticeFormValues['audience'])}
        />
        <Select
          label="Property"
          name="propertyId"
          value={values.propertyId}
          error={errors.propertyId}
          required
          options={properties.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(event) => update('propertyId', event.target.value)}
        />
        {values.audience === NoticeAudience.BUILDING || values.audience === NoticeAudience.ROOM ? (
          <Select
            label="Building"
            name="buildingId"
            value={values.buildingId}
            error={errors.buildingId}
            options={buildings.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(event) => update('buildingId', event.target.value)}
          />
        ) : null}
        {values.audience === NoticeAudience.ROOM ? (
          <Select
            label="Room"
            name="roomId"
            value={values.roomId}
            error={errors.roomId}
            options={scopedRooms.map((item) => ({ value: item.id, label: item.roomNumber }))}
            onChange={(event) => update('roomId', event.target.value)}
          />
        ) : null}
        <DateInput
          label="Publish date"
          name="publishDate"
          value={values.publishDate}
          onChange={(event) => update('publishDate', event.target.value)}
        />
        <DateInput
          label="Expiry date"
          name="expiryDate"
          value={values.expiryDate}
          error={errors.expiryDate}
          onChange={(event) => update('expiryDate', event.target.value)}
        />
      </div>
      <TextInput
        label="Attachment name"
        name="attachmentName"
        value={values.attachmentName}
        helperText="Optional mock filename. Files are not uploaded in Phase 2."
        onChange={(event) => update('attachmentName', event.target.value)}
      />
    </div>
  );
}
