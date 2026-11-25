import { workflowRequest, workflowList } from '@/services/http/workflows';
import { httpClient } from '@/services/http/client';
import { imageUrl } from '@/services/property/propertyService';
import type { AssignBedInput, Bed, Room, RoomFilters, RoomFormValues, RoomImage, RoomListItem, RoomSummary, TenantReference } from '@/types/room';
import type { AvailableBedListing, FindRoomFilters } from '@/types/inquiry';
import { toAvailableListings } from '@/utils/roomListing';
import { calculateRoomOccupancy } from '@/utils/roomStats';

type Page = {items:RoomListItem[];total:number;offset:number;limit:number};
function normalize(room:RoomListItem):RoomListItem {
  return {...room,images:room.images.map(i=>({...i,url:imageUrl(i.url),thumbnail:i.thumbnail?imageUrl(i.thumbnail):undefined,medium:i.medium?imageUrl(i.medium):undefined,large:i.large?imageUrl(i.large):undefined,srcSet:i.thumbnail&&i.medium&&i.large?`${imageUrl(i.thumbnail)} 400w, ${imageUrl(i.medium)} 900w, ${imageUrl(i.large)} 1600w`:undefined}))};
}
async function list(url:string) { return (await workflowList<RoomListItem>(url)).map(normalize); }
async function one(method:'get'|'post'|'patch',url:string,data?:unknown) { return normalize(await workflowRequest<RoomListItem>(method,url,data)); }
function payload(values:RoomFormValues) {
  const {images,...fields}=values; void images;
  return {...fields,status:['MAINTENANCE','BLOCKED'].includes(fields.status)?fields.status:'AVAILABLE'};
}
async function syncImages(room:RoomListItem, selected:RoomImage[]) {
  for (const image of room.images) {
    if (!selected.some(i=>i.id===image.id)) await httpClient.delete(`/rooms/${room.id}/images/${image.id}`);
  }
  const files=selected.flatMap(i=>i.file?[i.file]:[]);
  if (files.length) {
    const data=new FormData(); files.forEach(file=>data.append('files',file));
    await httpClient.post(`/rooms/${room.id}/images`,data,{headers:{'Content-Type':undefined},timeout:120000});
  }
  const fresh=await one('get',`/rooms/${room.id}`);
  const ordered=selected.map(i=>fresh.images.find(f=>f.id===i.id || (i.file && f.filename===i.file.name))).filter((i):i is RoomImage=>Boolean(i));
  const ids=[...new Set(ordered.map(i=>i.id))];
  for (const i of fresh.images) if(!ids.includes(i.id)) ids.push(i.id);
  if(ids.length) {
    await workflowRequest('patch',`/rooms/${room.id}/images/order`,{imageIds:ids});
    const primary=selected.find(i=>i.isPrimary);
    const match=fresh.images.find(i=>i.id===primary?.id || (primary?.file && i.filename===primary.file.name));
    if(match) await workflowRequest('patch',`/rooms/${room.id}/cover-image`,{imageId:match.id});
  }
  return one('get',`/rooms/${room.id}`);
}
export const roomService={
  getRooms:()=>list('/rooms'),
  getRoomById:(id:string)=>one('get',`/rooms/${encodeURIComponent(id)}`),
  getPublicRoomById:(id:string)=>one('get',`/public/rooms/${encodeURIComponent(id)}`),
  getRoomsByProperty:(id:string)=>list(`/rooms?propertyId=${encodeURIComponent(id)}`),
  getRoomsByBuilding:(id:string)=>list(`/rooms?buildingId=${encodeURIComponent(id)}`),
  getRoomsByFloor:(id:string)=>list(`/rooms?floorId=${encodeURIComponent(id)}`),
  searchRooms:(filters:RoomFilters)=>list(`/rooms?${new URLSearchParams({...filters})}`),
  async getPage(params:URLSearchParams):Promise<Page> {const p=await workflowRequest<Page>('get',`/rooms?${params}`);return {...p,items:p.items.map(normalize)};},
  async getPublicPage(propertyId:string,page:number) {const p=await workflowRequest<Page>('get',`/public/rooms?${new URLSearchParams({propertyId,limit:'6',offset:String((page-1)*6)})}`);return {...p,items:p.items.map(normalize)};},
  async getAvailablePage(filters:FindRoomFilters,page=1,limit=8) {
    const result=await workflowRequest<Page>('get',`/public/available-beds?${new URLSearchParams({...filters,limit:String(limit),offset:String((page-1)*limit)})}`);
    return {items:toAvailableListings(result.items.map(normalize)),total:result.total};
  },
  async listAvailableListings(filters:FindRoomFilters):Promise<AvailableBedListing[]> {
    return (await roomService.getAvailablePage(filters,1,12)).items;
  },
  getRoomSummary:()=>workflowRequest<RoomSummary>('get','/rooms/summary'),
  getAssignableTenants:()=>workflowRequest<TenantReference[]>('get','/rooms/assignable-tenants'),
  getTenantReferences:()=>workflowRequest<TenantReference[]>('get','/rooms/assignable-tenants'),
  async createRoom(values:RoomFormValues) {
    const room=await one('post','/rooms',payload(values));
    try {return await syncImages(room,values.images);} catch {throw new Error(`Room ${room.roomNumber} was saved, but image upload failed. Open its details to retry images; do not create it again.`);}
  },
  async updateRoom(id:string,values:RoomFormValues) {const room=await one('patch',`/rooms/${id}`,payload(values));return syncImages(room,values.images);},
  changeRoomStatus:(id:string,status:Room['status'])=>one('patch',`/rooms/${id}/status`,{status}),
  archive:(id:string)=>one('post',`/rooms/${id}/archive`),
  getBeds:async(id:string)=>(await roomService.getRoomById(id)).beds,
  findBed:async(roomId:string,bedId:string)=>(await roomService.getBeds(roomId)).find(b=>b.id===bedId)??null,
  updateBed:(_roomId:string,bedId:string,status:Bed['status'])=>one('patch',`/beds/${bedId}/status`,{status}),
  async assignBed(roomId:string,bedId:string,input:AssignBedInput) {
    await workflowRequest('post',`/tenants/${input.tenantId}/allocate`,{roomId,bedId,moveInDate:input.moveInDate});
    return roomService.getRoomById(roomId);
  },
  releaseBed:(_roomId:string,bedId:string)=>one('post',`/beds/${bedId}/release`),
  occupancyFor:(room:Room)=>calculateRoomOccupancy(room),
};
