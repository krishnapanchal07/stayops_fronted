import { workflowRequest } from '@/services/http/workflows';
import type { PropertyBuilding, PropertyFloor } from '@/types/property';
export interface BuildingInput {name:string;buildingCode:string;description:string;status:string}
export interface FloorInput {name:string;floorNumber:number;description:string;status:string}
export const inventoryService={
  buildings:(id:string)=>workflowRequest<PropertyBuilding[]>('get',`/properties/${id}/buildings`),
  floors:(id:string)=>workflowRequest<PropertyFloor[]>('get',`/buildings/${id}/floors`),
  building:(id:string)=>workflowRequest<PropertyBuilding>('get',`/buildings/${id}`),
  createBuilding:(id:string,data:BuildingInput)=>workflowRequest<PropertyBuilding>('post',`/properties/${id}/buildings`,data),
  updateBuilding:(id:string,data:BuildingInput)=>workflowRequest<PropertyBuilding>('patch',`/buildings/${id}`,data),
  createFloor:(id:string,data:FloorInput)=>workflowRequest<PropertyFloor>('post',`/buildings/${id}/floors`,data),
  updateFloor:(id:string,data:FloorInput)=>workflowRequest<PropertyFloor>('patch',`/floors/${id}`,data),
};
