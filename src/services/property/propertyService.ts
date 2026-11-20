import seedProperties from '@/mock/properties.json';
import seedRules from '@/mock/propertyRules.json';
import type {
  Property,
  PropertyBuilding,
  PropertyFilters,
  PropertyFormValues,
  PropertyListItem,
  PropertySummary,
} from '@/types/property';
import { PropertyStatus } from '@/types/property';
import {
  filterProperties,
  summarizeProperties,
  toPropertyListItem,
} from '@/utils/propertyStats';

let properties = structuredClone(seedProperties) as Property[];
const propertyRules = seedRules as Record<string, string[]>;

function wait<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'property';
}

function createId(prefix: string, name: string): string {
  return `${prefix}-${slugify(name)}-${Date.now().toString(36)}`;
}

/**
 * Property reads and mock mutations go through this service so Phase 3
 * can replace the in-memory store with Axios → FastAPI.
 */
export const propertyService = {
  getProperties(): Promise<PropertyListItem[]> {
    return wait(properties.map((property) => toPropertyListItem(clone(property))));
  },

  getPropertyById(id: string): Promise<PropertyListItem> {
    const property = properties.find((item) => item.id === id);
    if (!property) {
      return Promise.reject(new Error('Property not found.'));
    }
    return wait(toPropertyListItem(clone(property)));
  },

  searchProperties(filters: PropertyFilters): Promise<PropertyListItem[]> {
    return wait(filterProperties(properties, filters).map((property) => toPropertyListItem(clone(property))));
  },

  getPropertySummary(): Promise<PropertySummary> {
    return wait(summarizeProperties(properties));
  },

  getPropertyRules(propertyId: string): Promise<string[]> {
    return wait(propertyRules[propertyId] ?? [
      'Quiet hours are 10:00 PM to 6:00 AM.',
      'Visitors need an approved pass before arriving at the gate.',
      'Smoking is not allowed in rooms or common areas.',
    ]);
  },

  createProperty(values: PropertyFormValues): Promise<PropertyListItem> {
    const created: Property = {
      id: createId('prop', values.name),
      ...values,
      monthlyRevenue: 0,
      buildings: [],
      recentActivity: [
        {
          id: createId('act', 'created'),
          title: 'Property created',
          detail: `${values.name} was added to StayOps`,
          time: 'Just now',
        },
      ],
    };

    properties = [created, ...properties];
    return wait(toPropertyListItem(clone(created)));
  },

  updateProperty(id: string, values: PropertyFormValues): Promise<PropertyListItem> {
    const index = properties.findIndex((item) => item.id === id);
    if (index === -1) {
      return Promise.reject(new Error('Property not found.'));
    }

    const updated: Property = {
      ...properties[index],
      ...values,
      recentActivity: [
        {
          id: createId('act', 'updated'),
          title: 'Property updated',
          detail: `${values.name} details were saved`,
          time: 'Just now',
        },
        ...properties[index].recentActivity,
      ].slice(0, 6),
    };

    properties = properties.map((item, itemIndex) => (itemIndex === index ? updated : item));
    return wait(toPropertyListItem(clone(updated)));
  },

  togglePropertyStatus(id: string): Promise<PropertyListItem> {
    const index = properties.findIndex((item) => item.id === id);
    if (index === -1) {
      return Promise.reject(new Error('Property not found.'));
    }

    const current = properties[index];
    const nextStatus =
      current.status === PropertyStatus.ACTIVE ? PropertyStatus.INACTIVE : PropertyStatus.ACTIVE;
    const updated: Property = {
      ...current,
      status: nextStatus,
      recentActivity: [
        {
          id: createId('act', 'status'),
          title: nextStatus === PropertyStatus.ACTIVE ? 'Property activated' : 'Property deactivated',
          detail: `${current.name} is now ${nextStatus.toLowerCase()}`,
          time: 'Just now',
        },
        ...current.recentActivity,
      ].slice(0, 6),
    };

    properties = properties.map((item, itemIndex) => (itemIndex === index ? updated : item));
    return wait(toPropertyListItem(clone(updated)));
  },

  updateBuilding(propertyId: string, buildingId: string, name: string): Promise<PropertyBuilding> {
    const property = properties.find((item) => item.id === propertyId);
    if (!property) {
      return Promise.reject(new Error('Property not found.'));
    }

    const building = property.buildings.find((item) => item.id === buildingId);
    if (!building) {
      return Promise.reject(new Error('Building not found.'));
    }

    const updatedBuilding = { ...building, name: name.trim() };
    property.buildings = property.buildings.map((item) => (item.id === buildingId ? updatedBuilding : item));
    property.recentActivity = [
      {
        id: createId('act', 'building'),
        title: 'Building updated',
        detail: `${updatedBuilding.name} was renamed`,
        time: 'Just now',
      },
      ...property.recentActivity,
    ].slice(0, 6);

    return wait(clone(updatedBuilding));
  },
};
