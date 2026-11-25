import { Modal } from '@/components/ui/Modal';
import type { RoomImage } from '@/types/room';
import { cn } from '@/utils/cn';
import { primaryRoomImage, sortRoomImages } from '@/utils/roomImages';
import { useState } from 'react';

const toneClass: Record<NonNullable<RoomImage['tone']>, string> = {
  primary: 'from-primary to-primary-dark',
  info: 'from-sky-400 to-indigo-500',
  success: 'from-emerald-400 to-teal-600',
  warning: 'from-amber-400 to-orange-500',
};

interface RoomGalleryProps {
  images: RoomImage[];
  roomNumber: string;
}

export function RoomGallery({ images, roomNumber }: RoomGalleryProps) {
  const ordered = sortRoomImages(images);
  const fallback = primaryRoomImage(ordered);
  const [activeId, setActiveId] = useState(fallback?.id ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const active = ordered.find((image) => image.id === activeId) ?? fallback;

  if (!active) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-center sm:h-80">
        <p className="font-medium text-text">No room images yet</p>
        <p className="typo-secondary mt-1 max-w-xs">
          Photos added from Edit Room will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="relative overflow-hidden rounded-2xl">
        {active.url ? (
          <button type="button" className="block w-full" onClick={() => setPreviewOpen(true)}>
            <img
              src={active.url}
              srcSet={active.srcSet} sizes="(max-width: 640px) 100vw, 60vw" loading="lazy"
              alt={active.alt ?? active.label ?? `Room ${roomNumber}`}
              className="h-64 w-full object-cover sm:h-80"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className={cn(
              'flex h-64 w-full items-end bg-linear-to-br p-5 text-left text-white sm:h-80',
              toneClass[active.tone ?? 'primary'],
            )}
          >
            <div>
              <p className="text-sm/6 opacity-80">Room {roomNumber}</p>
              <p className="text-lg font-semibold">{active.label ?? 'Room view'}</p>
            </div>
          </button>
        )}
        <span className="absolute top-4 right-4 rounded-full bg-sidebar/60 px-3 py-1 text-xs font-medium text-white">
          {ordered.length} {ordered.length === 1 ? 'image' : 'images'}
        </span>
        {active.isPrimary ? (
          <span className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
            Primary
          </span>
        ) : null}
      </div>
      {ordered.length > 1 ? (
        <ul className="mt-3 grid grid-cols-4 gap-2">
          {ordered.map((image) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setActiveId(image.id)}
                className={cn(
                  'h-16 w-full overflow-hidden rounded-xl',
                  image.id === active.id ? 'ring-2 ring-primary ring-offset-2' : 'opacity-80',
                )}
                aria-label={`Show ${image.alt ?? image.label ?? 'room image'}`}
              >
                {image.url ? (
                  <img
                    src={image.thumbnail ?? image.url} loading="lazy"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className={cn('block h-full w-full bg-linear-to-br', toneClass[image.tone ?? 'primary'])}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Modal open={previewOpen} title={active.label ?? `Room ${roomNumber}`} onClose={() => setPreviewOpen(false)}>
        {active.url ? (
          <img
            src={active.large ?? active.url}
            loading="lazy"
            alt={active.alt ?? active.label ?? `Room ${roomNumber}`}
            className="max-h-[70vh] w-full rounded-xl object-contain"
          />
        ) : (
          <div className={cn('flex h-64 items-end rounded-xl bg-linear-to-br p-5 text-white', toneClass[active.tone ?? 'primary'])}>
            <p className="text-lg font-semibold">{active.label ?? 'Room view'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
