import { NoticeAudience, NoticeCategory, NoticePriority, type Notice, type NoticeFormValues } from '@/types/notice';

export type NoticeFormErrors = Partial<Record<keyof NoticeFormValues, string>>;

export function emptyNoticeForm(): NoticeFormValues {
  return {
    title: '',
    description: '',
    category: '',
    priority: NoticePriority.NORMAL,
    audience: NoticeAudience.PROPERTY,
    propertyId: '',
    buildingId: '',
    roomId: '',
    publishDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    attachmentName: '',
    attachmentUrl: '',
  };
}

export function toNoticeForm(notice: Notice): NoticeFormValues {
  return {
    title: notice.title,
    description: notice.description,
    category: notice.category,
    priority: notice.priority,
    audience: notice.audience,
    propertyId: notice.propertyId,
    buildingId: notice.buildingId ?? '',
    roomId: notice.roomId ?? '',
    publishDate: notice.publishDate,
    expiryDate: notice.expiryDate ?? '',
    attachmentName: notice.attachmentName ?? '',
    attachmentUrl: notice.attachmentUrl ?? '',
  };
}

export function validateNoticeForm(values: NoticeFormValues): NoticeFormErrors {
  const errors: NoticeFormErrors = {};
  if (!values.title.trim()) errors.title = 'Title is required.';
  if (!values.description.trim()) errors.description = 'Description is required.';
  if (!values.category || !(values.category in NoticeCategory)) errors.category = 'Select a category.';
  if (!values.priority || !(values.priority in NoticePriority)) errors.priority = 'Select a priority.';
  if (!values.audience || !(values.audience in NoticeAudience)) errors.audience = 'Select a target audience.';
  if (!values.propertyId) errors.propertyId = 'Select a property.';
  if (values.audience === NoticeAudience.BUILDING && !values.buildingId) {
    errors.buildingId = 'Select a building for building-targeted notices.';
  }
  if (values.audience === NoticeAudience.ROOM && !values.roomId) {
    errors.roomId = 'Select a room for room-targeted notices.';
  }
  if (values.expiryDate && values.publishDate && values.expiryDate < values.publishDate) {
    errors.expiryDate = 'Expiry date must be on or after the publish date.';
  }
  return errors;
}
