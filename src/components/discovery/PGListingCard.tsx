import { memo } from 'react';
import type { PublicPG } from '@/types/discovery';
import { PROPERTY_TYPE_LABELS } from '@/types/property';
import { publicPropertyDetailPath } from '@/routes/paths';
import { formatINR } from '@/utils/format';
import { ArrowUpRight, BedDouble, DoorOpen, MapPin, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DiscoveryImage } from './DiscoveryImage';

interface Props {
  property: PublicPG;
  highlighted: boolean;
  onHighlight: (id: string | null) => void;
}
export const PGListingCard = memo(function PGListingCard({
  property: pg,
  highlighted,
  onHighlight,
}: Props) {
  return (
    <article
      id={`pg-card-${pg.id}`}
      className={`group overflow-hidden rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-200 ${highlighted ? 'border-primary shadow-lg shadow-primary/10' : 'border-border shadow-sm hover:border-primary/50'}`}
      onMouseEnter={() => onHighlight(pg.id)}
      onMouseLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) onHighlight(null);
      }}
      onFocus={() => onHighlight(pg.id)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onHighlight(null);
      }}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative shrink-0 sm:w-54 xl:w-60">
          <DiscoveryImage image={pg.image} name={pg.name} className="h-48 sm:h-full sm:min-h-60" />
          <span className="absolute top-3 left-3 rounded-md bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm">
            {PROPERTY_TYPE_LABELS[pg.type]}
          </span>
        </div>
        <div className="min-w-0 flex-1 p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700">
              <Check size={12} /> Beds available
            </span>
            <span className="text-[10px] text-text-secondary">
              {pg.location ? 'Approximate map location' : 'Map location unavailable'}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            <Link to={publicPropertyDetailPath(pg.id)} className="hover:text-primary">
              {pg.name}
            </Link>
          </h2>
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-text-secondary">
            <MapPin size={13} className="mt-0.5" />
            {pg.address}, {pg.city}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pg.amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="rounded-md bg-background px-2 py-1 text-[10px] text-text-secondary"
              >
                {amenity}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen size={14} />
              {pg.availableRoomCount} matching rooms
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BedDouble size={14} />
              {pg.availableBedCount} available beds
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
            <div>
              <span className="text-[10px] text-text-secondary">Starting from</span>
              <p>
                <strong className="text-xl font-bold text-primary">
                  {formatINR(pg.startingRent)}
                </strong>
                <span className="text-[10px] text-text-secondary"> / bed / month</span>
              </p>
            </div>
            <Link
              to={publicPropertyDetailPath(pg.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              View Details <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
});
