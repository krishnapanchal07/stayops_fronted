import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useToast } from '@/hooks/useToast';
import type { RoomImage } from '@/types/room';
import { cn } from '@/utils/cn';
import {
  addRoomImages,
  moveRoomImage,
  removeRoomImage,
  setPrimaryRoomImage,
  sortRoomImages,
} from '@/utils/roomImages';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react';
import { useRef } from 'react';

interface RoomImageManagerProps {
  images: RoomImage[];
  onChange: (images: RoomImage[]) => void;
  disabled?: boolean;
}

const toneClass: Record<NonNullable<RoomImage['tone']>, string> = {
  primary: 'from-primary to-primary-dark',
  info: 'from-sky-400 to-indigo-500',
  success: 'from-emerald-400 to-teal-600',
  warning: 'from-amber-400 to-orange-500',
};

export function RoomImageManager({ images, onChange, disabled = false }: RoomImageManagerProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const ordered = sortRoomImages(images);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const result = addRoomImages(images, fileList);
    if (result.errors.length > 0) {
      toast('error', 'Some images could not be added.', result.errors.join(' '));
    }
    if (result.added > 0) {
      onChange(result.images);
      toast(
        'success',
        result.added === 1 ? 'Image added.' : `${result.added} images added.`,
      );
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <fieldset className="min-w-0">
      <legend className="typo-label mb-3">Room Images</legend>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="typo-helper">JPG, PNG, or WEBP. Up to 5 MB each. Images are optional.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={<ImagePlus className="h-4 w-4" />}
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          Add Images
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple
          className="sr-only"
          aria-label="Add room images"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {ordered.length === 0 ? (
        <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-border bg-background text-sm text-muted">
          No images selected yet.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ordered.map((image, index) => (
            <li key={image.id} className="min-w-0 rounded-2xl border border-border bg-background p-3">
              <ImagePreview image={image} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text">
                    {image.label ?? image.alt ?? `Image ${index + 1}`}
                  </p>
                  {image.isPrimary ? <Badge variant="primary">Primary</Badge> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label="Move earlier"
                    size="sm"
                    onClick={() => onChange(moveRoomImage(images, image.id, -1))}
                    disabled={disabled || index === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Move later"
                    size="sm"
                    onClick={() => onChange(moveRoomImage(images, image.id, 1))}
                    disabled={disabled || index === ordered.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!image.isPrimary ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onChange(setPrimaryRoomImage(images, image.id))}
                    disabled={disabled}
                  >
                    Set Primary
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => onChange(removeRoomImage(images, image.id))}
                  disabled={disabled}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

function ImagePreview({ image }: { image: RoomImage }) {
  if (image.url) {
    return (
      <img
        src={image.url}
        alt={image.alt ?? image.label ?? 'Room image'}
        className="h-32 w-full rounded-xl object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-32 items-end rounded-xl bg-linear-to-br p-3 text-sm font-medium text-white',
        toneClass[image.tone ?? 'primary'],
      )}
    >
      {image.label ?? 'Room view'}
    </div>
  );
}
