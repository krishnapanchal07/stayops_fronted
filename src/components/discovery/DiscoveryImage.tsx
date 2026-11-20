import type { RoomImage } from '@/types/room';
import { Building2 } from 'lucide-react';
import { useState } from 'react';

export function DiscoveryImage({
  image,
  name,
  className = '',
}: {
  image?: RoomImage;
  name: string;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return (
    <div className={`relative overflow-hidden bg-primary-soft ${className}`}>
      {image?.url && image.url !== failedUrl ? (
        <img
          src={image.url}
          alt={image.alt || name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(image.url)}
        />
      ) : (
        <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 bg-linear-to-br from-primary-soft via-white to-primary-muted/35 px-5 py-8 text-center text-primary">
          <Building2 size={52} strokeWidth={1} />
          <span className="text-xs font-semibold tracking-wide">{name}</span>
          <span className="text-[10px] text-text-secondary">Room photos unavailable</span>
        </div>
      )}
    </div>
  );
}
