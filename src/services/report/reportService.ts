import { financeUrl } from '@/services/finance/api';
import { workflowRequest } from '@/services/http/workflows';
import type { ReportFilters, ReportResult } from '@/types/report';

export const reportService = {
  getReport({ type, ...filters }: ReportFilters) {
    return workflowRequest<ReportResult>('get', financeUrl(`reports/${type}`, filters));
  },
};
