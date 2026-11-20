import { ROOM_IMAGE_MAX_BYTES, ROOM_IMAGE_TYPES } from '@/utils/roomImages';

export function validateTenantProfileImage(file: File): string | null {
  if (!ROOM_IMAGE_TYPES.includes(file.type as (typeof ROOM_IMAGE_TYPES)[number])) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png' && extension !== 'webp') {
      return 'Use a JPG, PNG, or WEBP image.';
    }
  }
  if (file.size > ROOM_IMAGE_MAX_BYTES) {
    return 'Keep the profile image under 5 MB.';
  }
  return null;
}

export function createTenantProfilePreview(file: File): string {
  return URL.createObjectURL(file);
}

export function revokeTenantProfilePreview(url: string | undefined): void {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
