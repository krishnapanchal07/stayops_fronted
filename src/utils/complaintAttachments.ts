import type { ComplaintAttachment } from '@/types/complaint';

export const COMPLAINT_FILE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function createAttachmentId(): string {
  return `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isPreviewableImage(fileType: string): boolean {
  return IMAGE_TYPES.includes(fileType) || fileType.startsWith('image/');
}

export function createComplaintAttachment(file: File, uploadedBy: string): ComplaintAttachment {
  return {
    id: createAttachmentId(),
    complaintId: '',
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    previewUrl: URL.createObjectURL(file),
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
}

export function validateComplaintFile(file: File, existing: ComplaintAttachment[]): string | null {
  if (file.size > COMPLAINT_FILE_MAX_BYTES) return 'Keep each file under 5 MB.';
  if (existing.some((item) => item.fileName === file.name && item.fileSize === file.size)) {
    return 'This file is already added.';
  }
  return null;
}

export function addComplaintAttachments(
  current: ComplaintAttachment[],
  files: FileList | File[],
  uploadedBy: string,
): { attachments: ComplaintAttachment[]; errors: string[] } {
  const errors: string[] = [];
  const next = [...current];
  for (const file of Array.from(files)) {
    const error = validateComplaintFile(file, next);
    if (error) {
      errors.push(`${file.name}: ${error}`);
      continue;
    }
    next.push(createComplaintAttachment(file, uploadedBy));
  }
  return { attachments: next, errors };
}

export function removeComplaintAttachment(attachments: ComplaintAttachment[], id: string): ComplaintAttachment[] {
  const removed = attachments.find((item) => item.id === id);
  if (removed?.previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(removed.previewUrl);
  }
  return attachments.filter((item) => item.id !== id);
}
