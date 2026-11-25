import axios from 'axios';
import { appConfig } from '@/config/app';
import {
  applySession,
  clearSession,
  getAccessToken,
  type TokenResponse,
} from '@/services/auth/session';

const options = {
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-StayOps-CSRF': '1' },
};
// Separate transport prevents refresh/login failures from recursively refreshing.
export const authClient = axios.create(options);
export const httpClient = axios.create(options);
let refreshing: Promise<TokenResponse> | null = null;

export function refreshSession(): Promise<TokenResponse> {
  if (!refreshing) {
    const request = async () => {
      const { data } = await authClient.post<TokenResponse>('/auth/refresh');
      applySession(data);
      return data;
    };
    // Serialize cookie rotation between tabs as well as within this tab.
    refreshing = (
      typeof navigator !== 'undefined' && navigator.locks
        ? navigator.locks.request('stayops-auth-cookie', request)
        : request()
    )
      .catch((error: unknown) => {
        clearSession();
        throw error;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}
export async function settleRefresh(): Promise<void> {
  if (refreshing) await refreshing.catch(() => undefined);
}
httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
httpClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) throw error;
    const config = error.config as typeof error.config & { _authRetried?: boolean };
    if (config._authRetried) {
      clearSession();
      throw error;
    }
    config._authRetried = true;
    const latest = getAccessToken();
    // A concurrent request may already have refreshed while this response was in flight.
    if (!latest || config.headers.get('Authorization') === `Bearer ${latest}`)
      await refreshSession();
    config.headers.set('Authorization', `Bearer ${getAccessToken()}`);
    return httpClient.request(config);
  },
);
