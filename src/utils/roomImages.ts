import type { RoomImage } from '@/types/room';

export const ROOM_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const ROOM_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const PLACEHOLDER_TONES = ['primary', 'info', 'success', 'warning'] as const;

function createImageId(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function fileKey(file: File): string {
  return `${file.name.trim().toLowerCase()}:${file.size}`;
}

function imageKey(image: RoomImage): string {
  return `${(image.alt ?? image.label ?? '').trim().toLowerCase()}`;
}

export function sortRoomImages(images: RoomImage[]): RoomImage[] {
  return [...images].sort((left, right) => left.sortOrder - right.sortOrder);
}

export function reindexRoomImages(images: RoomImage[]): RoomImage[] {
  return sortRoomImages(images).map((image, index) => ({ ...image, sortOrder: index }));
}

export function ensureSinglePrimary(images: RoomImage[]): RoomImage[] {
  const ordered = reindexRoomImages(images);
  if (ordered.length === 0) return ordered;

  const primaryIndex = ordered.findIndex((image) => image.isPrimary);
  const chosen = primaryIndex >= 0 ? primaryIndex : 0;

  return ordered.map((image, index) => ({ ...image, isPrimary: index === chosen }));
}

type RoomImageInput = Partial<RoomImage> & Pick<Partial<RoomImage>, 'id'>;

export function normalizeRoomImages(images: RoomImageInput[] | undefined): RoomImage[] {
  return ensureSinglePrimary(
    (images ?? []).map((image, index) => ({
      ...image,
      id: image.id || createImageId(),
      url: image.url ?? '',
      alt: image.alt ?? image.label ?? `Room image ${index + 1}`,
      label: image.label ?? image.alt ?? `Image ${index + 1}`,
      tone: image.tone ?? PLACEHOLDER_TONES[index % PLACEHOLDER_TONES.length],
      isPrimary: image.isPrimary ?? index === 0,
      sortOrder: image.sortOrder ?? index,
    })),
  );
}

function isSupportedImageType(file: File): boolean {
  return ROOM_IMAGE_TYPES.includes(file.type as (typeof ROOM_IMAGE_TYPES)[number]) && /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function validateRoomImageFile(file: File, existing: RoomImage[]): string | null {
  if (!file.size) return 'Empty image file.';
  if (existing.length >= 12) return 'Maximum 12 images per room.';
  if (!isSupportedImageType(file)) {
    return 'Use a JPG, PNG, or WEBP image.';
  }
  if (file.size >= ROOM_IMAGE_MAX_BYTES) {
    return 'Each image must be less than 4 MiB.';
  }
  if (existing.some((image) => imageKey(image) === file.name.trim().toLowerCase())) {
    return 'This image is already added.';
  }
  return null;
}

export function createRoomImageFromFile(file: File, sortOrder: number, isPrimary: boolean): RoomImage {
  return {
    id: createImageId(),
    file,
    url: URL.createObjectURL(file),
    alt: file.name,
    label: file.name.replace(/\.[^.]+$/, ''),
    tone: PLACEHOLDER_TONES[sortOrder % PLACEHOLDER_TONES.length],
    isPrimary,
    sortOrder,
  };
}

export function addRoomImages(
  current: RoomImage[],
  files: FileList | File[],
): { images: RoomImage[]; errors: string[]; added: number } {
  const errors: string[] = [];
  const next = [...sortRoomImages(current)];
  const seen = new Set(Array.from(files).map(fileKey));

  if (seen.size < Array.from(files).length) {
    errors.push('Duplicate files were skipped from this selection.');
  }

  const uniqueFiles = Array.from(files).filter((file, index, list) => {
    return list.findIndex((item) => fileKey(item) === fileKey(file)) === index;
  });

  for (const file of uniqueFiles) {
    const error = validateRoomImageFile(file, next);
    if (error) {
      errors.push(`${file.name}: ${error}`);
      continue;
    }
    next.push(createRoomImageFromFile(file, next.length, next.length === 0));
  }

  return {
    images: ensureSinglePrimary(next),
    errors,
    added: next.length - current.length,
  };
}

export function removeRoomImage(images: RoomImage[], imageId: string): RoomImage[] {
  const remaining = images.filter((image) => image.id !== imageId);
  const removed = images.find((image) => image.id === imageId);
  if (removed?.url.startsWith('blob:')) {
    URL.revokeObjectURL(removed.url);
  }
  return ensureSinglePrimary(remaining);
}

export function setPrimaryRoomImage(images: RoomImage[], imageId: string): RoomImage[] {
  return ensureSinglePrimary(images.map((image) => ({ ...image, isPrimary: image.id === imageId })));
}

export function moveRoomImage(images: RoomImage[], imageId: string, direction: -1 | 1): RoomImage[] {
  const ordered = sortRoomImages(images);
  const index = ordered.findIndex((image) => image.id === imageId);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) {
    return ordered;
  }

  const swapped = [...ordered];
  const current = swapped[index];
  const neighbor = swapped[nextIndex];
  if (!current || !neighbor) return ordered;
  swapped[index] = neighbor;
  swapped[nextIndex] = current;
  return ensureSinglePrimary(swapped.map((image, next) => ({ ...image, sortOrder: next })));
}

export function primaryRoomImage(images: RoomImage[]): RoomImage | undefined {
  const ordered = sortRoomImages(normalizeRoomImages(images));
  return ordered.find((image) => image.isPrimary) ?? ordered[0];
}
