import axios from 'axios';
import { httpClient } from '@/services/http/client';

export async function workflowRequest<T>(method: 'get' | 'post' | 'patch', url: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
  try {
    return (await httpClient.request<T>({ method, url, data, headers })).data;
  } catch (cause) {
    if (axios.isAxiosError(cause)) {
      const message = cause.response?.data?.error?.message;
      throw new Error(typeof message === 'string' ? message : 'Unable to reach StayOps. Please try again.', { cause });
    }
    throw cause;
  }
}
interface Page<T> { items: T[]; total: number; offset: number; limit: number }
/** Preserve existing array service contracts while consuming bounded API pages. */
export async function workflowList<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  while (true) {
    const page = await workflowRequest<Page<T>>('get', `${url}${url.includes('?') ? '&' : '?'}offset=${offset}&limit=100`);
    items.push(...page.items);
    offset += page.items.length;
    if (offset >= page.total || page.items.length === 0) return items;
  }
}
