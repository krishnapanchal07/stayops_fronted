export const ChargeType = {
  RENT: 'RENT',
  ELECTRICITY: 'ELECTRICITY',
  MAINTENANCE: 'MAINTENANCE',
  LATE_FEE: 'LATE_FEE',
  OTHER: 'OTHER',
  DISCOUNT: 'DISCOUNT',
} as const;

export type ChargeType = (typeof ChargeType)[keyof typeof ChargeType];

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  SUCCESS: 'SUCCESS',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const ExpenseCategory = {
  ELECTRICITY: 'ELECTRICITY',
  WATER: 'WATER',
  INTERNET: 'INTERNET',
  MAINTENANCE: 'MAINTENANCE',
  CLEANING: 'CLEANING',
  SALARY: 'SALARY',
  SUPPLIES: 'SUPPLIES',
  REPAIRS: 'REPAIRS',
  OTHER: 'OTHER',
} as const;

export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const ExpenseStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  CANCELLED: 'CANCELLED',
} as const;

export type ExpenseStatus = (typeof ExpenseStatus)[keyof typeof ExpenseStatus];

export const CHARGE_TYPE_LABELS: Record<ChargeType, string> = {
  RENT: 'Rent',
  ELECTRICITY: 'Electricity',
  MAINTENANCE: 'Maintenance',
  LATE_FEE: 'Late Fee',
  OTHER: 'Other',
  DISCOUNT: 'Discount',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Due',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CARD: 'Card',
  OTHER: 'Other',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  SUCCESS: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ELECTRICITY: 'Electricity',
  WATER: 'Water',
  INTERNET: 'Internet',
  MAINTENANCE: 'Maintenance',
  CLEANING: 'Cleaning',
  SALARY: 'Salary',
  SUPPLIES: 'Supplies',
  REPAIRS: 'Repairs',
  OTHER: 'Other',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
};

export interface InvoiceItem {
  id: string;
  type: ChargeType;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  propertyId: string;
  propertyName: string;
  roomId: string | null;
  roomNumber: string | null;
  bedLabel: string | null;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  discount: number;
  lateFee: number;
  cancelled: boolean;
  createdAt: string;
  updatedAt: string;
  subtotal: number;
  total: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  propertyId: string;
  propertyName: string;
  roomId: string | null;
  roomNumber: string | null;
  bedLabel: string | null;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  discount: number;
  lateFee: number;
  cancelled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  propertyId: string;
  propertyName: string;
  roomNumber: string | null;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  propertyId: string;
  propertyName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface InvoiceFilters {
  query: string;
  propertyId: string;
  tenantId: string;
  status: InvoiceStatus | '';
  billingPeriod: string;
  dueStatus: '' | 'DUE' | 'OVERDUE' | 'PAID';
}

export interface PaymentFilters {
  query: string;
  propertyId: string;
  tenantId: string;
  status: PaymentStatus | '';
  method: PaymentMethod | '';
  billingPeriod: string;
  fromDate: string;
  toDate: string;
}

export interface ExpenseFilters {
  query: string;
  propertyId: string;
  category: ExpenseCategory | '';
  status: ExpenseStatus | '';
  fromDate: string;
  toDate: string;
}

export interface InvoiceFormValues {
  tenantId: string;
  billingPeriod: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  discount: number;
  lateFee: number;
}

export interface PaymentFormValues {
  tenantId: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  reference: string;
  notes: string;
}

export interface ExpenseFormValues {
  propertyId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  vendor: string;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  notes: string;
}

export interface TenantFinancialSummary {
  tenantId: string;
  currentDue: number;
  overdue: number;
  totalPaid: number;
  currentMonthCharges: number;
  securityDeposit: number;
  nextDueDate: string | null;
  recentPayments: Payment[];
  openInvoices: Invoice[];
}

export interface FinanceOverview {
  billed: number;
  collected: number;
  outstanding: number;
  overdue: number;
  overdueAccounts: number;
  thisMonthCollected: number;
  todayCollected: number;
  pendingPayments: number;
  expenses: number;
  thisMonthExpenses: number;
  thisYearExpenses: number;
  netIncome: number;
  collectionRate: number;
  expenseBreakdown: { category: ExpenseCategory; amount: number }[];
  collectionTrend: { label: string; value: number }[];
  dueToday: { id: string; tenant: string; room: string; amount: number; dueDate: string; invoiceId: string }[];
  recentPayments: { id: string; title: string; detail: string; time: string }[];
  paymentMethods: { name: string; value: number }[];
  pendingInvoiceRows: {
    id: string;
    tenant: string;
    room: string;
    amount: number;
    dueDate: string;
    status: 'Overdue' | 'Due';
  }[];
}
