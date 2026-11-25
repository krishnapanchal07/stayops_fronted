import { workflowRequest, workflowList } from '@/services/http/workflows';
import { httpClient } from '@/services/http/client';
import type { PropertyBuilding, PropertyFilters, PropertyFormValues, PropertyListItem, PropertySummary, PropertyImage } from '@/types/property';
import { appConfig } from '@/config/app';

export function imageUrl(path: string): string {
  return new URL(path, new URL(appConfig.apiBaseUrl, window.location.origin).origin).href;
}
export const propertyService = {
  getProperties: () => workflowList<PropertyListItem>('/properties'),
  getPublicProperties: () => workflowList<PropertyListItem>('/public/properties'),
  getPublicPropertyById: (id: string) => workflowRequest<PropertyListItem>('get', `/public/properties/${id}`),
  getPropertyById: (id: string) => workflowRequest<PropertyListItem>('get', `/properties/${id}`),
  getPage: (params: URLSearchParams) => workflowRequest<{items: PropertyListItem[]; total: number}>('get', `/properties?${params}`),
  searchProperties: (filters: PropertyFilters) => workflowList<PropertyListItem>(`/properties?${new URLSearchParams({...filters})}`),
  getPropertySummary: () => workflowRequest<PropertySummary & {cities: string[]}>('get','/properties/summary'),
  getOwners: () => workflowRequest<{id:string;name:string}[]>('get','/properties/owners'),
  getPropertyRules: async (propertyId: string): Promise<string[]> => { void propertyId; return []; },
  createProperty: (values: PropertyFormValues) => workflowRequest<PropertyListItem>('post','/properties',values),
  updateProperty: (id: string, values: PropertyFormValues) => workflowRequest<PropertyListItem>('patch',`/properties/${id}`,values),
  togglePropertyStatus: async (id: string) => {
    const property = await propertyService.getPropertyById(id);
    return workflowRequest<PropertyListItem>('patch',`/properties/${id}/status`,{status:property.status==='ACTIVE'?'INACTIVE':'ACTIVE'});
  },
  archive: (id: string) => workflowRequest<PropertyListItem>('post',`/properties/${id}/archive`),
  upload: async (id: string, files: File[]) => {
    const data = new FormData();
    files.forEach(file => data.append('files',file));
    return (await httpClient.post<PropertyImage[]>(`/properties/${id}/images`,data,{headers:{'Content-Type':undefined},timeout:120000})).data;
  },
  deleteImage: async (id: string, imageId: string) => httpClient.delete(`/properties/${id}/images/${imageId}`),
  cover: (id: string, imageId: string) => workflowRequest<PropertyImage[]>('patch',`/properties/${id}/cover-image`,{imageId}),
  order: (id: string, imageIds: string[]) => workflowRequest<PropertyImage[]>('patch',`/properties/${id}/images/order`,{imageIds}),
  updateBuilding: async (_propertyId: string, id: string, name: string): Promise<PropertyBuilding> => {
    const b=await workflowRequest<PropertyBuilding>('get',`/buildings/${id}`);
    return workflowRequest<PropertyBuilding>('patch',`/buildings/${id}`,{name,buildingCode:b.buildingCode,description:b.description,status:b.status});
  },
};
