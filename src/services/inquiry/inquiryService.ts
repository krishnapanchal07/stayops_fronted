/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }] -- Legacy arguments are retained for callers; authorization comes from the API. */
import { workflowList, workflowRequest } from '@/services/http/workflows';
import type { ConvertInquiryOptions, Inquiry, InquiryFilters, InquiryFormValues, InquiryStatus, InquirySummary } from '@/types/inquiry';
import type { Tenant } from '@/types/tenant';

export interface SubmitInquiryInput extends InquiryFormValues {
  roomId: string;
  bedId?: string;
  userId?: string | null;
  actor?: string;
  idempotencyKey?: string;
}
// Property scopes, ownership and actors are always resolved by the server.
export const inquiryService = {
  getInventoryAvailability(): Promise<Record<string, Record<string, boolean>>> { return workflowRequest('get', '/inquiries/availability'); },
  getInquiries(_propertyIds?: string[]): Promise<Inquiry[]> { return workflowList('/inquiries'); },
  getInquiryById(id: string, _propertyIds?: string[]): Promise<Inquiry> {
    return workflowRequest('get', `/inquiries/${encodeURIComponent(id)}`);
  },
  searchInquiries(filters: InquiryFilters, _propertyIds?: string[]): Promise<Inquiry[]> {
    return workflowList(`/inquiries?${new URLSearchParams({ ...filters })}`);
  },
  getInquirySummary(_propertyIds?: string[]): Promise<InquirySummary> { return workflowRequest('get', '/inquiries/summary'); },
  getMyInquiries(_email?: string, _userId?: string | null): Promise<Inquiry[]> { return workflowList('/inquiries/me'); },
  getMyInquiryById(id: string, _email?: string, _userId?: string | null): Promise<Inquiry> {
    return workflowRequest('get', `/inquiries/${encodeURIComponent(id)}`);
  },
  submitInquiry(input: SubmitInquiryInput): Promise<Inquiry> {
    const { firstName, lastName, email, phone, roomId, bedId, preferredMoveIn, message } = input;
    return workflowRequest('post', '/inquiries', {
      firstName, lastName, email, phone: phone.replace(/\D/g, ''), roomId, bedId: bedId || null,
      preferredMoveIn: preferredMoveIn || null, message,
    }, { 'Idempotency-Key': input.idempotencyKey ?? crypto.randomUUID() });
  },
  submitGeneralInquiry(input: { name: string; email: string; inquiryType: string }, key: string): Promise<Inquiry> {
    return workflowRequest('post', '/inquiries/general', input, { 'Idempotency-Key': key });
  },
  changeInquiryStatus(id: string, status: InquiryStatus, _actor: string, note?: string, _propertyIds?: string[]): Promise<Inquiry> {
    return workflowRequest('patch', `/inquiries/${encodeURIComponent(id)}/status`, { status, note });
  },
  withdrawInquiry(id: string, _email?: string, _userId?: string | null, _actor?: string): Promise<Inquiry> {
    return workflowRequest('post', `/inquiries/${encodeURIComponent(id)}/withdraw`);
  },
  convertInquiryToTenant(id: string, options: ConvertInquiryOptions, _propertyIds?: string[]): Promise<{ inquiry: Inquiry; tenant: Tenant }> {
    return workflowRequest('post', `/inquiries/${encodeURIComponent(id)}/convert`, { allocateBed: options.allocateBed });
  },
};
