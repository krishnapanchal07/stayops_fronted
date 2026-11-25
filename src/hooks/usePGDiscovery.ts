import { useCallback } from 'react';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { workflowRequest } from '@/services/http/workflows';
import { imageUrl } from '@/services/property/propertyService';
import { aggregatePublicPGs } from '@/utils/pgDiscovery';
import { toAvailableListings } from '@/utils/roomListing';
import type { Property } from '@/types/property';
import type { Room } from '@/types/room';
interface Result {properties:Property[];rooms:Room[];counts:Record<string,{availableBedCount:number;availableRoomCount:number;startingRent:number}>;total:number}
export function usePGDiscovery(params:string) {
  const loader=useCallback(async()=>{
    const [result,options]=await Promise.all([workflowRequest<Result>('get',`/public/discovery?${params}`),workflowRequest<{cities:string[];localities:string[]}>('get','/public/discovery/options')]);
    const rooms=result.rooms.map(r=>({...r,images:r.images.map(i=>({...i,url:imageUrl(i.url)}))}));
    return {items:aggregatePublicPGs(result.properties,toAvailableListings(rooms)).map(pg=>({...pg,...result.counts[pg.id]})),total:result.total,options};
  },[params]);
  return useAsyncResource(loader);
}
