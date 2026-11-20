import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/Button';
import type { AvailableBedListing } from '@/types/inquiry';
import { SHARING_TYPE_LABELS } from '@/types/room';
import { formatINR } from '@/utils/format';
import { primaryRoomImage } from '@/utils/roomImages';
import { cn } from '@/utils/cn';

const toneClass = {
  primary: 'from-primary to-primary-dark',
  info: 'from-sky-400 to-indigo-500',
  success: 'from-emerald-400 to-teal-600',
  warning: 'from-amber-400 to-orange-500',
} as const;

interface RoomListingCardProps {
  listing: AvailableBedListing;
  onView: () => void;
}

export function RoomListingCard({ listing, onView }: RoomListingCardProps) {
  const image = primaryRoomImage(listing.images);
  const tags = listing.amenities.slice(0, 3);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center">
      <div className="h-36 w-full overflow-hidden rounded-xl sm:h-28 sm:w-40">
        {image?.url ? (
          <img src={image.url} alt={image.alt ?? listing.title} className="h-full w-full object-cover" />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-end bg-linear-to-br p-3 text-white',
              toneClass[image?.tone ?? 'primary'],
            )}
          >
            <p className="text-sm font-semibold">{listing.title}</p>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-text">{listing.title}</h3>
        <p className="typo-secondary mt-0.5">{listing.propertyName}</p>
        <p className="mt-1 text-sm text-text-secondary">{SHARING_TYPE_LABELS[listing.sharingType]}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((amenity) => (
            <Badge key={amenity} variant="info">
              {amenity}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <p className="text-lg font-semibold text-text">{formatINR(listing.monthlyRent)} /month</p>
        <Badge variant="success">Available</Badge>
        <Button onClick={onView}>View Details</Button>
      </div>
    </article>
  );
}
