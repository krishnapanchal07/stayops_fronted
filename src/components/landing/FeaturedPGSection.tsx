import { useAsyncResource } from '@/hooks/useAsyncResource';
import { roomService } from '@/services/room/roomService';
import { propertyService } from '@/services/property/propertyService';
import { emptyFindRoomFilters } from '@/utils/roomListing';
import { primaryRoomImage } from '@/utils/roomImages';
import { formatINR } from '@/utils/format';
import { SHARING_TYPE_LABELS } from '@/types/room';
import { PATHS, publicFindRoomDetailPath } from '@/routes/paths';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RoomScene } from './RoomScene';

async function loadFeatured() {
  const [listings, properties] = await Promise.all([
    roomService.listAvailableListings(emptyFindRoomFilters()),
    propertyService.getProperties(),
  ]);
  const seen = new Set<string>();
  return listings
    .filter((listing) => {
      if (seen.has(listing.propertyId)) return false;
      seen.add(listing.propertyId);
      return true;
    })
    .slice(0, 3)
    .map((listing) => ({
      ...listing,
      city: properties.find((property) => property.id === listing.propertyId)?.city,
    }));
}
export function FeaturedPGSection() {
  const { data, status, reload } = useAsyncResource(loadFeatured);
  return (
    <section className="so-section so-wrap" id="featured" aria-labelledby="featured-title">
      <div className="so-section-top">
        <div>
          <p className="so-eyebrow">FIND YOUR KIND OF SPACE</p>
          <h2 id="featured-title">
            A few places to <em>start.</em>
          </h2>
        </div>
        <Link className="so-text-link" to={PATHS.findRoom}>
          Explore all rooms <ArrowUpRight size={18} />
        </Link>
      </div>
      <p className="so-section-intro">
        An available bed from each featured property. Explore the details and send an inquiry.
      </p>
      {status === 'loading' && (
        <div className="so-listing-grid" role="status" aria-label="Loading featured rooms">
          {[1, 2, 3].map((id) => (
            <div className="so-listing-skeleton" key={id} />
          ))}
        </div>
      )}
      {status === 'error' && (
        <div className="so-load-state" role="status">
          Featured rooms could not be loaded.{' '}
          <button className="so-text-link" onClick={reload}>
            Try again
          </button>
        </div>
      )}
      {status === 'success' && !data?.length && (
        <p className="so-load-state">No available beds at the moment. Please check again soon.</p>
      )}
      <div className="so-listing-grid">
        {data?.map((listing, index) => {
          const image = primaryRoomImage(listing.images);
          return (
            <article className="so-listing" key={listing.id}>
              <div className="so-listing-image">
                {image?.url ? (
                  <img
                    src={image.url}
                    alt={image.alt || `Room ${listing.roomNumber}`}
                    loading="lazy"
                    width="800"
                    height="600"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : null}
                <div className="so-listing-fallback">
                  <RoomScene variant={index === 1 ? 'study' : index === 2 ? 'lounge' : 'room'} />
                </div>
                <span className="so-available">
                  <span className="so-dot" /> Available bed
                </span>
                <span className="so-illustration-label">Illustration · room photo unavailable</span>
              </div>
              <div className="so-listing-body">
                <p className="so-listing-location">
                  <MapPin size={14} />
                  {listing.city || listing.propertyName}
                </p>
                <h3>{listing.propertyName}</h3>
                <p>
                  Room {listing.title} · {SHARING_TYPE_LABELS[listing.sharingType]}
                </p>
                <div className="so-tags">
                  {listing.amenities.slice(0, 3).map((amenity) => (
                    <span key={amenity}>{amenity}</span>
                  ))}
                </div>
                <div className="so-listing-bottom">
                  <p>
                    <strong>{formatINR(listing.monthlyRent)}</strong>
                    <span> / month per bed</span>
                  </p>
                  <Link
                    to={publicFindRoomDetailPath(listing.roomId, listing.bedId)}
                    aria-label={`View details for ${listing.propertyName}, room ${listing.title}`}
                  >
                    View Details <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
