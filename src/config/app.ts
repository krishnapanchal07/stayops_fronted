export const appConfig = {
  name: 'StayOps',
  tagline: 'Smart PG & Hostel Management System',
  description: 'Manage your property, tenants and finances efficiently.',
  /**
   * Phase 1 uses local mock/session storage only.
   * Phase 3 will read VITE_API_URL for the FastAPI backend.
   */
  apiBaseUrl: import.meta.env.VITE_API_URL ?? '',
} as const;
