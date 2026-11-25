export const appConfig = {
  name: 'StayOps',
  tagline: 'Smart PG & Hostel Management System',
  description: 'Manage your property, tenants and finances efficiently.',
  apiBaseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1',
} as const;
