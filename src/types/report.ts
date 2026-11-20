export const ReportType = {
  OCCUPANCY: 'OCCUPANCY',
  REVENUE: 'REVENUE',
  PAYMENTS: 'PAYMENTS',
  OUTSTANDING: 'OUTSTANDING',
  EXPENSES: 'EXPENSES',
  TENANTS: 'TENANTS',
  COMPLAINTS: 'COMPLAINTS',
  VISITORS: 'VISITORS',
  LEAVE: 'LEAVE',
  MAINTENANCE: 'MAINTENANCE',
} as const;

export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  OCCUPANCY: 'Occupancy Report',
  REVENUE: 'Revenue Report',
  PAYMENTS: 'Payment Report',
  OUTSTANDING: 'Outstanding Dues Report',
  EXPENSES: 'Expense Report',
  TENANTS: 'Tenant Report',
  COMPLAINTS: 'Complaint Report',
  VISITORS: 'Visitor Report',
  LEAVE: 'Leave Report',
  MAINTENANCE: 'Maintenance Report',
};

export const FINANCE_REPORT_TYPES: ReportType[] = [
  ReportType.REVENUE,
  ReportType.PAYMENTS,
  ReportType.OUTSTANDING,
  ReportType.EXPENSES,
];

export interface ReportFilters {
  type: ReportType;
  propertyId: string;
  fromDate: string;
  toDate: string;
  status: string;
  category: string;
}

export interface ReportMetric {
  id: string;
  label: string;
  value: string;
  tone?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
}

export interface ReportBreakdownRow {
  id: string;
  label: string;
  values: Record<string, string | number>;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  metrics: ReportMetric[];
  columns: { id: string; header: string }[];
  rows: ReportBreakdownRow[];
  trend?: { label: string; value: number }[];
}
