import axios from 'axios';
import { appConfig } from '@/config/app';

/**
 * Shared Axios instance reserved for Phase 3 FastAPI integration.
 *
 * ASSUMPTION: Pages and hooks must never call this client directly.
 * They go through a service layer (e.g. roomService.getRooms()).
 * Phase 1/2 service implementations read isolated mock data, not this client.
 */
export const httpClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
