import { workflowRequest, workflowList } from '@/services/http/workflows';
export interface FinancePage<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}
export type FinanceQuery = Record<string, string | number | undefined>;
export function financeUrl(path: string, filters: FinanceQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return `${path.startsWith('/') ? path : `/finance/${path}`}?${params}`;
}
export const financePage = <T>(path: string, filters: FinanceQuery = {}) =>
  workflowRequest<FinancePage<T>>('get', financeUrl(path, filters));
export const financeList = <T>(path: string, filters: FinanceQuery = {}) =>
  workflowList<T>(financeUrl(path, filters));
const submissions = new Map<string, string>();
/** Keep the key after a failed/ambiguous request so retry cannot duplicate a commit. */
export async function financeCreate<T>(path: string, values: unknown): Promise<T> {
  const signature = `${path}:${JSON.stringify(values)}`;
  const key = submissions.get(signature) ?? crypto.randomUUID();
  submissions.set(signature, key);
  const result = await workflowRequest<T>('post', `/finance/${path}`, values, {
    'Idempotency-Key': key,
  });
  submissions.delete(signature);
  return result;
}
