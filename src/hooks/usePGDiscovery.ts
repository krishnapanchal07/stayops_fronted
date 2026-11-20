import { useAsyncResource } from '@/hooks/useAsyncResource';
import { propertyService } from '@/services/property/propertyService';
import { roomService } from '@/services/room/roomService';
import { aggregatePublicPGs } from '@/utils/pgDiscovery';
import { emptyFindRoomFilters } from '@/utils/roomListing';

async function loadDiscovery() {
  const [properties, beds] = await Promise.all([
    propertyService.getProperties(),
    roomService.listAvailableListings(emptyFindRoomFilters()),
  ]);
  return aggregatePublicPGs(properties, beds);
}

export function usePGDiscovery() {
  return useAsyncResource(loadDiscovery);
}
